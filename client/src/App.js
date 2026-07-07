import React, { useState, useEffect } from 'react';
import socket from './utils/socket';
import { useSocketEvent } from './hooks/useSocketEvent';
import { useToast, ToastContainer } from './components/Toast';

import TutorialPage from './pages/TutorialPage';
import LobbyPage   from './pages/LobbyPage';
import WaitingRoom from './pages/WaitingRoom';
import SubmitWord  from './pages/SubmitWord';
import GamePlay    from './pages/GamePlay';
import ScoringPage from './pages/ScoringPage';
import GameEnded   from './pages/GameEnded';

const TUTORIAL_SEEN_KEY  = 'wordHarmonyTutorialSeen';
const SESSION_STORAGE_KEY = 'wordHarmonySession';

export default function App() {
  const [showTutorial, setShowTutorial]   = useState(false);
  const [gameState, setGameState]         = useState('lobby');
  const [session, setSession]             = useState(null);
  const [myInfo, setMyInfo]               = useState(null);
  const [finalScores, setFinalScores]     = useState(null);
  const [scoringData, setScoringData]     = useState(null);
  const [rejoining, setRejoining]         = useState(false);

  const { toasts, show: showToast } = useToast();

  // On first load — check tutorial + check for saved session
  useEffect(() => {
    try {
      // Tutorial check
      const seen = window.localStorage.getItem(TUTORIAL_SEEN_KEY);
      if (seen !== 'true') setShowTutorial(true);

      // Session check — try to rejoin if we have saved session info
      const saved = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const { sessionId, playerId, playerName, isHost } = JSON.parse(saved);
        if (sessionId && playerId) {
          setRejoining(true);
          setMyInfo({ sessionId, playerId, playerName, isHost });
          socket.connect();
          socket.emit('rejoin_session', { sessionId, playerId, playerName });
        }
      }
    } catch (e) {
      // localStorage unavailable or parse error — just show lobby
    }
  }, []);

  // Save session to localStorage when player joins
  function saveSession(info) {
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(info));
    } catch (e) {}
  }

  // Clear session from localStorage when game ends or player leaves
  function clearSession() {
    try {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {}
  }

  // Rejoin succeeded
  useSocketEvent('rejoin_success', ({ sessionId, playerId, phase }) => {
    setRejoining(false);
    // State will be updated by session_update event
  });

  // Rejoin failed — clear saved session and show lobby
  useSocketEvent('rejoin_failed', ({ message }) => {
    setRejoining(false);
    clearSession();
    setGameState('lobby');
    showToast(message || 'Could not rejoin session.', 'error');
  });

  useSocketEvent('player_reconnected', ({ playerName }) => {
    showToast(`${playerName} rejoined the game!`, 'success');
  });

  useSocketEvent('player_disconnected', ({ playerName }) => {
    showToast(`${playerName} disconnected — spot held for 2.5 minutes`, 'info');
  });

  useSocketEvent('player_turn_skipped', ({ playerName }) => {
    showToast(`${playerName} is away — auto-passing their card`, 'info');
  });

  useSocketEvent('session_update', (s) => {
    setSession(s);
    if      (s.phase === 'lobby')   setGameState('waiting');
    else if (s.phase === 'submit')  { setGameState('submit'); setScoringData(null); }
    else if (s.phase === 'loading') setGameState('submit');
    else if (s.phase === 'playing') setGameState(prev => prev === 'scoring' ? 'scoring' : 'playing');
    else if (s.phase === 'buzzing') setGameState(prev => prev === 'scoring' ? 'scoring' : 'playing');
    else if (s.phase === 'scoring') setGameState('scoring');
    else if (s.phase === 'ended')   { setGameState('ended'); clearSession(); }
  });

  useSocketEvent('round_scored', (data) => {
    setScoringData(data);
    setGameState('scoring');
  });

  useSocketEvent('game_ended', ({ finalScores: fs }) => {
    setFinalScores(fs);
    setGameState('ended');
    clearSession();
  });

  useSocketEvent('error',      ({ message }) => showToast(message, 'error'));
  useSocketEvent('word_error', ({ message }) => showToast(message, 'error'));
  useSocketEvent('buzzer_pressed', ({ playerName, playerId: bid }) => {
    if (bid !== myInfo?.playerId) showToast(`${playerName} buzzed!`, 'info');
  });
  useSocketEvent('card_incoming', ({ fromPlayerName, toPlayerId }) => {
    if (toPlayerId === myInfo?.playerId) showToast(`Card from ${fromPlayerName}!`, 'success');
  });

  function handleJoined(info) {
    setMyInfo(info);
    setGameState('waiting');
    saveSession(info); // Save to localStorage for rejoin
  }

  function handlePlayAgain() {
    socket.disconnect();
    clearSession();
    setSession(null); setMyInfo(null); setFinalScores(null); setScoringData(null);
    setGameState('lobby');
  }

  function completeTutorial() {
    setShowTutorial(false);
    try { window.localStorage.setItem(TUTORIAL_SEEN_KEY, 'true'); } catch (e) {}
  }

  // Show rejoining spinner while attempting to reconnect
  if (rejoining) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--parchment)' }}>
        <div className="spinner" style={{ marginBottom: 16 }} />
        <p style={{ color: 'var(--muted)', fontSize: 15 }}>Rejoining your game…</p>
        <button
          onClick={() => { setRejoining(false); clearSession(); setGameState('lobby'); }}
          style={{ marginTop: 20, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
        >
          Go to Lobby instead
        </button>
      </div>
    );
  }

  if (showTutorial) {
    return <TutorialPage onDone={completeTutorial} />;
  }

  return (
    <>
      {gameState === 'lobby'   && <LobbyPage onJoined={handleJoined} onShowTutorial={() => setShowTutorial(true)} />}
      {gameState === 'waiting' && session && myInfo && <WaitingRoom session={session} playerId={myInfo.playerId} isHost={myInfo.isHost} />}
      {gameState === 'submit'  && session && myInfo && <SubmitWord  session={session} playerId={myInfo.playerId} />}
      {gameState === 'playing' && session && myInfo && <GamePlay    session={session} playerId={myInfo.playerId} />}
      {gameState === 'scoring' && session && myInfo && <ScoringPage session={session} playerId={myInfo.playerId} isHost={myInfo.isHost} scoringData={scoringData} />}
      {gameState === 'ended'   && finalScores && myInfo && <GameEnded finalScores={finalScores} playerId={myInfo.playerId} onPlayAgain={handlePlayAgain} />}
      <ToastContainer toasts={toasts} />
    </>
  );
}
