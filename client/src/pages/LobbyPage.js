import React, { useState } from 'react';
import axios from 'axios';
import socket from '../utils/socket';
import HomeScreen from '../components/home/HomeScreen';
import RoomSetup from '../components/home/RoomSetup';

export default function LobbyPage({ onJoined, onShowTutorial, prefillName = '', onShowProfile, profile }) {
  const [step, setStep] = useState('home'); // home | play
  const [selectedMode, setMode] = useState('spark');
  const [tab, setTab] = useState('create');
  const [code, setCode] = useState('');
  const [difficulty, setDiff] = useState('medium');
  const [maxPlayers, setPlayers] = useState(4);
  const [rounds, setRounds] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const playerName = profile?.username || prefillName || 'Player';
  const gameMode = selectedMode === 'syntax' ? 'education' : 'fun';

  async function createRoom(settings) {
    setLoading(true); setError('');
    try {
      const { data } = await axios.post('/session/create', { playerName, ...settings });
      socket.connect();
      socket.emit('join_session', { sessionId: data.sessionId, playerId: data.playerId, playerName });
      onJoined({ sessionId: data.sessionId, playerId: data.playerId, playerName, isHost: true });
    } catch { setError('Could not create game. Try again.'); }
    setLoading(false);
  }

  function handleCreate(e) {
    e.preventDefault();
    createRoom({ rounds, gameMode, difficulty, maxPlayers });
  }

  // Home's "Play with Friends": open a room straight away with the default
  // settings, so the host lands in the waiting room with a code to share.
  function quickPlay() {
    createRoom({ rounds: 5, gameMode: 'fun', difficulty: 'medium', maxPlayers: 4 });
  }

  function openPlay(nextTab) {
    setError(''); setTab(nextTab); setStep('play');
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!code.trim()) { setError('Enter a session code.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await axios.post('/session/join', { sessionId: code.trim().toUpperCase(), playerName });
      socket.connect();
      socket.emit('join_session', { sessionId: data.sessionId, playerId: data.playerId, playerName });
      onJoined({ sessionId: data.sessionId, playerId: data.playerId, playerName, isHost: false });
    } catch (err) { setError(err.response?.data?.error || 'Could not join. Check the code.'); }
    setLoading(false);
  }

  return (
    <>
      {step === 'home' && (
        <HomeScreen
          playerName={playerName}
          level={profile?.level || 1}
          avatar={profile?.avatar}
          onProfile={() => onShowProfile && onShowProfile()}
          onCreateRoom={() => openPlay('create')}
          onPlayWithFriends={quickPlay}
          onJoinWithCode={() => openPlay('join')}
          onHowToPlay={onShowTutorial}
          busy={loading}
          error={error}
        />
      )}

      {step === 'play' && (
        <RoomSetup
          tab={tab}
          onTab={t => { setError(''); setTab(t); }}
          onBack={() => { setError(''); setStep('home'); }}
          mode={selectedMode} onMode={setMode}
          difficulty={difficulty} onDifficulty={setDiff}
          maxPlayers={maxPlayers} onMaxPlayers={setPlayers}
          rounds={rounds} onRounds={setRounds}
          code={code} onCode={setCode}
          loading={loading}
          error={error}
          onCreate={handleCreate}
          onJoin={handleJoin}
        />
      )}
    </>
  );
}
