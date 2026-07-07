const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getSynonyms, getAssociations, getDefinitions, getContextDefinition } = require('./synonymEngine');

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
    // scheduleBotTurn is called inside doPassCard's !isAutoPass path,
    // but auto-pass skips that — so schedule bot turn here specifically
    scheduleBotTurn(sessionId);
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
  s.players.push({ id: pid, name, connected: true, avatar: null });
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
  // Starter's buzzer activates as soon as firstRoundOver becomes true
  // (i.e. when cards have traveled all the way around back to them)
  const starterStillLocked = (playerId === s.starterPlayerId && !s.firstRoundOver);
  if (s.firstRoundOver && !s.buzzerActive && !starterStillLocked) {
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
  if (!isAutoPass) {
    startTurnTimer(sessionId);
  }
  // Always schedule bot turn regardless of auto-pass or manual pass
  // (scheduleBotTurn checks if next player is a bot before doing anything)
  scheduleBotTurn(sessionId);
}

async function finishRound(sessionId) {
  clearTurnTimer(sessionId);
  const s = getSession(sessionId); if (!s) return;
  const res = scoreRound(s);
  s.phase = 'scoring';

  // Fetch definitions for every word shown in this round's clusters
  // Fun Mode: pass cluster map so definitions include topic context
  const allWords = Object.values(s.synonymClusters).flat();
  let definitions = {};
  try {
    definitions = await getDefinitions(allWords, s.gameMode, s.synonymClusters);
  } catch (e) {
    console.warn('Failed to fetch definitions:', e.message);
  }

  io.to(sessionId).emit('round_scored', {
    roundScores: res.map(r => ({
      ...r, playerName: s.players.find(p => p.id === r.playerId)?.name, hand: s.cards[r.playerId]
    })),
    totalScores: s.players.map(p => ({ playerId: p.id, playerName: p.name, total: s.totalScores[p.id] || 0 })),
    synonymClusters: s.synonymClusters, round: s.currentRound,
    definitions
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
    // Re-send this player's hand in case they missed it (reconnect or late mount)
    if (s.phase === 'playing' || s.phase === 'buzzing') {
      if (s.cards[playerId]) {
        socket.emit(`hand_update_${playerId}`, {
          hand: s.cards[playerId] || [],
          isStarter: playerId === s.starterPlayerId,
        });
      }
    }
  });

  socket.on('update_avatar', ({ sessionId, playerId, avatar }) => {
    const s = getSession(sessionId);
    if (!s) return;
    const player = s.players.find(p => p.id === playerId);
    if (!player) return;
    // Basic guard against absurdly large payloads slipping through despite client-side resize
    if (avatar?.type === 'photo' && avatar.value && avatar.value.length > 300000) {
      socket.emit('error', { message: 'Photo too large after processing — try a different image.' });
      return;
    }
    player.avatar = avatar;
    io.to(sessionId).emit('session_update', sanitize(s));
  });

  // Player requests their hand re-sent (fallback if they missed the initial deal)
  socket.on('request_hand', ({ sessionId, playerId }) => {
    const s = getSession(sessionId); if (!s) return;
    if (s.cards[playerId]) {
      socket.emit(`hand_update_${playerId}`, {
        hand: s.cards[playerId] || [],
        isStarter: playerId === s.starterPlayerId,
      });
    }
  });

  socket.on('start_submission', ({ sessionId }) => {
    const s = getSession(sessionId); if (!s) return;
    // Fill empty player slots with bots before starting
    fillWithBots(s);
    s.phase = 'submit'; io.to(sessionId).emit('session_update', sanitize(s));
    // Trigger bot word submissions after a short delay
    s.players.filter(p => p.isBot).forEach((bot, i) => {
      setTimeout(() => botSubmitWord(sessionId, bot.id), 1500 + i * 1000);
    });
  });

  socket.on('submit_word', async ({ sessionId, playerId, word }) => {
    const s = getSession(sessionId); if (!s || s.phase !== 'submit') return;
    const cleaned = word.trim().toLowerCase();
    const existing = Object.values(s.wordSubmissions).map(w => w.toLowerCase());

    // Basic format check first
    if (!cleaned || cleaned.length < 2) {
      socket.emit('word_error', { message: 'Word must be at least 2 letters.' }); return;
    }
    if (!/^[a-z]+$/.test(cleaned)) {
      socket.emit('word_error', { message: 'Word must contain only letters — no numbers or spaces.' }); return;
    }
    // Reject obvious nonsense — no vowels or too many consecutive consonants
    if (!/[aeiou]/.test(cleaned)) {
      socket.emit('word_error', { message: `"${cleaned}" doesn't look like a real word. Please enter a valid English word.` }); return;
    }
    if (/[^aeiou]{5,}/.test(cleaned)) {
      socket.emit('word_error', { message: `"${cleaned}" doesn't look like a real word. Please enter a valid English word.` }); return;
    }

    // Dictionary check — verify the word actually exists
    socket.emit('checking_word', { message: 'Checking word...' });
    try {
      const dictResponse = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/\${encodeURIComponent(cleaned)}`,
        { timeout: 4000 }
      );
      if (!dictResponse.data || dictResponse.data.length === 0) {
        socket.emit('word_error', { message: `"\${cleaned}" was not found in the dictionary. Please enter a real English word.` });
        return;
      }
    } catch (err) {
      // If API returns 404 it means word not found
      if (err.response?.status === 404) {
        socket.emit('word_error', { message: `"\${cleaned}" was not found in the dictionary. Please enter a real English word.` });
        return;
      }
      // If API is down or times out, allow the word through (don't block players)
      console.warn('Dictionary check failed, allowing word:', err.message);
    }

    if (existing.includes(cleaned)) {
      socket.emit('word_error', { message: 'Word already submitted. Try another.' }); return;
    }

    // Education mode: also block words too similar in MEANING to existing submissions
    // (e.g. "joy" rejected if "happy" already submitted, since their synonym clusters would overlap)
    if (s.gameMode !== 'fun' && existing.length > 0) {
      socket.emit('checking_word', { message: 'Checking word...' });
      try {
        const candidateSynonyms = await getSynonyms(cleaned, 'hard');
        const candidateSet = new Set([cleaned, ...candidateSynonyms.map(w => w.toLowerCase())]);
        for (const existingWord of existing) {
          if (candidateSet.has(existingWord)) {
            socket.emit('word_error', { message: `"${cleaned}" is too similar in meaning to an already-submitted word. Try a more different word.` });
            return;
          }
          // Also check the reverse — is the existing word's synonym set overlapping with this candidate?
          const existingSynonyms = s._tempSynonymCache?.[existingWord];
          if (existingSynonyms && existingSynonyms.includes(cleaned)) {
            socket.emit('word_error', { message: `"${cleaned}" is too similar in meaning to "${existingWord}". Try a more different word.` });
            return;
          }
        }
        // Cache this word's synonyms so future submissions can check against it too
        if (!s._tempSynonymCache) s._tempSynonymCache = {};
        s._tempSynonymCache[cleaned] = candidateSynonyms.map(w => w.toLowerCase());
      } catch (e) {
        console.warn('Similarity check failed, allowing word:', e.message);
      }
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
        broadcastHands(s);
        // Delay timer start by 3 seconds to give all clients time to receive cards
        setTimeout(() => {
          const current = getSession(sessionId);
          if (current && current.phase === 'playing') {
            startTurnTimer(sessionId);
            scheduleBotTurn(sessionId);
          }
        }, 3000);
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

  socket.on('press_buzzer', async ({ sessionId, playerId }) => {
    const s = getSession(sessionId); if (!s) return;
    if (s.phase !== 'playing' && s.phase !== 'buzzing') return;
    if (s.buzzerLog.find(b => b.playerId === playerId)) return;

    const buzzerBeforeRound1 = !s.firstRoundOver;

    if (!s.buzzerActive) {
      // Starter cannot buzz until firstRoundOver (cards traveled all the way around)
      if (playerId === s.starterPlayerId && !s.firstRoundOver) {
        socket.emit('error', { message: 'As the starter, buzz once cards travel all the way back to you!' });
        return;
      }
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
      // Human started buzzing — schedule all bots to buzz after delays
      scheduleBotBuzzing(sessionId);
    }

    const hasCompleteSet = !buzzerBeforeRound1 && isCompleteSet(s.cards[playerId], s.synonymClusters);
    s.buzzerLog.push({ playerId, timestamp: Date.now(), hasCompleteSet, invalid: buzzerBeforeRound1 });
    io.to(sessionId).emit('buzzer_pressed', {
      playerId, playerName: s.players.find(p => p.id === playerId)?.name,
      hasCompleteSet, invalid: buzzerBeforeRound1, buzzerLog: s.buzzerLog
    });
    io.to(sessionId).emit('session_update', sanitize(s));
    if (s.buzzerLog.length === s.players.length) await finishRound(sessionId);
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
      // Trigger bot word submissions for next round
      s.players.filter(p => p.isBot).forEach((bot, i) => {
        setTimeout(() => botSubmitWord(sessionId, bot.id), 1500 + i * 1000);
      });
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

// ─── BOT SYSTEM ───────────────────────────────────────────────────────────────

const BOT_NAMES = [
  'Arun',    // Indian
  'Priya',   // Indian
  'Wei',     // Chinese
  'Mei',     // Chinese
  'Jisoo',   // Korean
  'Minho',   // Korean
  'Fatima',  // Arabic
  'Omar',    // Arabic
  'Yuki',    // Japanese
  'Hana',    // Japanese
  'Amara',   // African
  'Kofi',    // African (Ghanaian)
  'Sofia',   // Spanish/European
  'Mateus',  // Brazilian
  'Aisha',   // Swahili/Arabic
  'Ravi',    // Indian
];
const BOT_AVATARS = [
  { type: 'preset', value: 'robot' },  // fallback to initial letter 'W','L' etc
];

// Bot IDs are prefixed so we can identify them easily
function isBotPlayer(playerId) { return playerId.startsWith('bot_'); }

// Add bots to fill up to minPlayers (3) when game starts
function fillWithBots(session) {
  const minPlayers = 3;
  const realPlayers = session.players.filter(p => !isBotPlayer(p.id));
  const existingBots = session.players.filter(p => isBotPlayer(p.id));
  const needed = minPlayers - session.players.length;
  if (needed <= 0) return;

  const usedNames = session.players.map(p => p.name);
  const availableNames = BOT_NAMES.filter(n => !usedNames.includes(n));

  for (let i = 0; i < needed; i++) {
    const botId = `bot_${Date.now()}_${i}`;
    const botName = availableNames[i] || `Bot${i + 1}`;
    session.players.push({
      id: botId, name: botName, connected: true, avatar: null, isBot: true,
    });
    session.totalScores[botId] = 0;
  }
  console.log(`Added ${needed} bot(s) to session ${session.id}`);
}

// Bot passing delays — ALL difficulties wait 15-20s randomly
// This gives human players a fair chance to strategize before the bot passes
function botDelay(difficulty) {
  // All bots pass between 15-20 seconds (feels human, within 30s timer)
  // Hard: 12-17s (faster, more competitive)
  // Medium: 15-20s (balanced)
  // Easy: 17-22s (slower, easier to beat)
  if (difficulty === 'hard')   return 12000 + Math.random() * 5000; // 12-17s
  if (difficulty === 'easy')   return 17000 + Math.random() * 5000; // 17-22s
  return 15000 + Math.random() * 5000; // medium: 15-20s
}

// Bot card passing logic
function botChooseCard(hand, synonymClusters, difficulty) {
  if (!hand || hand.length === 0) return null;

  if (difficulty === 'easy') {
    // Easy: pass a random card
    return hand[Math.floor(Math.random() * hand.length)];
  }

  // Medium/Hard: keep cards that belong to the same cluster as other cards in hand
  // Find which cluster each card belongs to
  function getCluster(card) {
    for (const [word, cluster] of Object.entries(synonymClusters)) {
      if (cluster.map(w => w.toLowerCase()).includes(card.toLowerCase())) return word;
    }
    return null;
  }

  const clusterCounts = {};
  hand.forEach(card => {
    const c = getCluster(card);
    if (c) clusterCounts[c] = (clusterCounts[c] || 0) + 1;
  });

  // Find the cluster the bot holds the most of
  const bestCluster = Object.entries(clusterCounts).sort((a,b) => b[1]-a[1])[0]?.[0];

  if (difficulty === 'hard') {
    // Hard: pass a card NOT from the best cluster (keep matching cards)
    const nonBest = hand.filter(card => getCluster(card) !== bestCluster);
    if (nonBest.length > 0) return nonBest[Math.floor(Math.random() * nonBest.length)];
    return hand[Math.floor(Math.random() * hand.length)];
  }

  // Medium: 70% chance to pass non-matching, 30% random
  if (Math.random() < 0.7) {
    const nonBest = hand.filter(card => getCluster(card) !== bestCluster);
    if (nonBest.length > 0) return nonBest[Math.floor(Math.random() * nonBest.length)];
  }
  return hand[Math.floor(Math.random() * hand.length)];
}

// Should the bot buzz this turn?
function botShouldBuzz(hand, synonymClusters, difficulty, firstRoundOver) {
  if (!firstRoundOver) return false;
  const hasSet = isCompleteSet(hand, synonymClusters);
  if (!hasSet) return false;

  if (difficulty === 'easy')   return Math.random() < 0.4; // 40% chance even with set
  if (difficulty === 'medium') return Math.random() < 0.75; // 75% chance
  return true; // hard always buzzes when it has a set
}

// Main bot turn handler — called after each card pass
function scheduleBotTurn(sessionId) {
  const s = getSession(sessionId);
  if (!s || s.phase !== 'playing') return;

  const currentPlayerId = currentTurnPlayerId(s);
  if (!isBotPlayer(currentPlayerId)) return; // not a bot's turn

  const delay = botDelay(s.difficulty);

  setTimeout(() => {
    const s = getSession(sessionId);
    if (!s || s.phase !== 'playing') return;
    if (currentTurnPlayerId(s) !== currentPlayerId) return; // turn changed

    const hand = s.cards[currentPlayerId];
    if (!hand || hand.length === 0) return;

    // Should bot buzz instead of passing?
    if (botShouldBuzz(hand.slice(0, 3), s.synonymClusters, s.difficulty, s.firstRoundOver)) {
      // Bot buzzes
      const buzzerBeforeRound1 = !s.firstRoundOver;
      if (!s.buzzerActive) {
        s.buzzerActive = true; s.phase = 'buzzing'; s.buzzerLog = [];
        clearTurnTimer(sessionId);
        io.to(sessionId).emit('buzzer_race_started', {
          firstPlayerId: currentPlayerId,
          firstPlayerName: s.players.find(p => p.id === currentPlayerId)?.name
        });
      }
      if (!s.buzzerLog.find(b => b.playerId === currentPlayerId)) {
        const hasCompleteSet = isCompleteSet(hand, s.synonymClusters);
        s.buzzerLog.push({ playerId: currentPlayerId, timestamp: Date.now(), hasCompleteSet, invalid: buzzerBeforeRound1 });
        io.to(sessionId).emit('buzzer_pressed', {
          playerId: currentPlayerId,
          playerName: s.players.find(p => p.id === currentPlayerId)?.name,
          hasCompleteSet, invalid: buzzerBeforeRound1, buzzerLog: s.buzzerLog
        });
        io.to(sessionId).emit('session_update', sanitize(s));
        // Trigger other bots to buzz after a short delay
        scheduleBotBuzzing(sessionId);
        if (s.buzzerLog.length === s.players.length) {
          finishRound(sessionId);
        }
      }
      return;
    }

    // Bot passes a card
    const cardToPass = botChooseCard(hand, s.synonymClusters, s.difficulty);
    if (!cardToPass) return;

    clearTurnTimer(sessionId);
    doPassCard(s, currentPlayerId, cardToPass, sessionId, false);
    // scheduleBotTurn is called again inside doPassCard → startTurnTimer → next turn
  }, delay);
}

// After first buzz, make ALL remaining bots buzz in sequence
function scheduleBotBuzzing(sessionId) {
  const s = getSession(sessionId);
  if (!s) return;

  // Find bots that haven't buzzed yet
  const pendingBots = s.players.filter(p => p.isBot && !s.buzzerLog.find(b => b.playerId === p.id));
  if (pendingBots.length === 0) return;

  pendingBots.forEach((bot, i) => {
    // Stagger each bot's buzz by 1-2 seconds so they don't all buzz simultaneously
    // Give human players time to buzz first — bots wait at least 8 seconds
    // Easy bots wait longer (12-20s), Hard bots are quicker (8-12s)
    let buzzDelay;
    const diff = s.difficulty || 'medium';
    // Bots wait generously so human players can buzz first
    // Each subsequent bot waits even longer (i * 4000 stagger)
    if (diff === 'easy')   buzzDelay = 18000 + i * 4000 + Math.random() * 6000; // 18-28s
    else if (diff === 'hard') buzzDelay = 10000 + i * 3000 + Math.random() * 4000; // 10-17s
    else                   buzzDelay = 14000 + i * 3500 + Math.random() * 5000; // 14-23s
    const delay = buzzDelay;
    setTimeout(async () => {
      const s = getSession(sessionId);
      // Re-check session state — may have changed
      if (!s || (s.phase !== 'buzzing' && s.phase !== 'playing')) return;
      if (s.buzzerLog.find(b => b.playerId === bot.id)) return; // already buzzed

      // If still in playing phase (bot is first to buzz), start buzzing phase
      if (s.phase === 'playing') {
        s.buzzerActive = true; s.phase = 'buzzing'; s.buzzerLog = [];
        clearTurnTimer(sessionId);
        io.to(sessionId).emit('buzzer_race_started', {
          firstPlayerId: bot.id, firstPlayerName: bot.name
        });
        // Schedule remaining bots
        scheduleBotBuzzing(sessionId);
      }

      const hand = s.cards[bot.id] || [];
      const hasCompleteSet = isCompleteSet(hand, s.synonymClusters);
      s.buzzerLog.push({ playerId: bot.id, timestamp: Date.now(), hasCompleteSet, invalid: false });

      io.to(sessionId).emit('buzzer_pressed', {
        playerId: bot.id, playerName: bot.name,
        hasCompleteSet, buzzerLog: s.buzzerLog
      });
      io.to(sessionId).emit('session_update', sanitize(s));

      // If all players have now buzzed, finish the round
      if (s.buzzerLog.length === s.players.length) {
        await finishRound(sessionId);
      }
    }, delay);
  });
}

// Bot word submission
async function botSubmitWord(sessionId, botId) {
  const s = getSession(sessionId);
  if (!s) return;

  // Pick a random word appropriate for the mode and difficulty
  const easyWords  = ['happy','sad','fast','slow','big','small','hot','cold','kind','brave'];
  const medWords   = ['angry','funny','strong','tired','pretty','smart','rich','weak','old','new'];
  const hardWords  = ['jovial','melancholy','tenacious','vivacious','eloquent','astute','frugal','candid','serene','pensive'];
  const funWords   = ['doctor','school','football','pizza','ocean','music','computer','kitchen','wedding','space'];

  let pool;
  if (s.gameMode === 'fun') pool = funWords;
  else if (s.difficulty === 'hard') pool = hardWords;
  else if (s.difficulty === 'medium') pool = medWords;
  else pool = easyWords;

  // Pick a word not already submitted
  const used = Object.values(s.wordSubmissions).map(w => w.toLowerCase());
  const available = pool.filter(w => !used.includes(w));
  const word = available[Math.floor(Math.random() * available.length)] || pool[0];

  s.wordSubmissions[botId] = word;
  io.to(sessionId).emit('session_update', sanitize(s));
  console.log(`Bot ${s.players.find(p=>p.id===botId)?.name} submitted: ${word}`);

  // If all players have now submitted, trigger card dealing
  if (Object.keys(s.wordSubmissions).length === s.players.length) {
    s.phase = 'loading'; io.to(sessionId).emit('session_update', sanitize(s));
    try {
      await dealCards(s);
      s.currentRound = 1; s.firstRoundOver = false; s.starterHasPassed = false;
      s.buzzerActive = false; s.buzzerWindowOpen = {};
      buildTurnOrder(s); s.phase = 'playing';
      io.to(sessionId).emit('session_update', sanitize(s));
      broadcastHands(s);
      setTimeout(() => {
        const current = getSession(sessionId);
        if (current && current.phase === 'playing') {
          startTurnTimer(sessionId);
          scheduleBotTurn(sessionId);
        }
      }, 3000);
    } catch (err) {
      console.error(err); s.phase = 'submit';
      io.to(sessionId).emit('error', { message: 'Error generating words. Try again.' });
      io.to(sessionId).emit('session_update', sanitize(s));
    }
  }
}
