import React, { useState, useEffect, useMemo, useRef } from 'react';
import socket from '../utils/socket';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { Confetti, WordCard } from '../SynapseComponents';
import ArenaBackground from '../components/gameplay/ArenaBackground';
import Header from '../components/gameplay/Header';
import PromptBanner from '../components/gameplay/PromptBanner';
import GameTable from '../components/gameplay/GameTable';
import PlayerHand from '../components/gameplay/PlayerHand';
import ActionBar from '../components/gameplay/ActionBar';
import ExitDialog from '../components/gameplay/ExitDialog';
import InfoDialog from '../components/gameplay/InfoDialog';
import styles from '../components/gameplay/gameplay.module.css';

const TURN_TIME_LIMIT = 30;
const BUZZER_WINDOW = 3;

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
  const [drag, setDrag] = useState(null); // { word, x, y, over }
  const lastRoundRef = useRef(session.currentRound);
  const tableRef = useRef(null);

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

  const myHandTopic = useMemo(() => {
    if (!session.wordSubmissions) return myPlayer?.name || 'Word';
    return session.wordSubmissions[playerId] || 'Word';
  }, [session.wordSubmissions, playerId, myPlayer]);

  const otherPlayers = useMemo(() => players.filter(p => p.id !== playerId), [players, playerId]);
  const turnPlayerId = session.turnOrder?.[session.currentTurnIndex];
  const lastBuzzerId = session.buzzerLog?.[session.buzzerLog.length - 1]?.playerId;

  // ── Handlers ─────────────────────────────────────────────────────────
  function passCard(word) {
    if (!word || !isMyTurn) return;
    socket.emit('pass_card', { sessionId: session.id, playerId, cardToPass: word });
    setSelected(null);
  }

  // Drag-to-pass: pointer-down on a hand card starts tracking; a plain tap
  // (no movement into the table) just selects the card, matching the GDD's
  // "tap to select, then drag to centre to pass."
  function handleCardPointerDown(word, e) {
    setSelected(word);
    if (!isMyTurn) return;
    setDrag({ word, x: e.clientX, y: e.clientY, over: false });
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
      setDrag(d => (d ? { ...d, x, y, over } : d));
    }
    function onUp() {
      setDrag(d => {
        if (d && d.over) passCard(d.word);
        return null;
      });
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
    socket.emit('press_buzzer', { sessionId: session.id, playerId });
    setTimeout(() => setShowConfetti(false), 3000);
  }

  return (
    <div className={`scene ${styles.screen} ${styles.noSceneBg}`}>
      <ArenaBackground />
      {showConfetti && <Confetti count={60} />}

      <div className="scene-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className={styles.landscapeTop}>
          <Header
            round={session.currentRound}
            rounds={session.rounds}
            timeLeft={timeLeft}
            urgency={urgency}
            modeLabel={session.gameMode === 'education' ? 'Syntax' : 'Spark'}
            onExit={() => setShowExit(true)}
            onInfo={() => setShowInfo(true)}
            roomCode={session.id}
            playerCount={players.length}
            maxPlayers={session.maxPlayers}
          />

          <PromptBanner
            topic={myHandTopic}
            associationWord={session.gameMode === 'education' ? 'synonyms' : 'associations'}
            handCount={myHand.length}
            complete={hasCompleteSet}
          />
        </div>

        <div className={styles.landscapeBody}>
          <div className={styles.landscapeArena}>
            <GameTable
              ref={tableRef}
              otherPlayers={otherPlayers}
              turnPlayerId={turnPlayerId}
              lastBuzzerId={lastBuzzerId}
              totalScores={session.totalScores}
              handCounts={session.handCounts}
              ready={ready}
              canBuzz={canBuzz}
              buzzed={buzzed}
              buzzerLocked={buzzerLocked}
              onBuzz={handleBuzz}
              timerPercent={timerPct}
              urgency={urgency}
              buzzWindowLeft={buzzWindowLeft}
              me={myPlayer}
              myScore={session.totalScores?.[playerId]}
              myCardCount={myHand.length}
              isMyTurn={isMyTurn}
              dropActive={!!drag?.over}
            />
          </div>

          <div className={styles.landscapeSidebar}>
            <PlayerHand
              hand={myHand}
              selected={selected}
              onSelect={setSelected}
              hasCompleteSet={hasCompleteSet}
              isMyTurn={isMyTurn}
              onCardPointerDown={handleCardPointerDown}
              draggingWord={drag?.word}
            />

            <ActionBar
              selected={selected}
              isMyTurn={isMyTurn}
              isDragging={!!drag}
              onKeep={() => setSelected(null)}
              onQuit={() => setShowExit(true)}
              ready={ready}
              canBuzz={canBuzz}
              onBuzz={handleBuzz}
              buzzed={buzzed}
              showConfetti={showConfetti}
            />
          </div>
        </div>
      </div>

      {drag && (
        <div
          className={styles.dragGhost}
          style={{ left: drag.x, top: drag.y }}
        >
          <WordCard
            word={drag.word.charAt(0).toUpperCase() + drag.word.slice(1)}
            kind={drag.over ? 'match' : 'normal'}
            small
          />
        </div>
      )}

      <ExitDialog open={showExit} onStay={() => setShowExit(false)} onLeave={onExit} />
      <InfoDialog open={showInfo} onClose={() => setShowInfo(false)} />
    </div>
  );
}
