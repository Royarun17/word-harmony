import React, { useState, useEffect, useMemo, useRef } from 'react';
import socket from '../utils/socket';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { Confetti } from '../SynapseComponents';
import Header from '../components/gameplay/Header';
import GameTable from '../components/gameplay/GameTable';
import PlayerHand, { HandCard, capitalise } from '../components/gameplay/PlayerHand';
import ExitDialog from '../components/gameplay/ExitDialog';
import InfoDialog from '../components/gameplay/InfoDialog';
import styles from '../components/gameplay/gameplay.module.css';
import roomArt from '../assets/welcome/light/room.webp';
import tableArt from '../assets/welcome/light/tabletop.webp';

const TURN_TIME_LIMIT = 30;
const BUZZER_WINDOW = 3;

// Keyboard bindings, as data: gameplay below only ever sees the action name.
// Touch uses tap/drag and the on-screen Pass and BUZZ buttons for the same actions.
const KEY_ACTIONS = {
  '1': 'pick', '2': 'pick', '3': 'pick', '4': 'pick',
  Enter: 'pass',
  b: 'buzz', B: 'buzz',
  Escape: 'deselect',
};

export default function GamePlay({ session, playerId, onExit }) {
  // ── State ──────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState(null);
  const [showExit, setShowExit] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [buzzed, setBuzzed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [myHand, setMyHand] = useState([]);
  const [isStarter, setIsStarter] = useState(false);
  const [hasCompleteSet, setHasCompleteSet] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TURN_TIME_LIMIT);
  const [buzzWindowLeft, setBuzzWindowLeft] = useState(0);
  const [drag, setDrag] = useState(null); // { word, sx, sy, x, y, active, over }
  const [toast, setToast] = useState(null); // { text, key }
  const [took, setTook] = useState(false);   // word card "receives" a passed card
  const [shaking, setShaking] = useState(false); // buzz impact
  const lastRoundRef = useRef(session.currentRound);
  const tableRef = useRef(null);
  const justDraggedRef = useRef(false);
  const dragRef = useRef(null);

  function showToast(text) {
    setToast({ text, key: Date.now() });
  }
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  // ── Hand updates from server ──────────────────────────────────────────
  // The server never sends synonymClusters during play (that would spoil the
  // round for everyone), so it tells us instead whether OUR OWN current hand
  // happens to form a complete set.
  useEffect(() => {
    const handleHand = ({ hand, isStarter: starter, hasCompleteSet: complete }) => {
      setMyHand(hand || []);
      setIsStarter(!!starter);
      setHasCompleteSet(!!complete);
    };
    socket.on(`hand_update_${playerId}`, handleHand);
    // In case this component mounted after the server's initial deal already
    // went out (e.g. right as the phase flips to "playing"), ask for a resend.
    socket.emit('request_hand', { sessionId: session.id, playerId });
    return () => socket.off(`hand_update_${playerId}`, handleHand);
  }, [playerId, session.id]);

  // Only clear "buzzed" when a new round actually starts — hand_update fires on
  // every card pass (even other players'), so resetting it there would let a
  // player who already locked in a buzz look re-armed mid-round.
  useEffect(() => {
    if (session.currentRound !== lastRoundRef.current) {
      lastRoundRef.current = session.currentRound;
      setBuzzed(false);
      setSelected(null);
    }
  }, [session.currentRound]);

  // ── Live turn countdown, driven by the server's `turn_timer` broadcast ──
  useSocketEvent('turn_timer', ({ seconds }) => {
    setTimeLeft(seconds ?? TURN_TIME_LIMIT);
  });
  useEffect(() => {
    if (session.phase !== 'playing') return;
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [session.phase]);

  // ── 3-second "buzz now" window granted right after passing a card ──────
  useSocketEvent('buzzer_window_open', ({ playerId: pid, seconds }) => {
    if (pid === playerId) setBuzzWindowLeft(seconds ?? BUZZER_WINDOW);
  });
  useSocketEvent('buzzer_window_closed', ({ playerId: pid }) => {
    if (pid === playerId) setBuzzWindowLeft(0);
  });
  useSocketEvent('auto_passed', ({ playerId: pid, card }) => {
    if (pid === playerId && card) showToast(`Time's up · passed “${capitalise(card)}”`);
  });
  useEffect(() => {
    if (buzzWindowLeft <= 0) return;
    const id = setInterval(() => setBuzzWindowLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [buzzWindowLeft > 0]);

  // ── Derived state ────────────────────────────────────────────────────
  const players    = session.players || [];
  const myPlayer   = players.find(p => p.id === playerId);
  const isMyTurn   = session.turnOrder?.[session.currentTurnIndex] === playerId;
  const timerPct   = (timeLeft / TURN_TIME_LIMIT) * 100;
  const buzzerLocked = !session.firstRoundOver;
  const urgency = timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warn' : 'normal';

  // Mirrors the server's press_buzzer gating in server/index.js: before anyone
  // has buzzed, you may only buzz on your turn, or during the 3s window right
  // after passing (mandatory if you're holding 4 cards). Once the race has
  // started (phase === 'buzzing'), anyone who hasn't buzzed yet may free-buzz.
  const starterLocked   = playerId === session.starterPlayerId && !session.firstRoundOver;
  const hasFourCards    = myHand.length >= 4;
  const inBuzzWindow    = buzzWindowLeft > 0;
  const raceStarted     = session.phase === 'buzzing';
  const preRaceEligible = session.firstRoundOver && !starterLocked &&
    (hasFourCards ? inBuzzWindow : (inBuzzWindow || isMyTurn));
  const canBuzz = !buzzed && (raceStarted || preRaceEligible);
  const ready   = hasCompleteSet && canBuzz;

  const otherPlayers = useMemo(() => players.filter(p => p.id !== playerId), [players, playerId]);
  const turnPlayerId = session.turnOrder?.[session.currentTurnIndex];
  const lastBuzzerId = session.buzzerLog?.[session.buzzerLog.length - 1]?.playerId;
  const turnPlayerName = players.find(p => p.id === turnPlayerId)?.name.split(' ')[0];
  const nextPlayerName = useMemo(() => {
    const order = session.turnOrder || [];
    const nextId = order[(order.indexOf(playerId) + 1) % (order.length || 1)];
    return players.find(p => p.id === nextId)?.name.split(' ')[0];
  }, [session.turnOrder, players, playerId]);

  const scores = session.totalScores || {};
  const myRank = 1 + players.filter(p => p.id !== playerId && (scores[p.id] || 0) > (scores[playerId] || 0)).length;
  const leaderId = useMemo(() => {
    let best = null;
    players.forEach(p => { if ((scores[p.id] || 0) > 0 && (!best || scores[p.id] > scores[best])) best = p.id; });
    return best;
  }, [players, scores]);

  const submissions = session.wordSubmissions || {};
  const myWord = submissions[playerId] ? capitalise(submissions[playerId]) : null;
  const otherWords = useMemo(() => [...new Set(
    Object.entries(session.wordSubmissions || {})
      .filter(([pid, w]) => pid !== playerId && w)
      .map(([, w]) => capitalise(w))
  )].filter(w => w !== myWord), [session.wordSubmissions, playerId, myWord]);

  // ── Handlers ─────────────────────────────────────────────────────────
  function passCard(word) {
    if (!word || !isMyTurn) return;
    socket.emit('pass_card', { sessionId: session.id, playerId, cardToPass: word });
    setSelected(null);
    setTook(true);
    setTimeout(() => setTook(false), 420);
    showToast(nextPlayerName ? `Passed “${capitalise(word)}” to ${nextPlayerName}` : `Passed “${capitalise(word)}”`);
  }

  // Tap toggles selection; the click that ends a drag is swallowed so a pass
  // attempt doesn't also flip the selection.
  function handleSelect(word) {
    if (justDraggedRef.current) return;
    setSelected(s => (s === word ? null : word));
  }

  // Drag-to-pass: pointer-down on a hand card starts tracking; the drag only
  // becomes real after 8px of movement, and dropping it on the word card passes it.
  function handleCardPointerDown(word, e) {
    if (!isMyTurn) return;
    justDraggedRef.current = false;
    dragRef.current = { word, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, active: false, over: false };
    setDrag(dragRef.current);
  }

  useEffect(() => {
    if (!drag) return;
    function point(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }
    function onMove(e) {
      const { x, y } = point(e);
      const rect = tableRef.current?.getBoundingClientRect();
      const over = !!rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      const d = dragRef.current;
      if (!d) return;
      const active = d.active || Math.hypot(x - d.sx, y - d.sy) > 8;
      dragRef.current = { ...d, x, y, active, over: active && over };
      setDrag(dragRef.current);
    }
    // Side effects live here, not in a setState updater, so StrictMode can't
    // double-pass and the click that follows pointerup already sees the flag.
    function onUp() {
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!d || !d.active) return;
      justDraggedRef.current = true;
      setTimeout(() => { justDraggedRef.current = false; }, 0);
      if (d.over) passCard(d.word);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag?.word]);

  function handleBuzz() {
    if (!canBuzz || buzzed) return;
    setBuzzed(true);
    setShowConfetti(true);
    setShaking(true);
    try { navigator.vibrate && navigator.vibrate(60); } catch {}
    socket.emit('press_buzzer', { sessionId: session.id, playerId });
    setTimeout(() => setShowConfetti(false), 3000);
    setTimeout(() => setShaking(false), 460);
  }

  // ── Keyboard: map keys to the same actions the touch controls use ──────
  const runAction = useRef(null);
  runAction.current = (action, key) => {
    if (action === 'pick') {
      const word = myHand[Number(key) - 1];
      if (word) setSelected(s => (s === word ? null : word));
    } else if (action === 'pass') {
      if (selected) passCard(selected);
    } else if (action === 'buzz') {
      handleBuzz();
    } else if (action === 'deselect') {
      setSelected(null);
    }
  };
  const dialogOpen = showExit || showInfo;
  useEffect(() => {
    if (dialogOpen) return undefined;
    function onKey(e) {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      // Enter on a focused button should press that button, not pass.
      if (e.key === 'Enter' && tag === 'BUTTON') return;
      const action = KEY_ACTIONS[e.key];
      if (!action) return;
      e.preventDefault();
      runAction.current(action, e.key);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialogOpen]);

  const dragging = !!drag?.active;

  // Starting a real drag also selects the card being dragged.
  useEffect(() => {
    if (dragging) setSelected(drag.word);
  }, [dragging, drag?.word]);

  return (
    <div className={`${styles.screen}${dragging ? ` ${styles.dragging}` : ''}${shaking ? ` ${styles.shake}` : ''}`}>
      <div className={styles.backdrop} aria-hidden>
        <img className={styles.roomArt} src={roomArt} alt="" />
        <img className={styles.tableArt} src={tableArt} alt="" />
      </div>
      {showConfetti && <Confetti count={60} />}

      <Header
        round={session.currentRound}
        rounds={session.rounds}
        onExit={() => setShowExit(true)}
        onInfo={() => setShowInfo(true)}
        onCopied={() => showToast('Room code copied')}
        roomCode={session.id}
        otherPlayers={otherPlayers}
        turnPlayerId={turnPlayerId}
        lastBuzzerId={lastBuzzerId}
        totalScores={session.totalScores}
        handCounts={session.handCounts}
        leaderId={leaderId}
      />

      <GameTable
        ref={tableRef}
        myWord={myWord}
        otherWords={otherWords}
        modeNoun={session.gameMode === 'education' ? 'synonyms' : 'associations'}
        timeLeft={timeLeft}
        timerPercent={timerPct}
        urgency={urgency}
        myScore={scores[playerId]}
        myRank={myRank}
        playerCount={players.length}
        hasCompleteSet={hasCompleteSet}
        isMyTurn={isMyTurn}
        turnPlayerName={turnPlayerName}
        ready={ready}
        canBuzz={canBuzz}
        buzzed={buzzed}
        buzzerLocked={buzzerLocked}
        buzzWindowLeft={buzzWindowLeft}
        onBuzz={handleBuzz}
        dropActive={!!drag?.over}
        took={took}
      />

      <footer className={styles.handRow}>
        <PlayerHand
          hand={myHand}
          selected={selected}
          onSelect={handleSelect}
          hasCompleteSet={hasCompleteSet}
          isMyTurn={isMyTurn}
          onCardPointerDown={handleCardPointerDown}
          draggingWord={dragging ? drag.word : null}
        />
        <div className={styles.actions}>
          <button
            type="button"
            className={`wh-btn-sun ${styles.pass}`}
            onClick={() => passCard(selected)}
            disabled={!isMyTurn || !selected}
            aria-keyshortcuts="Enter"
          >
            {!isMyTurn ? 'Not your turn' : !selected ? 'Pick a card' : nextPlayerName ? `Pass to ${nextPlayerName}` : 'Pass'}
          </button>
        </div>
      </footer>

      {dragging && (
        <HandCard
          word={drag.word}
          className={styles.dragGhost}
          style={{ left: drag.x, top: drag.y, '--len': drag.word.length }}
          tabIndex={-1}
          aria-hidden
        />
      )}

      {toast && <div key={toast.key} className={styles.toast} role="status">{toast.text}</div>}

      <ExitDialog open={showExit} onStay={() => setShowExit(false)} onLeave={onExit} />
      <InfoDialog open={showInfo} onClose={() => setShowInfo(false)} />
    </div>
  );
}
