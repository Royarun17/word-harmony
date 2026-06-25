const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const synonymEngine = require('./synonymEngine');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const sessions = {};
const turnTimers = {};
const TURN_TIME_LIMIT = 30;

// ─── Timer helpers ────────────────────────────────────────────────────────────
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

    // Auto-pass random card
    const randomCard = hand[Math.floor(Math.random() * hand.length)];
    s.cards[playerId] = hand.filter(c => c !== randomCard);
    const next = nextPlayerId(s, playerId);
    s.cards[next].push(randomCard);

    // Track if starter completed their pass — check first round completion
    checkFirstRoundComplete(s, playerId);

    advanceTurn(s);
    io.to(sessionId).emit('auto_passed', {
      playerId, playerName: s.players.find(p => p.id === playerId)?.name, card: randomCard
    });
    io.to(sessionId).emit('session_update', sanitize(s));
    broadcastHands(s);
    startTurnTimer(sessionId);
  }, TURN_TIME_LIMIT * 1000);
}

// ─── First round tracking ────────────────────────────────────────────────────
// Round 1 ends when the starter receives a card back (has 4 cards again after their first pass)
function checkFirstRoundComplete(s, passingPlayerId) {
  if (s.firstRoundOver) return;

  // Starter completing their FIRST pass starts the tracking
  if (passingPlayerId === s.starterPlayerId && !s.starterHasPassed) {
    s.starterHasPassed = true;
    return;
  }

  // Round 1 completes when it's the starter's turn again (they receive a card = 4 cards again)
  const nextIdx = (s.turnOrder.indexOf(passingPlayerId) + 1) % s.turnOrder.length;
  const nextPlayer = s.turnOrder[nextIdx];
  if (s.starterHasPassed && nextPlayer === s.starterPlayerId) {
    s.firstRoundOver = true;
    io.to(s.id).emit('buzzer_unlocked', { message: 'Round 1 complete! Buzzer is now unlocked.' });
  }
}

// ─── Session factory ──────────────────────────────────────────────────────────
function createSession(hostId, hostName, rounds) {
  const id = Math.random().toString(36).substring(2, 7).toUpperCase();
  sessions[id] = {
    id, hostId, rounds: rounds || 5, currentRound: 0, phase: 'lobby',
    players: [], wordSubmissions: {}, synonymClusters: {}, cards: {},
    turnOrder: [], currentTurnIndex: 0,
    starterPlayerId: null,
    starterHasPassed: false,   // tracks if starter made their first pass
    firstRoundOver: false,     // buzzer locked until this is true
    buzzerActive: false,       // true after first player buzzes (others must now buzz on their turn)
    incomingCard: {}, buzzerLog: [], roundScores: [], totalScores: {},
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
  const h = hand.slice(0, 3).map(w => w.toLowerCase());
  for (const [, c] of Object.entries(clusters)) {
    if (h.every(w => c.map(x => x.toLowerCase()).includes(w))) return true;
  }
  return false;
}

function scoreRound(s) {
  const pts = [10, 7, 5, 3, 1]; const res = []; let vi = 0;
  s.buzzerLog.forEach((e, i) => {
    // Invalid if buzzed before round 1, auto-buzzed, or incomplete set
    const complete = !e.invalid && !e.autoBuzzed && isCompleteSet(s.cards[e.playerId], s.synonymClusters);
    const points = complete ? (pts[vi] || 1) : 0; if (complete) vi++;
    res.push({ playerId: e.playerId, points, hasCompleteSet: complete, invalid: e.invalid || false, buzzerOrder: i + 1 });
    s.totalScores[e.playerId] = (s.totalScores[e.playerId] || 0) + points;
  });
  s.roundScores = res; return res;
}

// ─── REST ─────────────────────────────────────────────────────────────────────
app.post('/session/create', (req, res) => {
  const { playerName, rounds } = req.body; const playerId = uuidv4();
  const s = createSession(playerId, playerName, rounds); addPlayer(s, playerId, playerName);
  res.json({ sessionId: s.id, playerId });
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
        await dealCards(s); s.currentRound = 1; s.firstRoundOver = false; s.starterHasPassed = false;
        buildTurnOrder(s); s.phase = 'playing';
        io.to(sessionId).emit('session_update', sanitize(s)); broadcastHands(s);
        startTurnTimer(sessionId);
      } catch (err) {
        s.phase = 'submit'; io.to(sessionId).emit('error', { message: 'Synonym error. Try again.' });
        io.to(sessionId).emit('session_update', sanitize(s));
      }
    }
  });

  socket.on('pass_card', ({ sessionId, playerId, cardToPass }) => {
    const s = getSession(sessionId); if (!s || s.phase !== 'playing') return;
    if (currentTurnPlayerId(s) !== playerId) { socket.emit('error', { message: "Not your turn." }); return; }

    const hand = s.cards[playerId];
    if (!hand || !hand.includes(cardToPass)) { socket.emit('error', { message: 'Card not in hand.' }); return; }

    // Remove from current player
    s.cards[playerId] = hand.filter(c => c !== cardToPass);

    // Add immediately to next player's hand
    const next = nextPlayerId(s, playerId);
    s.cards[next].push(cardToPass);

    // Check if first round is now complete
    checkFirstRoundComplete(s, playerId);

    advanceTurn(s);
    io.to(sessionId).emit('session_update', sanitize(s));
    broadcastHands(s);
    io.to(sessionId).emit('card_incoming', { toPlayerId: next, fromPlayerName: s.players.find(p => p.id === playerId)?.name });
    startTurnTimer(sessionId);
  });

  // Buzzer — only on your turn, only after round 1
  socket.on('press_buzzer', ({ sessionId, playerId }) => {
    const s = getSession(sessionId); if (!s) return;
    if (s.phase !== 'playing' && s.phase !== 'buzzing') return;

    // If Round 1 not over, buzz is allowed but counted as invalid (0 points)
    const buzzerBeforeRound1 = !s.firstRoundOver;

    // Can only buzz on your own turn
    if (currentTurnPlayerId(s) !== playerId) {
      socket.emit('error', { message: 'Wait for your turn to buzz!' }); return;
    }

    // No double buzz
    if (s.buzzerLog.find(b => b.playerId === playerId)) return;

    // First buzz — start buzzing phase
    if (s.phase === 'playing') {
      s.phase = 'buzzing';
      s.buzzerActive = true;
      s.buzzerLog = [];
      clearTurnTimer(sessionId);
    }

    // Immediately check if this player has a complete set
    // Invalid if buzzed before round 1 completes
    const hand = s.cards[playerId];
    const hasCompleteSet = !buzzerBeforeRound1 && isCompleteSet(hand, s.synonymClusters);
    const invalid = buzzerBeforeRound1;

    s.buzzerLog.push({ playerId, timestamp: Date.now(), hasCompleteSet, invalid });

    io.to(sessionId).emit('buzzer_pressed', {
      playerId,
      playerName: s.players.find(p => p.id === playerId)?.name,
      hasCompleteSet,
      invalid,
      buzzerLog: s.buzzerLog
    });

    // After buzzing, advance turn so next player can buzz
    advanceTurn(s);
    io.to(sessionId).emit('session_update', sanitize(s));

    // Start timer so next player must buzz within 10 seconds
    startBuzzerTurnTimer(sessionId);

    // If all players have buzzed → score the round
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
        finalScores: s.players.map(p => ({ playerId: p.id, playerName: p.name, total: s.totalScores[p.id] || 0 }))
          .sort((a, b) => b.total - a.total)
      });
      io.to(sessionId).emit('session_update', sanitize(s));
    } else {
      clearTurnTimer(sessionId);
      s.currentRound++; s.phase = 'submit';
      s.wordSubmissions = {}; s.synonymClusters = {}; s.cards = {};
      s.incomingCard = {}; s.buzzerLog = []; s.roundScores = [];
      s.starterPlayerId = null; s.starterHasPassed = false; s.firstRoundOver = false; s.buzzerActive = false;
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

// ─── Buzzer turn timer (after first buzz, others must buzz within 10s) ────────
function startBuzzerTurnTimer(sessionId) {
  clearTurnTimer(sessionId);
  const s = getSession(sessionId);
  if (!s || s.phase !== 'buzzing') return;
  if (s.buzzerLog.length >= s.players.length) return;

  io.to(sessionId).emit('turn_timer', { playerId: currentTurnPlayerId(s), seconds: TURN_TIME_LIMIT });

  turnTimers[sessionId] = setTimeout(() => {
    const s = getSession(sessionId);
    if (!s || s.phase !== 'buzzing') return;
    const playerId = currentTurnPlayerId(s);
    if (s.buzzerLog.find(b => b.playerId === playerId)) return;

    // Auto-buzz with no complete set
    s.buzzerLog.push({ playerId, timestamp: Date.now(), hasCompleteSet: false, autoBuzzed: true });
    io.to(sessionId).emit('buzzer_pressed', {
      playerId, playerName: s.players.find(p => p.id === playerId)?.name,
      hasCompleteSet: false, autoBuzzed: true, buzzerLog: s.buzzerLog
    });

    advanceTurn(s);
    io.to(sessionId).emit('session_update', sanitize(s));

    if (s.buzzerLog.length >= s.players.length) {
      finishRound(sessionId);
    } else {
      startBuzzerTurnTimer(sessionId);
    }
  }, TURN_TIME_LIMIT * 1000);
}

function finishRound(sessionId) {
  clearTurnTimer(sessionId);
  const s = getSession(sessionId);
  if (!s) return;
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

// ─── Card dealing ─────────────────────────────────────────────────────────────
async function dealCards(s) {
  for (const [, word] of Object.entries(s.wordSubmissions)) {
    const syn = await synonymEngine.getSynonyms(word); s.synonymClusters[word] = syn;
  }
  const pids = s.players.map(p => p.id);
  pids.forEach(pid => { s.cards[pid] = []; s.incomingCard[pid] = null; });
  pids.forEach((pid, i) => {
    const word = s.wordSubmissions[pid]; const cluster = s.synonymClusters[word];
    cluster.forEach((syn, j) => { s.cards[pids[(i + j) % pids.length]].push(syn); });
  });
  pids.forEach(pid => { s.cards[pid] = s.cards[pid].slice(0, 3); });

  // Pick random starter — give them 4th card
  const si = Math.floor(Math.random() * pids.length); const sid = pids[si];
  s.starterPlayerId = sid;
  const sw = s.wordSubmissions[sid]; const ow = Object.keys(s.synonymClusters).filter(w => w !== sw);
  let fc;
  if (Math.random() < 0.5 && ow.length > 0) {
    const rw = ow[Math.floor(Math.random() * ow.length)]; const rc = s.synonymClusters[rw];
    fc = rc[Math.floor(Math.random() * rc.length)];
  } else {
    const oc = s.synonymClusters[sw]; fc = oc[Math.floor(Math.random() * oc.length)];
  }
  s.cards[sid].push(fc);
}

function buildTurnOrder(s) {
  const st = s.players.filter(p => p.id === s.starterPlayerId);
  const rest = s.players.filter(p => p.id !== s.starterPlayerId);
  s.turnOrder = [...st, ...rest].map(p => p.id); s.currentTurnIndex = 0;
}

function broadcastHands(s) {
  s.players.forEach(p => {
    io.to(s.id).emit(`hand_update_${p.id}`, {
      hand: s.cards[p.id] || [], isStarter: p.id === s.starterPlayerId,
    });
  });
}

function sanitize(s) {
  return {
    id: s.id, hostId: s.hostId, phase: s.phase, currentRound: s.currentRound, rounds: s.rounds,
    players: s.players, wordSubmissions: s.wordSubmissions, turnOrder: s.turnOrder,
    currentTurnIndex: s.currentTurnIndex, starterPlayerId: s.starterPlayerId,
    starterHasPassed: s.starterHasPassed, firstRoundOver: s.firstRoundOver,
    buzzerActive: s.buzzerActive, buzzerLog: s.buzzerLog, totalScores: s.totalScores,
  };
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Word Harmony running on port ${PORT}`));
