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

const TUTORIAL_KEY = 'wordHarmonyTutorialSeen';
const SESSION_KEY  = 'wordHarmonySession';
const REJOIN_GRACE = 90000; // 1.5 minutes in ms

export default function App() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [gameState, setGameState]       = useState('lobby');
  const [session, setSession]           = useState(null);
  const [myInfo, setMyInfo]             = useState(null);
  const [finalScores, setFinalScores]   = useState(null);
  const [scoringData, setScoringData]   = useState(null);
  const [rejoining, setRejoining]       = useState(false);

  const { toasts, show: showToast } = useToast();

  // ── On mount: check tutorial + auto-rejoin ──────────────────────────────────
  useEffect(() => {
    try {
      // Tutorial
      if (!window.localStorage.getItem(TUTORIAL_KEY)) setShowTutorial(true);

      // Auto-rejoin if within 1.5 min grace window
      const saved = window.localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const { sessionId, playerId, playerName, isHost, savedAt } = parsed;
        const elapsed = Date.now() - (savedAt || 0);

        if (sessionId && playerId && elapsed < REJOIN_GRACE) {
          // Within 1.5 min — auto-rejoin without code
          setRejoining(true);
          setMyInfo({ sessionId, playerId, playerName, isHost });
          socket.connect();
          socket.emit('rejoin_session', { sessionId, playerId, playerName });
        } else if (elapsed >= REJOIN_GRACE) {
          // Expired — clear session, show lobby
          // But keep sessionId so LobbyPage can pre-fill the code
          window.localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (e) {}
  }, []);

  // ── Browser back button handling ────────────────────────────────────────────
  useEffect(() => {
    // Push a history entry when entering waiting/game states
    // so the back button triggers popstate
    if (gameState === 'waiting' || gameState === 'submit') {
      window.history.pushState({ gameState }, '');
    }
  }, [gameState]);

  useEffect(() => {
    function handlePopState(e) {
      const state = e.state?.gameState;
      // Back from waiting room or submit → go to lobby
      if (gameState === 'waiting' || gameState === 'submit') {
        handlePlayAgain();
      }
      // Back from gameplay → show exit confirm (handled in GamePlay component)
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [gameState]);

  // ── Save / clear session ────────────────────────────────────────────────────
  function saveSession(info) {
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...info, savedAt: Date.now() }));
    } catch (e) {}
  }

  function clearSession() {
    try { window.localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  // ── Socket events ────────────────────────────────────────────────────────────
  useSocketEvent('rejoin_success', () => {
    setRejoining(false);
  });

  useSocketEvent('rejoin_failed', ({ message }) => {
    setRejoining(false);
    clearSession();
    setGameState('lobby');
    showToast(message || 'Could not rejoin — please enter the session code.', 'error');
  });

  useSocketEvent('player_reconnected', ({ playerName }) => {
    showToast(`${playerName} rejoined the game!`, 'success');
  });

  useSocketEvent('player_disconnected', ({ playerName }) => {
    showToast(`${playerName} disconnected — spot held`, 'info');
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
    setFinalScores(fs); setGameState('ended'); clearSession();
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
    saveSession(info);
  }

  function handlePlayAgain() {
    socket.disconnect();
    clearSession();
    setSession(null); setMyInfo(null); setFinalScores(null); setScoringData(null);
    setGameState('lobby');
  }

  function completeTutorial() {
    setShowTutorial(false);
    try { window.localStorage.setItem(TUTORIAL_KEY, 'true'); } catch (e) {}
  }

  // ── Rejoining spinner ────────────────────────────────────────────────────────
  if (rejoining) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--parchment)' }}>
        <div className="spinner" style={{ marginBottom:16 }} />
        <p style={{ color:'var(--muted)', fontSize:15 }}>Rejoining your game…</p>
        <button
          onClick={() => { setRejoining(false); clearSession(); setGameState('lobby'); }}
          style={{ marginTop:20, background:'none', border:'none', color:'var(--muted)', fontSize:13, cursor:'pointer', textDecoration:'underline' }}
        >
          Go to Lobby instead
        </button>
      </div>
    );
  }

  if (showTutorial) return <TutorialPage onDone={completeTutorial} />;

  return (
    <>
      {gameState === 'lobby'   && <LobbyPage onJoined={handleJoined} onShowTutorial={() => setShowTutorial(true)} />}
      {gameState === 'waiting' && session && myInfo && <WaitingRoom session={session} playerId={myInfo.playerId} isHost={myInfo.isHost} />}
      {gameState === 'submit'  && session && myInfo && <SubmitWord  session={session} playerId={myInfo.playerId} />}
      {gameState === 'playing' && session && myInfo && <GamePlay    session={session} playerId={myInfo.playerId} onExit={handlePlayAgain} />}
      {gameState === 'scoring' && session && myInfo && <ScoringPage session={session} playerId={myInfo.playerId} isHost={myInfo.isHost} scoringData={scoringData} />}
      {gameState === 'ended'   && finalScores && myInfo && <GameEnded finalScores={finalScores} playerId={myInfo.playerId} onPlayAgain={handlePlayAgain} />}
      <ToastContainer toasts={toasts} />
    </>
  );
}
