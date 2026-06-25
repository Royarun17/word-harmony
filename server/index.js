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
const buzzerWindows = {}; // sessionId -> timeout for 3 second buzzer window
const TURN_TIME_LIMIT = 30;
const BUZZER_WINDOW = 3; // seconds after passing to buzz

// ─── Timer helpers ────────────────────────────────────────────────────────────
function clearTurnTimer(sessionId) {
  if (turnTimers[sessionId]) { clearTimeout(turnTimers[sessionId]); delete turnTimers[sessionId]; }
}

function clearBuzzerWindow(sessionId) {
  if (buzzerWindows[sessionId]) { clearTimeout(buzzerWindows[sessionId]); delete buzzerWindows[sessionId]; }
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

    // Auto-pass random card
    const randomCard = hand[Math.floor(Math.random() * hand.length)];
    doPassCard(s, playerId, randomCard, sessionId, true);
  }, TURN_TIME_LIMIT * 1000);
}

// ─── First round tracking ─────────────────────────────────────────────────────
function checkFirstRoundComplete(s, passingPlayerId) {
  if (s.firstRoundOver) return;
  if (passingPlayerId === s.starterPlayerId && !s.starterHasPassed) {
    s.starterHasPassed = true;
    return;
  }
  const nextIdx = (s.turnOrder.indexOf(passingPlayerId) + 1) % s.turnOrder.length;
  const nextPlayer = s.turnOrder[nextIdx];
  if (s.starterHasPassed && nextPlayer === s.starterPlayerId) {
    s.firstRoundOver = true;
    io.to(s.id).emit('buzzer_unlocked', { message: 'Round 1 complete! Buzzer is now active.' });
  }
}

// ─── Session factory ──────────────────────────────────────────────────────────
function createSession(hostId, hostName, rounds, gameMode) {
  const id = Math.random().toString(36).substring(2, 7).toUpperCase();
  sessions[id] = {
    id, hostId, rounds: rounds || 5, currentRound: 0, phase: 'lobby',
    gameMode: gameMode || 'education',
    players: [], wordSubmissions: {}, synonymClusters: {}, cards: {},
    turnOrder: [], currentTurnIndex: 0,
    starterPlayerId: null, starterHasPassed: false, firstRoundOver: false,
    buzzerActive: false,      // true after first player buzzes
    buzzerWindowOpen: {},     // playerId -> true/false (can they buzz right now)
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

// ─── Complete set check ───────────────────────────────────────────────────────
function isCompleteSet(hand, clusters) {
  if (!hand || hand.length < 3) return false;
  const h = hand.slice(0, 3).map(w => w.toLowerCase());
  for (const [, c] of Object.entries(clusters)) {
    if (h.every(w => c.map(x => x.toLowerCase()).includes(w))) return true;
  }
  return false;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
function scoreRound(s) {
  const pts = [10, 7, 5, 3, 1];
  const res = []; let vi = 0;
  s.buzzerLog.forEach((e, i) => {
    // Check cards at time of buzz
    const complete = !e.invalid && !e.autoBuzzed && isCompleteSet(s.cards[e.playerId], s.synonymClusters);
    const points = complete ? (pts[vi] || 1) : 0;
    if (complete) vi++;
    res.push({ playerId: e.playerId, points, hasCompleteSet: complete, invalid: !!e.invalid, buzzerOrder: i + 1 });
    s.totalScores[e.playerId] = (s.totalScores[e.playerId] || 0) + points;
  });
  s.roundScores = res; return res;
}

// ─── Core pass card logic ─────────────────────────────────────────────────────
function doPassCard(s, playerId, cardToPass, sessionId, isAutoPass = false) {
  const hand = s.cards[playerId];
  if (!hand || !hand.includes(cardToPass)) return;

  // Remove card from passer
  s.cards[playerId] = hand.filter(c => c !== cardToPass);

  // Add to next player immediately
  const next = nextPlayerId(s, playerId);
  s.cards[next].push(cardToPass);

  // Enforce hand sizes — passer should have 3, receiver should have 4
  // If passer has less than 3, something went wrong — log it
  if (s.cards[playerId].length !== 3) {
    console.warn(`Hand size error: ${playerId} has ${s.cards[playerId].length} cards after pass`);
  }

  // Check first round completion
  checkFirstRoundComplete(s, playerId);

  // Open 3 second buzzer window for the passer
  if (s.firstRoundOver && !s.buzzerActive) {
    s.buzzerWindowOpen[playerId] = true;
    clearBuzzerWindow(sessionId + '_' + playerId);
    buzzerWindows[sessionId + '_' + playerId] = setTimeout(() => {
      if (s.buzzerWindowOpen) s.buzzerWindowOpen[playerId] = false;
      io.to(sessionId).emit('buzzer_window_closed', { playerId });
    }, BUZZER_WINDOW * 1000);

    // Tell that player their window is open
    io.to(sessionId).emit('buzzer_window_open', {
      playerId,
      seconds: BUZZER_WINDOW
    });
  }

  advanceTurn(s);

  if (isAutoPass) {
    io.to(sessionId).emit('auto_passed', {
      playerId,
      playerName: s.players.find(p => p.id === playerId)?.name,
      card: cardToPass
    });
  }

  io.to(sessionId).emit('session_update', sanitize(s));
  broadcastHands(s);
  io.to(sessionId).emit('card_incoming', {
    toPlayerId: next,
    fromPlayerName: s.players.find(p => p.id === playerId)?.name
  });

  if (!isAutoPass) startTurnTimer(sessionId);
}

// ─── REST ─────────────────────────────────────────────────────────────────────
app.post('/session/create', (req, res) => {
  const { playerName, rounds, gameMode } = req.body;
  const playerId = uuidv4();
  const s = createSession(playerId, playerName, rounds, gameMode);
  addPlayer(s, playerId, playerName);
  res.json({ sessionId: s.id, playerId, gameMode: s.gameMode });
});

app.get('/session/:id', (req, res) => {
  const s = getSession(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json({ id: s.id, phase: s.phase, playerCount: s.players.length, rounds: s.rounds });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build', 'index.html')));

// ─── Socket ───────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {

  socket.on('join_session', ({ sessionId, playerId, playerName }) => {
    const s = getSession(sessionId);
    if (!s) { socket.emit('error', { message: 'Session not found' }); return; }
    addPlayer(s, playerId, playerName);
    socket.join(sessionId); socket.data = { sessionId, playerId };
    io.to(sessionId).emit('session_update', sanitize(s));
  });

  socket.on('start_submission', ({ sessionId }) => {
    const s = getSession(sessionId); if (!s) return;
    s.phase = 'submit';
    io.to(sessionId).emit('session_update', sanitize(s));
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
        broadcastHands(s);
        startTurnTimer(sessionId);
      } catch (err) {
        console.error(err);
        s.phase = 'submit';
        io.to(sessionId).emit('error', { message: 'Synonym error. Try again.' });
        io.to(sessionId).emit('session_update', sanitize(s));
      }
    }
  });

  socket.on('pass_card', ({ sessionId, playerId, cardToPass }) => {
    const s = getSession(sessionId); if (!s || s.phase !== 'playing') return;
    if (currentTurnPlayerId(s) !== playerId) {
      socket.emit('error', { message: "Not your turn." }); return;
    }
    const hand = s.cards[playerId];
    if (!hand || !hand.includes(cardToPass)) {
      socket.emit('error', { message: 'Card not in hand.' }); return;
    }
    clearTurnTimer(sessionId);
    doPassCard(s, playerId, cardToPass, sessionId, false);
  });

  // Buzzer press
  socket.on('press_buzzer', ({ sessionId, playerId }) => {
    const s = getSession(sessionId); if (!s) return;
    if (s.phase !== 'playing' && s.phase !== 'buzzing') return;
    if (s.buzzerLog.find(b => b.playerId === playerId)) return;

    const buzzerBeforeRound1 = !s.firstRoundOver;

    // Before first buzz: only allowed during buzzer window (3 sec after passing)
    // or if buzzerActive (someone already buzzed — race mode)
    if (!s.buzzerActive) {
      // Check if this player is in their 3 second window OR it's their turn
      const inWindow = s.buzzerWindowOpen && s.buzzerWindowOpen[playerId];
      const isTheirTurn = currentTurnPlayerId(s) === playerId;
      if (!inWindow && !isTheirTurn) {
        socket.emit('error', { message: 'You can only buzz right after passing a card!' });
        return;
      }
    }

    // First buzz starts buzzing phase — everyone can now buzz freely
    if (!s.buzzerActive) {
      s.buzzerActive = true;
      s.phase = 'buzzing';
      s.buzzerLog = [];
      clearTurnTimer(sessionId);
      // Open buzzer for ALL players
      io.to(sessionId).emit('buzzer_race_started', {
        firstPlayerId: playerId,
        firstPlayerName: s.players.find(p => p.id === playerId)?.name
      });
    }

    // Check cards immediately
    const hand = s.cards[playerId];
    const hasCompleteSet = !buzzerBeforeRound1 && isCompleteSet(hand, s.synonymClusters);
    const invalid = buzzerBeforeRound1;

    s.buzzerLog.push({ playerId, timestamp: Date.now(), hasCompleteSet, invalid });

    io.to(sessionId).emit('buzzer_pressed', {
      playerId,
      playerName: s.players.find(p => p.id === playerId)?.name,
      hasCompleteSet, invalid,
      buzzerLog: s.buzzerLog
    });

    io.to(sessionId).emit('session_update', sanitize(s));

    // All players buzzed → finish round
    if (s.buzzerLog.length === s.players.length) {
      finishRound(sessionId);
    }
  });

  socket.on('next_round', ({ sessionId }) => {
    const s = getSession(sessionId); if (!s || s.phase !== 'scoring') return;
    if (s.currentRound >= s.rounds) {
      clearTurnTimer(sessionId);
      s.phase = 'ended';
      io.to(sessionId).emit('game_ended', {
        finalScores: s.players.map(p => ({
          playerId: p.id, playerName: p.name, total: s.totalScores[p.id] || 0
        })).sort((a, b) => b.total - a.total)
      });
      io.to(sessionId).emit('session_update', sanitize(s));
    } else {
      clearTurnTimer(sessionId);
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
      if (s) {
        const p = s.players.find(x => x.id === playerId);
        if (p) p.connected = false;
        io.to(sessionId).emit('session_update', sanitize(s));
      }
    }
  });
});

function finishRound(sessionId) {
  clearTurnTimer(sessionId);
  const s = getSession(sessionId); if (!s) return;
  const res = scoreRound(s);
  s.phase = 'scoring';
  io.to(sessionId).emit('round_scored', {
    roundScores: res.map(r => ({
      ...r,
      playerName: s.players.find(p => p.id === r.playerId)?.name,
      hand: s.cards[r.playerId]
    })),
    totalScores: s.players.map(p => ({
      playerId: p.id, playerName: p.name, total: s.totalScores[p.id] || 0
    })),
    synonymClusters: s.synonymClusters, round: s.currentRound
  });
  io.to(sessionId).emit('session_update', sanitize(s));
}

// ─── Card dealing — no duplicates ─────────────────────────────────────────────
async function dealCards(s) {
  // Fetch word clusters
  for (const [, word] of Object.entries(s.wordSubmissions)) {
    const words = s.gameMode === 'fun'
      ? await getAssociations(word)
      : await getSynonyms(word);
    s.synonymClusters[word] = words;
  }

  const pids = s.players.map(p => p.id);
  pids.forEach(pid => { s.cards[pid] = []; });

  // Collect ALL cards and check for duplicates
  let allCards = [];
  const clusterEntries = Object.entries(s.synonymClusters);

  clusterEntries.forEach(([, cluster]) => {
    cluster.forEach(word => {
      // Only add if not already in allCards (no duplicates)
      if (!allCards.includes(word.toLowerCase())) {
        allCards.push(word.toLowerCase());
      }
    });
  });

  // Distribute cards — one from each cluster per player position
  pids.forEach((pid, i) => {
    const word = s.wordSubmissions[pid];
    const cluster = s.synonymClusters[word];
    cluster.forEach((syn, j) => {
      const receiver = pids[(i + j) % pids.length];
      // Only add if player doesn't already have this card
      if (!s.cards[receiver].includes(syn.toLowerCase())) {
        s.cards[receiver].push(syn.toLowerCase());
      }
    });
  });

  // Strictly enforce 3 cards per player
  pids.forEach(pid => {
    s.cards[pid] = [...new Set(s.cards[pid])].slice(0, 3);
    // If player has less than 3, fill from unused cards
    if (s.cards[pid].length < 3) {
      const used = Object.values(s.cards).flat();
      const unused = allCards.filter(w => !used.includes(w));
      while (s.cards[pid].length < 3 && unused.length > 0) {
        s.cards[pid].push(unused.shift());
      }
    }
  });

  // Pick random starter — give 4th card
  const si = Math.floor(Math.random() * pids.length);
  const sid = pids[si];
  s.starterPlayerId = sid;

  // Find a 4th card that isn't already dealt
  const allDealt = Object.values(s.cards).flat();
  const allGenerated = Object.values(s.synonymClusters).flat().map(w => w.toLowerCase());
  const available = allGenerated.filter(w => !allDealt.includes(w));

  let fourthCard;
  if (available.length > 0) {
    fourthCard = available[Math.floor(Math.random() * available.length)];
  } else {
    // Generate a new word if no unique card available
    const starterWord = s.wordSubmissions[sid];
    const extra = s.gameMode === 'fun'
      ? await getAssociations(starterWord + '_extra')
      : await getSynonyms(starterWord);
    fourthCard = extra.find(w => !allDealt.includes(w.toLowerCase())) || extra[0];
  }

  s.cards[sid].push(fourthCard.toLowerCase());

  // Final check — log hand sizes
  pids.forEach(pid => {
    console.log(`${s.players.find(p=>p.id===pid)?.name}: ${s.cards[pid].length} cards - [${s.cards[pid].join(', ')}]`);
  });
}

function buildTurnOrder(s) {
  const st = s.players.filter(p => p.id === s.starterPlayerId);
  const rest = s.players.filter(p => p.id !== s.starterPlayerId);
  s.turnOrder = [...st, ...rest].map(p => p.id);
  s.currentTurnIndex = 0;
}

function broadcastHands(s) {
  s.players.forEach(p => {
    io.to(s.id).emit(`hand_update_${p.id}`, {
      hand: s.cards[p.id] || [],
      isStarter: p.id === s.starterPlayerId,
    });
  });
}

function sanitize(s) {
  return {
    id: s.id, hostId: s.hostId, phase: s.phase,
    currentRound: s.currentRound, rounds: s.rounds, gameMode: s.gameMode,
    players: s.players, wordSubmissions: s.wordSubmissions,
    turnOrder: s.turnOrder, currentTurnIndex: s.currentTurnIndex,
    starterPlayerId: s.starterPlayerId, starterHasPassed: s.starterHasPassed,
    firstRoundOver: s.firstRoundOver, buzzerActive: s.buzzerActive,
    buzzerLog: s.buzzerLog, totalScores: s.totalScores,
  };
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Word Harmony running on port ${PORT}`));
