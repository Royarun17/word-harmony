import React, { useState } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import socket from '../utils/socket';

export default function LobbyPage({ onJoined }) {
  const [tab, setTab] = useState('create'); // create | join
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState(5);
  const [gameMode, setGameMode] = useState('education');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Enter your name.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await axios.post('/session/create', { playerName: name.trim(), rounds, gameMode });
      const { sessionId, playerId } = data;
      socket.connect();
      socket.emit('join_session', { sessionId, playerId, playerName: name.trim() });
      onJoined({ sessionId, playerId, playerName: name.trim(), isHost: true });
    } catch {
      setError('Could not create session. Is the server running?');
    }
    setLoading(false);
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Enter your name.'); return; }
    if (!code.trim()) { setError('Enter a session code.'); return; }
    setLoading(true); setError('');
    try {
      const sessionId = code.trim().toUpperCase();
      await axios.get(`/session/${sessionId}`);
      const playerId = uuidv4();
      socket.connect();
      socket.emit('join_session', { sessionId, playerId, playerName: name.trim() });
      onJoined({ sessionId, playerId, playerName: name.trim(), isHost: false });
    } catch {
      setError('Session not found. Check the code and try again.');
    }
    setLoading(false);
  }

  return (
    <div className="page-center" style={{ background: 'var(--ink)', minHeight: '100vh' }}>
      {/* Background texture dots */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.04,
        backgroundImage: 'radial-gradient(circle, var(--parchment) 1px, transparent 1px)',
        backgroundSize: '32px 32px', pointerEvents: 'none'
      }} />

      <div className="container-sm" style={{ position: 'relative' }}>
        {/* Logo */}
        <div className="text-center" style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, color: 'var(--gold)', lineHeight: 1, letterSpacing: '-0.02em' }}>
            Word Harmony
          </h1>
          <p style={{ color: 'rgba(247,242,232,0.6)', fontSize: 15, marginTop: 8 }}>
            Match synonyms. Beat the buzzer. Win.
          </p>
        </div>

        <div className="panel">
          {/* Tabs */}
          <div className="flex gap-8" style={{ marginBottom: 28 }}>
            {['create', 'join'].map(t => (
              <button
                key={t}
                className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
                onClick={() => { setTab(t); setError(''); }}
              >
                {t === 'create' ? '＋ Create Game' : '→ Join Game'}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background: '#FEE', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 20, fontSize: 14, color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="flex-col gap-16">
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--muted)' }}>YOUR NAME</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Arun" maxLength={20} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--muted)' }}>ROUNDS</label>
                <div className="flex gap-8">
                  {[3, 5, 7, 10].map(r => (
                    <button type="button" key={r}
                      className={`btn ${rounds === r ? 'btn-teal' : 'btn-outline'} btn-sm`}
                      style={{ flex: 1 }}
                      onClick={() => setRounds(r)}
                    >{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--muted)' }}>GAME MODE</label>
                <div className="flex gap-8">
                  <button type="button"
                    className={`btn ${gameMode === 'education' ? 'btn-teal' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                    onClick={() => setGameMode('education')}
                  >
                    📚 Education
                  </button>
                  <button type="button"
                    className={`btn ${gameMode === 'fun' ? 'btn-gold' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                    onClick={() => setGameMode('fun')}
                  >
                    🎉 Fun
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                  {gameMode === 'education'
                    ? '📚 Match synonyms — words with the same meaning'
                    : '🎉 Match associations — words related to the same topic'}
                </p>
              </div>
              <button className="btn btn-gold btn-lg w-full" type="submit" disabled={loading}>
                {loading ? 'Creating…' : 'Create Game'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="flex-col gap-16">
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--muted)' }}>YOUR NAME</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya" maxLength={20} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--muted)' }}>SESSION CODE</label>
                <input className="input" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. X7K2A" maxLength={6}
                  style={{ fontFamily: 'monospace', fontSize: 22, letterSpacing: '0.15em', textAlign: 'center' }} />
              </div>
              <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
                {loading ? 'Joining…' : 'Join Game'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'rgba(247,242,232,0.35)', fontSize: 13 }}>
          Word Harmony · Vocabulary Card Game Prototype
        </p>
      </div>
    </div>
  );
}
