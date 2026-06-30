const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getSynonyms, getAssociations } = require('./synonymEngine');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const sessions = {};
const turnTimers = {};
const TURN_TIME_LIMIT = 30;
const BUZZER_WINDOW = 3;

function clearTurnTimer(sessionId) {
  if (turnTimers[sessionId]) { clearTimeout(turnTimers[sessionId]); delete turnTimers[sessionId]; }
}

function startTurnTimer(sessionId) {
  clearTurnTimer(sessionId);
  const s = getSession(sessionId);
  if (!s || s.phase !== 'playing') return;
  io.to(sessionId).emit('turn_timer', { playerId: currentTurnPlayerId(s), seconds: TURN_TIME_LIMIT });
  turnTimers[sessionId] = setTimeout(() => {
    const s = getSession(sessionId);
    if (!s || s.phase !== 'playing') return;
    const playerId = currentTurnPlayerId(s);
    const hand = s.cards[playerId];
    if (!hand || hand.length === 0) return;
    const randomCard = hand[Math.floor(Math.random() * hand.length)];
    doPassCard(s, playerId, randomCard, sessionId, true);
  }, TURN_TIME_LIMIT * 1000);
}

function checkFirstRoundComplete(s, passingPlayerId) {
  if (s.firstRoundOver) return;
  if (passingPlayerId === s.starterPlayerId && !s.starterHasPassed) {
    s.starterHasPassed = true;
    return;
  }
  const nextIdx = (s.turnOrder.indexOf(passingPlayerId) + 1) % s.turnOrder.length;
  if (s.starterHasPassed && s.turnOrder[nextIdx] === s.starterPlayerId) {
    s.firstRoundOver = true;
    io.to(s.id).emit('buzzer_unlocked', { message: 'Round 1 complete! Buzzer is now active.' });
  }
}

function createSession(hostId, hostName, rounds, gameMode, difficulty) {
  const id = Math.random().toString(36).substring(2, 7).toUpperCase();
  sessions[id] = {
    id, hostId, rounds: rounds || 5, currentRound: 0, phase: 'lobby',
    gameMode: gameMode || 'education', difficulty: difficulty || 'medium',
    players: [], wordSubmissions: {}, synonymClusters: {}, cards: {},
    turnOrder: [], currentTurnIndex: 0,
    starterPlayerId: null, starterHasPassed: false, firstRoundOver: false,
    buzzerActive: false, buzzerWindowOpen: {},
    buzzerLog: [], roundScores: [], totalScores: {},
  };
  return sessions[id];
}

function getSession(id) { return sessions[id]; }
function addPlayer(s, pid, name) {
  if (s.players.find(p => p.id === pid)) return;
  s.players.push({ id: pid, name, connected: true });
  s.totalScores[pid] = 0;
}
function currentTurnPlayerId(s) { return s.turnOrder[s.currentTurnIndex]; }
function advanceTurn(s) { s.currentTurnIndex = (s.currentTurnIndex + 1) % s.turnOrder.length; }
function nextPlayerId(s, cid) { const i = s.turnOrder.indexOf(cid); return s.turnOrder[(i + 1) % s.turnOrder.length]; }

function isCompleteSet(hand, clusters) {
  if (!hand || hand.length < 3) return false;
  const h = hand.slice(0, 3).map(w => w.toLowerCase().trim());
  for (const [, c] of Object.entries(clusters)) {
    const cw = c.map(x => x.toLowerCase().trim());
    if (cw.length >= 3 && h.every(w => cw.includes(w))) return true;
  }
  return false;
}

function scoreRound(s) {
  const pts = [10, 7, 5, 3, 1]; const res = []; let vi = 0;
  s.buzzerLog.forEach((e, i) => {
    const complete = !e.invalid && !e.autoBuzzed && isCompleteSet(s.cards[e.playerId], s.synonymClusters);
    const points = complete ? (pts[vi] || 1) : 0;
    if (complete) vi++;
    res.push({ playerId: e.playerId, points, hasCompleteSet: complete, invalid: !!e.invalid, buzzerOrder: i + 1 });
    s.totalScores[e.playerId] = (s.totalScores[e.playerId] || 0) + points;
  });
  s.roundScores = res; return res;
}

function doPassCard(s, playerId, cardToPass, sessionId, isAutoPass = false) {
  const hand = s.cards[playerId];
  if (!hand || !hand.includes(cardToPass)) return;
  s.cards[playerId] = hand.filter(c => c !== cardToPass);
  const next = nextPlayerId(s, playerId);
  s.cards[next].push(cardToPass);
  checkFirstRoundComplete(s, playerId);

  // Open 3 second buzzer window for passer
  if (s.firstRoundOver && !s.buzzerActive) {
    s.buzzerWindowOpen[playerId] = true;
    setTimeout(() => {
      if (s.buzzerWindowOpen) s.buzzerWindowOpen[playerId] = false;
      io.to(sessionId).emit('buzzer_window_closed', { playerId });
    }, BUZZER_WINDOW * 1000);
    io.to(sessionId).emit('buzzer_window_open', { playerId, seconds: BUZZER_WINDOW });
  }

  advanceTurn(s);
  if (isAutoPass) {
    io.to(sessionId).emit('auto_passed', {
      playerId, playerName: s.players.find(p => p.id === playerId)?.name, card: cardToPass
    });
  }
  io.to(sessionId).emit('session_update', sanitize(s));
  broadcastHands(s);
  io.to(sessionId).emit('card_incoming', {
    toPlayerId: next, fromPlayerName: s.players.find(p => p.id === playerId)?.name
  });
  if (!isAutoPass) startTurnTimer(sessionId);
}

function finishRound(sessionId) {
  clearTurnTimer(sessionId);
  const s = getSession(sessionId); if (!s) return;
  const res = scoreRound(s);
  s.phase = 'scoring';
  io.to(sessionId).emit('round_scored', {
    roundScores: res.map(r => ({
      ...r, playerName: s.players.find(p => p.id === r.playerId)?.name, hand: s.cards[r.playerId]
    })),
    totalScores: s.players.map(p => ({ playerId: p.id, playerName: p.name, total: s.totalScores[p.id] || 0 })),
    synonymClusters: s.synonymClusters, round: s.currentRound
  });
  io.to(sessionId).emit('session_update', sanitize(s));
}

// REST
app.post('/session/create', (req, res) => {
  const { playerName, rounds, gameMode, difficulty } = req.body;
  const playerId = uuidv4();
  const s = createSession(playerId, playerName, rounds, gameMode, difficulty);
  addPlayer(s, playerId, playerName);
  res.json({ sessionId: s.id, playerId, gameMode: s.gameMode, difficulty: s.difficulty });
});
app.get('/session/:id', (req, res) => {
  const s = getSession(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json({ id: s.id, phase: s.phase, playerCount: s.players.length, rounds: s.rounds });
});
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build', 'index.html')));

// Socket
io.on('connection', (socket) => {
  socket.on('join_session', ({ sessionId, playerId, playerName }) => {
    const s = getSession(sessionId);
    if (!s) { socket.emit('error', { message: 'Session not found' }); return; }
    addPlayer(s, playerId, playerName); socket.join(sessionId); socket.data = { sessionId, playerId };
    io.to(sessionId).emit('session_update', sanitize(s));
  });

  socket.on('start_submission', ({ sessionId }) => {
    const s = getSession(sessionId); if (!s) return;
    s.phase = 'submit'; io.to(sessionId).emit('session_update', sanitize(s));
  });

  socket.on('submit_word', async ({ sessionId, playerId, word }) => {
    const s = getSession(sessionId); if (!s || s.phase !== 'submit') return;
    const cleaned = word.trim().toLowerCase();
    if (Object.values(s.wordSubmissions).map(w => w.toLowerCase()).includes(cleaned)) {
      socket.emit('word_error', { message: 'Word already submitted. Try another.' }); return;
    }
    s.wordSubmissions[playerId] = cleaned;
    io.to(sessionId).emit('session_update', sanitize(s));
    if (Object.keys(s.wordSubmissions).length === s.players.length) {
      s.phase = 'loading'; io.to(sessionId).emit('session_update', sanitize(s));
      try {
        await dealCards(s);
        s.currentRound = 1; s.firstRoundOver = false; s.starterHasPassed = false;
        s.buzzerActive = false; s.buzzerWindowOpen = {};
        buildTurnOrder(s); s.phase = 'playing';
        io.to(sessionId).emit('session_update', sanitize(s));
        broadcastHands(s); startTurnTimer(sessionId);
      } catch (err) {
        console.error(err); s.phase = 'submit';
        io.to(sessionId).emit('error', { message: 'Error generating words. Try again.' });
        io.to(sessionId).emit('session_update', sanitize(s));
      }
    }
  });

  socket.on('pass_card', ({ sessionId, playerId, cardToPass }) => {
    const s = getSession(sessionId); if (!s || s.phase !== 'playing') return;
    if (currentTurnPlayerId(s) !== playerId) { socket.emit('error', { message: "Not your turn." }); return; }
    if (!s.cards[playerId]?.includes(cardToPass)) { socket.emit('error', { message: 'Card not in hand.' }); return; }
    clearTurnTimer(sessionId);
    doPassCard(s, playerId, cardToPass, sessionId, false);
  });

  socket.on('press_buzzer', ({ sessionId, playerId }) => {
    const s = getSession(sessionId); if (!s) return;
    if (s.phase !== 'playing' && s.phase !== 'buzzing') return;
    if (s.buzzerLog.find(b => b.playerId === playerId)) return;

    const buzzerBeforeRound1 = !s.firstRoundOver;

    if (!s.buzzerActive) {
      const inWindow = s.buzzerWindowOpen && s.buzzerWindowOpen[playerId];
      const isTheirTurn = currentTurnPlayerId(s) === playerId;
      if (!inWindow && !isTheirTurn) {
        socket.emit('error', { message: 'Buzz right after passing a card!' }); return;
      }
      s.buzzerActive = true; s.phase = 'buzzing'; s.buzzerLog = [];
      clearTurnTimer(sessionId);
      io.to(sessionId).emit('buzzer_race_started', {
        firstPlayerId: playerId, firstPlayerName: s.players.find(p => p.id === playerId)?.name
      });
    }

    const hasCompleteSet = !buzzerBeforeRound1 && isCompleteSet(s.cards[playerId], s.synonymClusters);
    s.buzzerLog.push({ playerId, timestamp: Date.now(), hasCompleteSet, invalid: buzzerBeforeRound1 });
    io.to(sessionId).emit('buzzer_pressed', {
      playerId, playerName: s.players.find(p => p.id === playerId)?.name,
      hasCompleteSet, invalid: buzzerBeforeRound1, buzzerLog: s.buzzerLog
    });
    io.to(sessionId).emit('session_update', sanitize(s));
    if (s.buzzerLog.length === s.players.length) finishRound(sessionId);
  });

  socket.on('next_round', ({ sessionId }) => {
    const s = getSession(sessionId); if (!s || s.phase !== 'scoring') return;
    clearTurnTimer(sessionId);
    if (s.currentRound >= s.rounds) {
      s.phase = 'ended';
      io.to(sessionId).emit('game_ended', {
        finalScores: s.players.map(p => ({ playerId: p.id, playerName: p.name, total: s.totalScores[p.id] || 0 }))
          .sort((a, b) => b.total - a.total)
      });
      io.to(sessionId).emit('session_update', sanitize(s));
    } else {
      s.currentRound++; s.phase = 'submit';
      s.wordSubmissions = {}; s.synonymClusters = {}; s.cards = {};
      s.buzzerLog = []; s.roundScores = [];
      s.starterPlayerId = null; s.starterHasPassed = false;
      s.firstRoundOver = false; s.buzzerActive = false; s.buzzerWindowOpen = {};
      io.to(sessionId).emit('session_update', sanitize(s));
    }
  });

  socket.on('disconnect', () => {
    const { sessionId, playerId } = socket.data || {};
    if (sessionId && playerId) {
      const s = getSession(sessionId);
      if (s) { const p = s.players.find(x => x.id === playerId); if (p) p.connected = false; io.to(sessionId).emit('session_update', sanitize(s)); }
    }
  });
});

async function dealCards(s) {
  const pids = s.players.map(p => p.id);
  const numPlayers = pids.length;
  // Total cards needed = numPlayers * 3 + 1 (starter's extra card)
  // ALL must be unique words across the ENTIRE game

  const globalSeen = new Set(); // tracks every word used so far, across ALL clusters
  const GENERIC_BACKUP = ['nice','good','fine','okay','plain','basic','simple','common','usual','normal','steady','gentle','quiet','calm','clear'];
  let genericIdx = 0;

  function takeUnique(words, excludeWord) {
    // Filters a word list down to ones not yet used anywhere, and not the submitted word itself
    const out = [];
    for (const w of words) {
      const lower = (w || '').toLowerCase().trim();
      if (!lower) continue;
      if (lower === excludeWord) continue;
      if (globalSeen.has(lower)) continue;
      if (!/^[a-z]+$/.test(lower)) continue;
      globalSeen.add(lower);
      out.push(lower);
    }
    return out;
  }

  // Step 1: For each player's submitted word, build a 3-word cluster
  // guaranteed unique against every other cluster generated so far
  for (const pid of pids) {
    const word = s.wordSubmissions[pid];
    const excludeWord = word.toLowerCase().trim();
    let cluster = [];

    // Attempt 1: normal fetch at requested difficulty
    const first = s.gameMode === 'fun'
      ? await getAssociations(word, s.difficulty)
      : await getSynonyms(word, s.difficulty);
    cluster.push(...takeUnique(first, excludeWord));

    // Attempt 2: fetch at 'hard' difficulty — wider word pool, likely gives NEW words
    if (cluster.length < 3) {
      const second = s.gameMode === 'fun'
        ? await getAssociations(word, 'hard')
        : await getSynonyms(word, 'hard');
      cluster.push(...takeUnique(second, excludeWord));
    }

    // Attempt 3: fetch using a plural/variant of the word — different API results
    if (cluster.length < 3) {
      const third = s.gameMode === 'fun'
        ? await getAssociations(word + 's', 'hard')
        : await getSynonyms(word + 'ness', 'hard');
      cluster.push(...takeUnique(third, excludeWord));
    }

    // Final fallback: generic backup words (never numbers, never duplicates)
    while (cluster.length < 3 && genericIdx < GENERIC_BACKUP.length) {
      const candidate = GENERIC_BACKUP[genericIdx];
      genericIdx++;
      if (!globalSeen.has(candidate)) {
        globalSeen.add(candidate);
        cluster.push(candidate);
      }
    }

    s.synonymClusters[word] = cluster.slice(0, 3);
  }

  // Step 3: Collect all unique cards into one pool
  // Pool = all cluster words (numPlayers * 3 unique words)
  const cardPool = Object.values(s.synonymClusters).flat();
  console.log(`Card pool (${cardPool.length} cards):`, cardPool.join(', '));

  // Step 4: Deal cards — each player gets exactly 3 cards
  // Distribute so cards from the SAME cluster go to DIFFERENT players
  pids.forEach(pid => { s.cards[pid] = []; });
  const clusters = Object.values(s.synonymClusters);
  clusters.forEach((cluster, ci) => {
    cluster.forEach((card, ki) => {
      // Rotate which player receives each card from this cluster
      const receiverIdx = (ci + ki) % numPlayers;
      s.cards[pids[receiverIdx]].push(card);
    });
  });

  // Step 5: Enforce exactly 3 cards per player
  pids.forEach(pid => {
    s.cards[pid] = [...new Set(s.cards[pid])].slice(0, 3);
  });

  // Step 6: Give starter the 4th card
  // CRITICAL: with numPlayers clusters of exactly 3 words each, ALL generated
  // words are always fully dealt out — there is NEVER a leftover card sitting
  // unused. So the 4th card MUST be a brand new word, fetched fresh, and
  // checked against the starter's OWN hand specifically (not just the global set).
  const si = Math.floor(Math.random() * numPlayers);
  const sid = pids[si];
  s.starterPlayerId = sid;

  // allDealt = every word currently in ANY player's hand, including starter's own 3
  const allDealt = new Set(Object.values(s.cards).flat().map(w => w.toLowerCase().trim()));
  const starterHandSet = new Set(s.cards[sid].map(w => w.toLowerCase().trim()));

  const starterWord = s.wordSubmissions[sid];
  const excludeWord = starterWord.toLowerCase().trim();

  // Try multiple fetch strategies until we get a word that is:
  //  1. Not the starter's own submitted word
  //  2. Not already in ANY player's hand (including starter's own 3 cards)
  let fourthCard = null;
  const attempts = [
    () => s.gameMode === 'fun' ? getAssociations(starterWord, s.difficulty) : getSynonyms(starterWord, s.difficulty),
    () => s.gameMode === 'fun' ? getAssociations(starterWord, 'hard') : getSynonyms(starterWord, 'hard'),
    () => s.gameMode === 'fun' ? getAssociations(starterWord + 's', 'hard') : getSynonyms(starterWord + 'ness', 'hard'),
  ];

  for (const attempt of attempts) {
    if (fourthCard) break;
    const results = await attempt();
    for (const w of results) {
      const lower = (w || '').toLowerCase().trim();
      if (!lower || lower === excludeWord) continue;
      if (allDealt.has(lower) || starterHandSet.has(lower)) continue;
      if (!/^[a-z]+$/.test(lower)) continue;
      fourthCard = lower;
      break;
    }
  }

  // Absolute last resort — guaranteed not in starter's hand or anyone else's
  if (!fourthCard) {
    const GENERIC_4TH = ['extra','bonus','spare','wildcard','surprise','mystery','secret','hidden','golden','silver'];
    fourthCard = GENERIC_4TH.find(w => !allDealt.has(w) && !starterHandSet.has(w)) || `bonus${si}`;
  }

  // Final safety check before pushing — must never equal something starter already holds
  if (starterHandSet.has(fourthCard)) {
    console.error(`4th card "${fourthCard}" was already in starter's hand! Forcing safe fallback.`);
    fourthCard = 'mystery';
  }

  s.cards[sid].push(fourthCard);

  // Step 7: Final verification — ensure ALL cards across ALL players are unique
  const finalAllCards = Object.values(s.cards).flat();
  const finalUnique = new Set(finalAllCards);
  if (finalUnique.size !== finalAllCards.length) {
    console.error('DUPLICATE CARDS DETECTED:', finalAllCards.filter((w,i) => finalAllCards.indexOf(w) !== i));
  } else {
    console.log(`✅ All ${finalAllCards.length} cards are unique (expected: ${numPlayers * 3 + 1})`);
  }

  // Log each player's hand
  pids.forEach(pid => {
    const name = s.players.find(p => p.id === pid)?.name;
    console.log(`${name} (${s.cards[pid].length} cards): [${s.cards[pid].join(', ')}]`);
  });
}

function buildTurnOrder(s) {
  const st = s.players.filter(p => p.id === s.starterPlayerId);
  const rest = s.players.filter(p => p.id !== s.starterPlayerId);
  s.turnOrder = [...st, ...rest].map(p => p.id); s.currentTurnIndex = 0;
}

function broadcastHands(s) {
  s.players.forEach(p => {
    io.to(s.id).emit(`hand_update_${p.id}`, { hand: s.cards[p.id] || [], isStarter: p.id === s.starterPlayerId });
  });
}

function sanitize(s) {
  return {
    id: s.id, hostId: s.hostId, phase: s.phase, currentRound: s.currentRound,
    rounds: s.rounds, gameMode: s.gameMode, difficulty: s.difficulty,
    players: s.players, wordSubmissions: s.wordSubmissions,
    turnOrder: s.turnOrder, currentTurnIndex: s.currentTurnIndex,
    starterPlayerId: s.starterPlayerId, starterHasPassed: s.starterHasPassed,
    firstRoundOver: s.firstRoundOver, buzzerActive: s.buzzerActive,
    buzzerLog: s.buzzerLog, totalScores: s.totalScores,
  };
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Word Harmony running on port ${PORT}`));
