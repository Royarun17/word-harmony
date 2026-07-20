import React, { useState } from 'react';
import axios from 'axios';
import socket from '../utils/socket';
import { auth, signOut } from '../utils/firebase';
import { ThemeSwitcher, SectionHeader, PlayerAvatar } from './SynapseComponents';

const MODES = {
  syntax: {
    icon: '🧠', name: 'Syntax', desc: 'Synonyms of your word',
    color: 'var(--accent)', hint: 'POPULAR',
    bullets: ['Submit any English word','Get 3 synonym cards generated','Collect 3 matching cards and buzz','Easy → common · Hard → rare vocab','Best for vocabulary and word lovers'],
    example: { word: 'happy', cards: ['Joyful','Elated','Content'] },
  },
  spark: {
    icon: '⚡', name: 'Spark', desc: 'Associations & topics',
    color: 'var(--warn)', hint: null,
    bullets: ['Submit any topic word','Get 3 associated word cards','Collect 3 matching associations and buzz','Easy → obvious · Hard → cultural refs','Best for creative and lateral thinkers'],
    example: { word: 'football', cards: ['Lineman','Linebacker','League'] },
  },
};

function ModeCard({ mode, selected, onClick }) {
  const m = MODES[mode];
  return (
    <button onClick={onClick} className="syn-panel tap" style={{
      padding: 16, textAlign: 'left', cursor: 'pointer', border: 'none',
      outline: selected ? `2px solid ${m.color}` : 'none',
      transition: 'transform 140ms', position: 'relative', overflow: 'hidden',
    }}
    onMouseDown={e => e.currentTarget.style.transform='scale(0.98)'}
    onMouseUp={e => e.currentTarget.style.transform='scale(1)'}>
      <div style={{ width: 40, height: 40, borderRadius: 99, background: selected ? `linear-gradient(140deg, var(--accent), var(--accent-2))` : 'var(--surface-3)', display: 'grid', placeItems: 'center', marginBottom: 10, fontSize: 20, boxShadow: selected ? 'var(--glow-accent)' : undefined }}>{m.icon}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{m.name}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>{m.desc}</div>
      {m.hint && <span className="syn-chip syn-chip-accent" style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, padding: '2px 8px' }}>{m.hint}</span>}
    </button>
  );
}

function ModePopup({ mode, onContinue, onBack }) {
  const m = MODES[mode];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'oklch(0 0 0 / 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div className="syn-panel" style={{ width: '100%', maxWidth: 420, padding: 24, animation: 'syn-pop 300ms cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `oklch(from ${m.color} l c h / 0.15)`, border: `1px solid oklch(from ${m.color} l c h / 0.3)`, display: 'grid', placeItems: 'center', fontSize: 26 }}>{m.icon}</div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{m.name}</h2>
          </div>
        </div>
        <div style={{ background: 'oklch(from var(--surface-3) l c h / 0.5)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          {m.bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < m.bullets.length - 1 ? 10 : 0 }}>
              <span style={{ color: m.color, fontWeight: 700, fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>•</span>
              <span style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{b}</span>
            </div>
          ))}
        </div>
        <div style={{ background: `oklch(from ${m.color} l c h / 0.1)`, border: `1px solid oklch(from ${m.color} l c h / 0.25)`, borderRadius: 14, padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', color: m.color, marginBottom: 10 }}>EXAMPLE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 99, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>{m.example.word}</span>
            <span style={{ color: 'var(--ink-mute)' }}>→</span>
            {m.example.cards.map(c => (
              <span key={c} className="syn-card" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 600, color: 'var(--card-ink)', borderRadius: 10, display: 'inline-block' }}>{c}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onBack} className="syn-btn-ghost tap" style={{ flex: 1 }}>← Back</button>
          <button onClick={onContinue} className="syn-btn-primary tap" style={{ flex: 2 }}>Play {m.name} →</button>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} className="tap" style={{
      padding: '8px 16px', borderRadius: 99, border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'oklch(from var(--accent) l c h / 0.15)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--ink-mute)',
      fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
      transition: 'all 150ms', fontFamily: 'var(--font-body)',
    }}>{label}</button>
  );
}

export default function LobbyPage({ onJoined, onShowTutorial, prefillName = '', onShowProfile, profile }) {
  const [step, setStep] = useState('mode');
  const [selectedMode, setMode] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [tab, setTab] = useState('create');
  const [code, setCode] = useState('');
  const [difficulty, setDiff] = useState('medium');
  const [maxPlayers, setPlayers] = useState(4);
  const [rounds, setRounds] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const playerName = profile?.username || prefillName || 'Player';
  const gameMode = selectedMode === 'syntax' ? 'education' : 'fun';

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await axios.post('/session/create', { playerName, rounds, gameMode, difficulty, maxPlayers });
      socket.connect();
      socket.emit('join_session', { sessionId: data.sessionId, playerId: data.playerId, playerName });
      onJoined({ sessionId: data.sessionId, playerId: data.playerId, playerName, isHost: true });
    } catch { setError('Could not create game. Try again.'); }
    setLoading(false);
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
      {step === 'mode' && (
        <div className="syn-scene" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <ThemeSwitcher />
          <div className="syn-scene-content" style={{ width: '100%', maxWidth: 420 }}>
            {/* Player row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <PlayerAvatar name={profile?.username || 'Player'} seed={profile?.username} score={profile?.totalPoints} size="md" />
              <button onClick={onShowProfile} className="syn-chip tap" style={{ cursor: 'pointer', border: 'none' }}>👤 Profile</button>
            </div>

            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative' }}>
              <div style={{ position: 'absolute', left: '50%', top: -20, transform: 'translateX(-50%)', width: 180, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent), transparent 60%)', opacity: 0.3, filter: 'blur(24px)', pointerEvents: 'none' }}/>
              <div style={{ fontSize: 10, letterSpacing: '0.4em', fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>REAL-TIME WORD GAME</div>
              <h1 style={{ fontSize: 64, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>Synapse</h1>
              <p style={{ fontSize: 14, color: 'var(--ink-dim)', marginTop: 10 }}>Submit a word. Collect a matching set. Buzz first.</p>
            </div>

            {/* Mode cards */}
            <div>
              <SectionHeader eyebrow="Choose a mode" title="Play" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <ModeCard mode="syntax" selected={selectedMode === 'syntax'} onClick={() => { setMode('syntax'); setShowPopup(true); }} />
                <ModeCard mode="spark" selected={selectedMode === 'spark'} onClick={() => { setMode('spark'); setShowPopup(true); }} />
              </div>
            </div>

            {/* Quick play */}
            <div className="syn-panel" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>QUICK PLAY</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>Jump into a lobby</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Medium · Syntax · 5 rounds</div>
                </div>
                <button onClick={() => { setMode('syntax'); setStep('play'); }} className="syn-btn-primary tap" style={{ minHeight: 48, padding: '0 20px', fontSize: 14 }}>▶ PLAY</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={onShowTutorial} className="syn-btn-ghost tap">📖 Tutorial</button>
                <button onClick={() => { setMode('syntax'); setStep('play'); setTab('join'); }} className="syn-btn-ghost tap">🔗 Join</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'play' && selectedMode && (
        <div className="syn-scene" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <ThemeSwitcher />
          <div className="syn-scene-content" style={{ width: '100%', maxWidth: 420 }}>
            {/* Back + mode */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button onClick={() => setStep('mode')} className="syn-btn-ghost tap" style={{ minHeight: 40, padding: '0 14px', fontSize: 13 }}>← Back</button>
              <div style={{ flex: 1 }}/>
              <span className="syn-chip syn-chip-accent">{MODES[selectedMode].icon} {MODES[selectedMode].name}</span>
            </div>

            <div className="syn-panel" style={{ padding: 24 }}>
              {/* Tabs */}
              <div style={{ display: 'flex', background: 'oklch(from var(--surface-3) l c h / 0.5)', borderRadius: 99, padding: 4, marginBottom: 24 }}>
                {['create','join'].map(t => (
                  <button key={t} onClick={() => setTab(t)} className="tap" style={{
                    flex: 1, padding: '10px', borderRadius: 99, border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
                    background: tab === t ? 'var(--surface-2)' : 'transparent',
                    color: tab === t ? 'var(--ink)' : 'var(--ink-mute)',
                    boxShadow: tab === t ? 'var(--shadow-card)' : 'none',
                    transition: 'all 200ms',
                  }}>{t === 'create' ? 'Create game' : 'Join game'}</button>
                ))}
              </div>

              {tab === 'join' ? (
                <form onSubmit={handleJoin}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 8 }}>Session code</div>
                  <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="XK7F2" maxLength={5}
                    style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--accent)', fontSize: 28, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.2em', textAlign: 'center', boxSizing: 'border-box', outline: 'none', marginBottom: 16 }}/>
                  {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
                  <button type="submit" disabled={loading} className="syn-btn-primary tap" style={{ width: '100%' }}>{loading ? 'Joining…' : 'Join game →'}</button>
                </form>
              ) : (
                <form onSubmit={handleCreate}>
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 10 }}>Difficulty</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Pill label="😊 Easy" active={difficulty==='easy'} onClick={() => setDiff('easy')}/>
                      <Pill label="🧠 Medium" active={difficulty==='medium'} onClick={() => setDiff('medium')}/>
                      <Pill label="🔥 Hard" active={difficulty==='hard'} onClick={() => setDiff('hard')}/>
                    </div>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 10 }}>Players</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[3,4,5,6,7,8].map(n => <Pill key={n} label={`${n}`} active={maxPlayers===n} onClick={() => setPlayers(n)}/>)}
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 10 }}>Rounds</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[3,5,7,10].map(n => <Pill key={n} label={`${n}`} active={rounds===n} onClick={() => setRounds(n)}/>)}
                    </div>
                  </div>
                  {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
                  <button type="submit" disabled={loading} className="syn-btn-primary tap" style={{ width: '100%' }}>{loading ? 'Creating…' : 'Create game →'}</button>
                </form>
              )}

              <button onClick={onShowTutorial} className="syn-btn-ghost tap" style={{ width: '100%', marginTop: 10 }}>📖 How to play</button>
            </div>
          </div>
        </div>
      )}

      {showPopup && selectedMode && (
        <ModePopup mode={selectedMode} onContinue={() => { setShowPopup(false); setStep('play'); }} onBack={() => setShowPopup(false)} />
      )}
    </>
  );
}
