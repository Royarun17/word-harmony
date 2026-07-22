import React, { useState } from 'react';
import axios from 'axios';
import socket from '../utils/socket';
import { auth, signOut } from '../utils/firebase';
import { ThemeSwitcher, SectionHeader, PlayerAvatar } from '../SynapseComponents';

const MODES = {
  syntax: { icon: '🧠', name: 'Syntax', desc: 'Synonyms of your word', accent: true,
    bullets: ['Submit any English word','Get 3 synonym cards generated','Collect 3 matching cards and buzz','Easy → common · Hard → rare vocab','Best for vocabulary and word lovers'],
    example: { word: 'happy', cards: ['Joyful','Elated','Content'] } },
  spark: { icon: '⚡', name: 'Spark', desc: 'Associations & topics', accent: false,
    bullets: ['Submit any topic word','Get 3 associated word cards','Collect 3 matching associations and buzz','Easy → obvious · Hard → cultural refs','Best for creative and lateral thinkers'],
    example: { word: 'football', cards: ['Lineman','Linebacker','League'] } },
};

function ModePopup({ mode, onContinue, onBack }) {
  const m = MODES[mode];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'oklch(0 0 0 / 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100, padding: '0 16px 24px' }}>
      <div className="panel" style={{ width: '100%', maxWidth: 420, padding: 24, borderRadius: 28, animation: 'syn-pop 300ms cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: m.accent ? 'linear-gradient(140deg, var(--accent), var(--accent-2))' : 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: 26, boxShadow: m.accent ? 'var(--glow-accent)' : undefined }}>{m.icon}</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{m.name}</h2>
        </div>
        <div style={{ background: 'oklch(0.32 0.04 228 / 0.5)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          {m.bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < m.bullets.length - 1 ? 10 : 0 }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>•</span>
              <span style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{b}</span>
            </div>
          ))}
        </div>
        <div style={{ background: 'oklch(0.82 0.16 195 / 0.1)', border: '1px solid oklch(0.82 0.16 195 / 0.25)', borderRadius: 14, padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10 }}>EXAMPLE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 99, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>{m.example.word}</span>
            <span style={{ color: 'var(--ink-mute)' }}>→</span>
            {m.example.cards.map(c => (
              <span key={c} className="card-surface" style={{ padding: '4px 10px', fontSize: 12, fontWeight: 600, color: 'var(--card-ink)', borderRadius: 10, display: 'inline-block' }}>{c}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onBack} className="btn-ghost tap-target" style={{ flex: 1 }}>← Back</button>
          <button onClick={onContinue} className="btn-primary tap-target" style={{ flex: 2 }}>Play {m.name} →</button>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} className="tap-target" style={{
      padding: '8px 16px', borderRadius: 99,
      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'oklch(0.82 0.16 195 / 0.15)' : 'transparent',
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
        <div className="scene" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
          <ThemeSwitcher />
          <div className="scene-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '56px 20px 24px', overflowY: 'auto' }}>

            {/* Profile row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
              <div onClick={() => onShowProfile && onShowProfile()} style={{ cursor: 'pointer' }}>
                <PlayerAvatar name={profile?.username || 'Player'} seed={profile?.username} score={profile?.totalPoints} size="md" />
              </div>
              <span className="chip chip-accent">
                ⚡ LVL {profile?.level || 1}
              </span>
            </div>

            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative' }}>
              <div style={{ position: 'absolute', left: '50%', top: -16, transform: 'translateX(-50%)', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent), transparent 60%)', opacity: 0.4, filter: 'blur(24px)', pointerEvents: 'none' }}/>
              <div style={{ fontSize: 11, letterSpacing: '0.4em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>REAL-TIME WORD GAME</div>
              <h1 style={{ fontSize: 64, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1, letterSpacing: '-0.02em' }}>Synapse</h1>
              <p style={{ fontSize: 14, color: 'var(--ink-dim)', marginTop: 12, maxWidth: 280, margin: '12px auto 0' }}>Submit a word. Collect a matching set. Buzz first.</p>
            </div>

            {/* Mode cards */}
            <div style={{ marginBottom: 32 }}>
              <SectionHeader eyebrow="Choose a mode" title="Play" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {Object.entries(MODES).map(([key, m]) => (
                  <button key={key} onClick={() => { setMode(key); setShowPopup(true); }} className="panel tap-target" type="button"
                    style={{ padding: 16, textAlign: 'left', cursor: 'pointer', border: 'none', outline: m.accent ? '1px solid var(--accent)' : 'none', transition: 'transform 140ms', position: 'relative', overflow: 'hidden' }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <div style={{ width: 36, height: 36, borderRadius: 99, background: m.accent ? 'linear-gradient(140deg, var(--accent), var(--accent-2))' : 'var(--surface-3)', display: 'grid', placeItems: 'center', marginBottom: 12, fontSize: 18, boxShadow: m.accent ? 'var(--glow-accent)' : undefined, color: m.accent ? 'var(--accent-ink)' : 'var(--ink)' }}>{m.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>{m.desc}</div>
                    {m.accent && <span className="chip chip-accent" style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, padding: '2px 8px' }}>POPULAR</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick play */}
            <div className="panel" style={{ padding: 16, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '0.24em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>QUICK PLAY</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>Jump into a lobby</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Medium · Syntax · 5 rounds</div>
                </div>
                <button onClick={() => { setMode('syntax'); setShowPopup(true); }} className="btn-primary tap-target" style={{ whiteSpace: 'nowrap' }}>▶ PLAY</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={onShowTutorial} className="btn-ghost tap-target">📖 Tutorial</button>
                <button onClick={() => { setMode('syntax'); setStep('play'); setTab('join'); }} className="btn-ghost tap-target">🔗 Join</button>
              </div>
            </div>

            {/* Friends row */}
            <div>
              <SectionHeader eyebrow="Online" title="Friends" right={
                <button style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>See all</button>
              }/>
              <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
                {['Mika T.','Priya S.','Diego A.','Noor I.','Sam C.'].map(n => (
                  <div key={n} style={{ flexShrink: 0 }}>
                    <PlayerAvatar name={n} seed={n} compact size="md" active={n === 'Mika T.'} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'play' && selectedMode && (
        <div className="scene" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <ThemeSwitcher />
          <div className="scene-content" style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button onClick={() => setStep('mode')} className="btn-ghost tap-target" style={{ minHeight: 44, padding: '0 14px', fontSize: 13 }}>← Back</button>
              <div style={{ flex: 1 }}/>
              <span className="chip chip-accent">{MODES[selectedMode].icon} {MODES[selectedMode].name}</span>
            </div>
            <div className="panel" style={{ padding: 24 }}>
              <div style={{ display: 'flex', background: 'oklch(0.32 0.04 228 / 0.5)', borderRadius: 99, padding: 4, marginBottom: 24 }}>
                {['create','join'].map(t => (
                  <button key={t} onClick={() => setTab(t)} className="tap-target" style={{ flex: 1, padding: '10px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)', background: tab === t ? 'oklch(0.27 0.035 230)' : 'transparent', color: tab === t ? 'var(--ink)' : 'var(--ink-mute)', transition: 'all 200ms' }}>{t === 'create' ? 'Create game' : 'Join game'}</button>
                ))}
              </div>
              {tab === 'join' ? (
                <form onSubmit={handleJoin}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 8 }}>Session code</div>
                  <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="XK7F2" maxLength={5}
                    style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1.5px solid var(--border)', background: 'var(--s1, oklch(0.22 0.03 232))', color: 'var(--accent)', fontSize: 28, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.2em', textAlign: 'center', boxSizing: 'border-box', outline: 'none', marginBottom: 16 }}/>
                  {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary tap-target" style={{ width: '100%' }}>{loading ? 'Joining…' : 'Join game →'}</button>
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
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{[3,4,5,6,7,8].map(n => <Pill key={n} label={`${n}`} active={maxPlayers===n} onClick={() => setPlayers(n)}/>)}</div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 10 }}>Rounds</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{[3,5,7,10].map(n => <Pill key={n} label={`${n}`} active={rounds===n} onClick={() => setRounds(n)}/>)}</div>
                  </div>
                  {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary tap-target" style={{ width: '100%' }}>{loading ? 'Creating…' : 'Create game →'}</button>
                </form>
              )}
              <button onClick={onShowTutorial} className="btn-ghost tap-target" style={{ width: '100%', marginTop: 10 }}>📖 How to play</button>
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
