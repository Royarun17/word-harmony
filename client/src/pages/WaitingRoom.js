import React, { useState } from 'react';
import socket from '../utils/socket';
import { PlayerAvatar, ThemeSwitcher } from '../SynapseComponents';

const AVATARS = ['😎','🧠','🦊','🐯','🐸','🦁','🐧','🐉','🦋','🐺','🦅','🐬','🎭','🧩','⚡','🔥'];

export default function WaitingRoom({ session, playerId, isHost }) {
  const [showAvatar, setShowAvatar] = useState(false);
  const players = session.players || [];
  const maxPlayers = session.maxPlayers || 4;
  const botsNeeded = Math.max(0, maxPlayers - players.length);
  const canStart = isHost && players.filter(p => !p.isBot).length >= 1;

  function handleStart() { socket.emit('start_submission', { sessionId: session.id }); }
  function handleAvatarChange(av) {
    socket.emit('update_avatar', { sessionId: session.id, playerId, avatar: av });
    setShowAvatar(false);
  }

  return (
    <div className="syn-scene" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <ThemeSwitcher />
      <div className="syn-scene-content" style={{ width: '100%', maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.32em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>WAITING ROOM</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Lobby</h1>
        </div>

        {/* Session code */}
        <div style={{ background: 'oklch(0 0 0 / 0.35)', border: '1px solid oklch(from var(--accent) l c h / 0.25)', borderRadius: 20, padding: '16px 20px', textAlign: 'center', marginBottom: 14, boxShadow: 'var(--glow-accent)' }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.24em', color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 6 }}>Session code</div>
          <div className="num" style={{ fontSize: 44, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.2em', fontFamily: 'monospace' }}>{session.id}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4 }}>Share with friends</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
          {[
            [`${players.length}/${maxPlayers}`, 'Players'],
            [session.rounds, 'Rounds'],
            [session.difficulty === 'easy' ? '😊' : session.difficulty === 'hard' ? '🔥' : '🧠', session.difficulty || 'Med'],
            [session.gameMode === 'fun' ? '⚡' : '🧠', session.gameMode === 'fun' ? 'Spark' : 'Syntax'],
          ].map(([val, lbl]) => (
            <div key={lbl} className="syn-panel" style={{ padding: '10px 4px', textAlign: 'center', borderRadius: 14 }}>
              <div className="num" style={{ fontSize: val.length > 3 ? 18 : 20, fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: 9, color: 'var(--ink-mute)', marginTop: 2 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Player list */}
        <div className="syn-panel" style={{ overflow: 'hidden', marginBottom: 14 }}>
          {players.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < players.length - 1 || botsNeeded > 0 ? '1px solid var(--border)' : 'none', background: p.id === playerId ? 'oklch(from var(--accent) l c h / 0.05)' : undefined }}>
              <div style={{ position: 'relative' }}>
                <PlayerAvatar name={p.name} seed={p.name} compact size="md" />
                {p.id === playerId && (
                  <button onClick={() => setShowAvatar(s => !s)} style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 99, background: 'var(--accent)', border: 'none', cursor: 'pointer', fontSize: 9, color: 'var(--accent-ink)', fontWeight: 700 }}>✏</button>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}{p.id === playerId ? ' (you)' : ''}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{p.id === session.hostId ? 'Host' : p.isBot ? '🤖 Bot' : 'Player'}</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: 99, background: p.connected === false ? 'var(--border)' : 'var(--win)' }}/>
            </div>
          ))}
          {botsNeeded > 0 && [...Array(botsNeeded)].map((_, i) => (
            <div key={`bot-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < botsNeeded - 1 ? '1px solid var(--border)' : 'none', opacity: 0.4 }}>
              <div style={{ width: 48, height: 48, borderRadius: 99, background: 'var(--surface-2)', border: `2px dashed var(--border)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
              <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Bot will fill in</div>
            </div>
          ))}
        </div>

        {/* Avatar picker */}
        {showAvatar && (
          <div className="syn-panel" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>Choose avatar</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 6 }}>
              {AVATARS.map(a => (
                <button key={a} onClick={() => handleAvatarChange(a)} style={{ aspectRatio: '1', borderRadius: 99, background: 'var(--surface-2)', border: '2px solid transparent', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Start button */}
        {isHost ? (
          <button onClick={handleStart} disabled={!canStart} className="syn-btn-primary tap" style={{ width: '100%', opacity: canStart ? 1 : 0.5 }}>
            {canStart ? 'Start game →' : 'Waiting for players…'}
          </button>
        ) : (
          <div className="syn-panel" style={{ padding: 16, textAlign: 'center' }}>
            <p style={{ color: 'var(--ink-dim)', fontSize: 14 }}>Waiting for host to start…</p>
          </div>
        )}
      </div>
    </div>
  );
}
