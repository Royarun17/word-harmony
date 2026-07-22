import React, { useState } from 'react';
import socket from '../utils/socket';
import { PlayerAvatar, ThemeSwitcher, Dialog, OfflineState } from '../SynapseComponents';

const AVATARS = ['😎','🧠','🦊','🐯','🐸','🦁','🐧','🐉','🦋','🐺','🦅','🐬','🎭','🧩','⚡','🔥'];

export default function WaitingRoom({ session, playerId, isHost, onBack }) {
  const [showAvatar, setShowAvatar] = useState(false);
  const [copied, setCopied] = useState(false);
  const players = session.players || [];
  const maxPlayers = session.maxPlayers || 4;
  const botsNeeded = Math.max(0, maxPlayers - players.length);
  const canStart = isHost && players.filter(p => !p.isBot).length >= 1;
  const allSeats = [...players, ...Array(botsNeeded).fill(null)];

  function handleStart() { socket.emit('start_submission', { sessionId: session.id }); }
  function handleAvatarChange(av) { socket.emit('update_avatar', { sessionId: session.id, playerId, avatar: av }); setShowAvatar(false); }
  function handleCopy() { try { navigator.clipboard.writeText(session.id); } catch {} setCopied(true); setTimeout(() => setCopied(false), 1400); }

  return (
    <div className="scene" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <ThemeSwitcher />
      <div className="scene-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '56px 20px 24px', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={() => { socket.disconnect(); onBack && onBack(); }} className="tap-target" style={{ width: 40, height: 40, borderRadius: 99, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', color: 'var(--ink)', fontSize: 18, cursor: 'pointer' }}>←</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.32em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>PRIVATE ROOM</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{session.gameMode === 'fun' ? 'Spark' : 'Syntax'} · {session.rounds} rounds</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 99, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', color: 'var(--ink)', fontSize: 16, cursor: 'pointer' }}>⚙</div>
        </div>

        {/* Session code */}
        <div className="panel" style={{ padding: 20, textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.32em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>INVITE CODE</div>
          <div className="number-tab" style={{ fontSize: 40, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.24em', color: 'var(--ink)', marginBottom: 12 }}>{session.id}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <button onClick={handleCopy} className="btn-ghost tap-target">{copied ? '✓ Copied!' : '⎘ Copy'}</button>
            <button className="btn-ghost tap-target">↗ Share</button>
          </div>
        </div>

        {/* Players count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase' }}>PLAYERS</div>
            <div style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              👥 {players.length} / {maxPlayers}
            </div>
          </div>
          <span className="chip chip-accent">⟳ Waiting…</span>
        </div>

        {/* Seat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {allSeats.slice(0, maxPlayers).map((p, i) => (
            <div key={p?.id || `empty-${i}`} className="panel" style={{ padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', opacity: p ? 1 : 0.55, animation: 'syn-rise 400ms ease-out both' }}>
              {p ? (
                <div style={{ position: 'relative' }}>
                  <PlayerAvatar name={p.name} seed={p.name} compact size="md" active={!!p.id} />
                  {p.id === playerId && (
                    <button onClick={() => setShowAvatar(s => !s)} style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 99, background: 'var(--accent)', border: 'none', cursor: 'pointer', fontSize: 8, color: 'var(--accent-ink)', fontWeight: 700 }}>✏</button>
                  )}
                </div>
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 99, background: 'oklch(from var(--surface-3) l c h / .5)', border: '1px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--ink-mute)' }}>+</div>
              )}
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                {p?.id === session.hostId && <span style={{ color: 'var(--accent)' }}>♛</span>}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{p?.name || 'Empty seat'}</span>
              </div>
              <div style={{ fontSize: 9, marginTop: 2, letterSpacing: '0.18em', fontWeight: 600, color: p ? 'var(--win)' : 'var(--ink-mute)' }}>
                {p ? 'READY' : 'OPEN'}
              </div>
            </div>
          ))}
        </div>

        {/* Avatar picker */}
        {showAvatar && (
          <div className="panel" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>Choose avatar</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 6 }}>
              {AVATARS.map(a => (
                <button key={a} onClick={() => handleAvatarChange(a)} style={{ aspectRatio: '1', borderRadius: 99, background: 'var(--surface-2)', border: '2px solid transparent', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a}</button>
              ))}
            </div>
          </div>
        )}

        {/* Round rules */}
        <div className="panel" style={{ padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.24em', fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase' }}>ROUND RULES</div>
            {isHost && <span className="chip">HOST</span>}
          </div>
          {[['Mode', session.gameMode === 'fun' ? 'Spark · associations' : 'Syntax · synonyms'], ['Rounds', session.rounds], ['Difficulty', session.difficulty || 'Medium']].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: 'var(--ink-mute)' }}>{l}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          {isHost ? (
            <button onClick={handleStart} disabled={!canStart} className="btn-primary tap-target" style={{ flex: 1, opacity: canStart ? 1 : 0.5 }}>
              ▶ START
            </button>
          ) : (
            <div className="panel" style={{ flex: 1, padding: 14, textAlign: 'center' }}>
              <p style={{ color: 'var(--ink-dim)', fontSize: 14 }}>Waiting for host to start…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
