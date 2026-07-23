import React, { useState, useEffect, useMemo, useRef } from 'react';
import socket from '../utils/socket';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { Confetti, ThemeSwitcher } from '../SynapseComponents';
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
  const lastRoundRef = useRef(session.currentRound);

  useEffect(() => {
    const handleHand = ({ hand, isStarter: starter, hasCompleteSet: complete }) => {
      setMyHand(hand || []);
      setIsStarter(!!starter);
      setHasCompleteSet(!!complete);
    };
    socket.on(`hand_update_${playerId}`, handleHand);
    socket.emit('request_hand', { sessionId: session.id, playerId });
    return () => socket.off(`hand_update_${playerId}`, handleHand);
  }, [playerId, session.id]);

  useEffect(() => {
    if (session.currentRound !== lastRoundRef.current) {
      lastRoundRef.current = session.currentRound;
      setBuzzed(false);
      setSelected(null);
    }
  }, [session.currentRound]);

  useSocketEvent('turn_timer', ({ seconds }) => {
    setTimeLeft(seconds ?? TURN_TIME_LIMIT);
  });
  useEffect(() => {
    if (session.phase !== 'playing') return;
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [session.phase]);

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

  const players    = session.players || [];
  const myPlayer   = players.find(p => p.id === playerId);
  const isMyTurn   = session.turnOrder?.[session.currentTurnIndex] === playerId;
  const timerPct   = (timeLeft / TURN_TIME_LIMIT) * 100;
  const buzzerLocked = !session.firstRoundOver;
  const urgency = timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warn' : 'normal';

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

  function handlePass() {
    if (!selected || !isMyTurn) return;
    socket.emit('pass_card', { sessionId: session.id, playerId, cardToPass: selected });
    setSelected(null);
  }

  function handleBuzz() {
    if (!canBuzz || buzzed) return;
    setBuzzed(true);
    setShowConfetti(true);
    socket.emit('press_buzzer', { sessionId: session.id, playerId });
    setTimeout(() => setShowConfetti(false), 3000);
  }

  return (
    <div className={`scene ${styles.screen}`}>
      <ThemeSwitcher />
      {showConfetti && <Confetti count={60} />}

      <div className="scene-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header
          round={session.currentRound}
          rounds={session.rounds}
          timeLeft={timeLeft}
          urgency={urgency}
          modeLabel={session.gameMode === 'education' ? 'Syntax' : 'Spark'}
          onExit={() => setShowExit(true)}
          onInfo={() => setShowInfo(true)}
        />

        <PromptBanner
          topic={myHandTopic}
          associationWord={session.gameMode === 'education' ? 'synonyms' : 'associations'}
          handCount={myHand.length}
          complete={hasCompleteSet}
        />

        <GameTable
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
        />

        <PlayerHand
          hand={myHand}
          selected={selected}
          onSelect={setSelected}
          hasCompleteSet={hasCompleteSet}
          isMyTurn={isMyTurn}
        />

        <ActionBar
          selected={selected}
          isMyTurn={isMyTurn}
          onPass={handlePass}
          onKeep={() => setSelected(null)}
          onQuit={() => setShowExit(true)}
          ready={ready}
          canBuzz={canBuzz}
          onBuzz={handleBuzz}
          buzzed={buzzed}
          showConfetti={showConfetti}
        />
      </div>

      <ExitDialog open={showExit} onStay={() => setShowExit(false)} onLeave={onExit} />
      <InfoDialog open={showInfo} onClose={() => setShowInfo(false)} />
    </div>
  );
}
