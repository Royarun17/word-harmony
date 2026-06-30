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

const TUTORIAL_SEEN_KEY = 'wordHarmonyTutorialSeen';

export default function App() {
  // Show tutorial automatically on first-ever visit, then on demand via Lobby button
  const [showTutorial, setShowTutorial] = useState(true);

  const [gameState, setGameState]     = useState('lobby');
  const [session, setSession]         = useState(null);
  const [myInfo, setMyInfo]           = useState(null);
  const [finalScores, setFinalScores] = useState(null);
  const [scoringData, setScoringData] = useState(null);

  const { toasts, show: showToast } = useToast();

  // Remember tutorial completion across reloads using localStorage,
  // falling back gracefully if unavailable
  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(TUTORIAL_SEEN_KEY);
      if (seen === 'true') setShowTutorial(false);
    } catch (e) {
      // localStorage unavailable — tutorial will show every fresh session
    }
  }, []);

  function completeTutorial() {
    setShowTutorial(false);
    try { window.localStorage.setItem(TUTORIAL_SEEN_KEY, 'true'); } catch (e) {}
  }

  function openTutorialManually() {
    setShowTutorial(true);
  }

  useSocketEvent('session_update', (s) => {
    setSession(s);
    if      (s.phase === 'lobby')   setGameState('waiting');
    else if (s.phase === 'submit')  { setGameState('submit'); setScoringData(null); }
    else if (s.phase === 'loading') setGameState('submit');
    else if (s.phase === 'playing') setGameState(prev => prev === 'scoring' ? 'scoring' : 'playing');
    else if (s.phase === 'buzzing') setGameState(prev => prev === 'scoring' ? 'scoring' : 'playing');
    else if (s.phase === 'scoring') setGameState('scoring');
    else if (s.phase === 'ended')   setGameState('ended');
  });

  useSocketEvent('round_scored', (data) => {
    setScoringData(data);
    setGameState('scoring');
  });

  useSocketEvent('game_ended', ({ finalScores: fs }) => {
    setFinalScores(fs); setGameState('ended');
  });

  useSocketEvent('error',      ({ message }) => showToast(message, 'error'));
  useSocketEvent('word_error', ({ message }) => showToast(message, 'error'));
  useSocketEvent('buzzer_pressed', ({ playerName, playerId: bid }) => {
    if (bid !== myInfo?.playerId) showToast(`${playerName} buzzed!`, 'info');
  });
  useSocketEvent('card_incoming', ({ fromPlayerName, toPlayerId }) => {
    if (toPlayerId === myInfo?.playerId) showToast(`Card from ${fromPlayerName}!`, 'success');
  });

  function handleJoined(info) { setMyInfo(info); setGameState('waiting'); }

  function handlePlayAgain() {
    socket.disconnect();
    setSession(null); setMyInfo(null); setFinalScores(null); setScoringData(null);
    setGameState('lobby');
  }

  // Tutorial takes over the whole screen when active —
  // shown automatically before Lobby on first visit, or anytime via the Lobby button
  if (showTutorial) {
    return <TutorialPage onDone={completeTutorial} />;
  }

  return (
    <>
      {gameState === 'lobby'   && <LobbyPage onJoined={handleJoined} onShowTutorial={openTutorialManually} />}
      {gameState === 'waiting' && session && myInfo && <WaitingRoom session={session} playerId={myInfo.playerId} isHost={myInfo.isHost} />}
      {gameState === 'submit'  && session && myInfo && <SubmitWord  session={session} playerId={myInfo.playerId} />}
      {gameState === 'playing' && session && myInfo && <GamePlay    session={session} playerId={myInfo.playerId} />}
      {gameState === 'scoring' && session && myInfo && <ScoringPage session={session} playerId={myInfo.playerId} isHost={myInfo.isHost} scoringData={scoringData} />}
      {gameState === 'ended'   && finalScores && myInfo && <GameEnded finalScores={finalScores} playerId={myInfo.playerId} onPlayAgain={handlePlayAgain} />}
      <ToastContainer toasts={toasts} />
    </>
  );
}
