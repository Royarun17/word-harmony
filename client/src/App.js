import React, { useState } from 'react';
import socket from './utils/socket';
import { useSocketEvent } from './hooks/useSocketEvent';
import { useToast, ToastContainer } from './components/Toast';

import LobbyPage   from './pages/LobbyPage';
import WaitingRoom from './pages/WaitingRoom';
import SubmitWord  from './pages/SubmitWord';
import GamePlay    from './pages/GamePlay';
import ScoringPage from './pages/ScoringPage';
import GameEnded   from './pages/GameEnded';

export default function App() {
  const [gameState, setGameState]       = useState('lobby');
  const [session, setSession]           = useState(null);
  const [myInfo, setMyInfo]             = useState(null);
  const [finalScores, setFinalScores]   = useState(null);
  const [scoringData, setScoringData]   = useState(null); // ← store round_scored here

  const { toasts, show: showToast } = useToast();

  useSocketEvent('session_update', (s) => {
    setSession(s);
    if      (s.phase === 'lobby')   setGameState('waiting');
    else if (s.phase === 'submit')  { setGameState('submit'); setScoringData(null); }
    else if (s.phase === 'loading') setGameState('submit');
    else if (s.phase === 'playing') setGameState('playing');
    else if (s.phase === 'buzzing') setGameState('playing');
    else if (s.phase === 'scoring') setGameState('scoring');
    else if (s.phase === 'ended')   setGameState('ended');
  });

  // ← Capture round_scored at App level so it's never missed
  useSocketEvent('round_scored', (data) => {
    setScoringData(data);
    setGameState('scoring');
  });

  useSocketEvent('game_ended', ({ finalScores: fs }) => {
    setFinalScores(fs);
    setGameState('ended');
  });

  useSocketEvent('error',      ({ message }) => showToast(message, 'error'));
  useSocketEvent('word_error', ({ message }) => showToast(message, 'error'));

  useSocketEvent('buzzer_pressed', ({ playerName, playerId: buzzerId }) => {
    if (buzzerId !== myInfo?.playerId) {
      showToast(`${playerName} buzzed!`, 'info');
    }
  });

  useSocketEvent('card_incoming', ({ fromPlayerName, toPlayerId }) => {
    if (toPlayerId === myInfo?.playerId) {
      showToast(`Card incoming from ${fromPlayerName}!`, 'success');
    }
  });

  function handleJoined(info) {
    setMyInfo(info);
    setGameState('waiting');
  }

  function handlePlayAgain() {
    socket.disconnect();
    setSession(null);
    setMyInfo(null);
    setFinalScores(null);
    setScoringData(null);
    setGameState('lobby');
  }

  return (
    <>
      {gameState === 'lobby'   && <LobbyPage onJoined={handleJoined} />}
      {gameState === 'waiting' && session && myInfo && <WaitingRoom session={session} playerId={myInfo.playerId} isHost={myInfo.isHost} />}
      {gameState === 'submit'  && session && myInfo && <SubmitWord  session={session} playerId={myInfo.playerId} />}
      {gameState === 'playing' && session && myInfo && <GamePlay    session={session} playerId={myInfo.playerId} playerName={myInfo.playerName} />}
      {gameState === 'scoring' && session && myInfo && (
        <ScoringPage
          session={session}
          playerId={myInfo.playerId}
          isHost={myInfo.isHost}
          scoringData={scoringData}  // ← pass directly, no waiting
        />
      )}
      {gameState === 'ended' && finalScores && myInfo && <GameEnded finalScores={finalScores} playerId={myInfo.playerId} onPlayAgain={handlePlayAgain} />}
      <ToastContainer toasts={toasts} />
    </>
  );
}
