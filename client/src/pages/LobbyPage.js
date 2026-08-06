import React, { useState } from 'react';
import axios from 'axios';
import socket from '../utils/socket';
import { auth, signOut } from '../utils/firebase';
import { ThemeSwitcher, PlayerAvatar, useTheme } from '../SynapseComponents';
import lobbyBg from '../assets/lobbyBgData.js';

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
    <div style={{ position: 'fixed', inset: 0, background: 'oklch(0 0 0 / 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px 16px' }}>
      <style>{`
        @media (orientation: landscape) and (max-width: 900px) and (max-height: 500px) {
          .mode-popup-panel { max-height: calc(100dvh - 24px); overflow-y: auto; padding: 16px !important; }
        }
      `}</style>
      <div className="panel mode-popup-panel" style={{ width: '100%', maxWidth: 420, padding: 24, borderRadius: 28, animation: 'syn-pop 300ms cubic-bezier(.2,.8,.2,1)' }}>
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

  const { toggle: toggleTheme } = useTheme() || {};
  const playerName = profile?.username || prefillName || 'Player';

  // Real, deterministic ID derived from the player's actual username — not
  // random or fake, just a stable short code so it reads like Player ID UI.
  const playerIdCode = React.useMemo(() => {
    const s = playerName || 'PLAYER';
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return String(Math.abs(h) % 100000).padStart(5, '0');
  }, [playerName]);
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
        <div className="scene" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `url(${lobbyBg})`, backgroundSize: 'cover', backgroundPosition: 'center',
          }}/>
          <style>{`
            .mode-card-play:hover { filter: brightness(1.12); }
            .mode-card-play:active { transform: scale(0.97); }
            .lobby-nav-btn:hover { filter: brightness(1.2); }
          `}</style>
          <div className="scene-content" style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: 20 }}>

            {/* Top row: profile card left, settings right */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <button
                onClick={() => onShowProfile && onShowProfile()}
                className="tap-target"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px 8px 8px', borderRadius: 16, background: '#1A1642', border: '2px solid #7D3CFF', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ position: 'relative' }}>
                  <PlayerAvatar name={playerName} seed={playerName} score={profile?.totalPoints} size="md" compact />
                  <span style={{
                    position: 'absolute', top: -6, left: -6, minWidth: 22, height: 22, padding: '0 4px',
                    borderRadius: 99, background: '#7D3CFF',
                    color: '#FFFFFF', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center',
                    border: '2px solid #1A1642',
                  }}>{profile?.level || 1}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>{playerName}</div>
                  <div className="num" style={{ fontSize: 10, color: '#C4B8FF', letterSpacing: '0.06em' }}>ID: SYN{playerIdCode}</div>
                </div>
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px 6px 6px', borderRadius: 999, background: '#1A1642', border: '2px solid #7D3CFF' }}>
                  <span style={{ width: 18, height: 18, borderRadius: 99, background: '#FFD21F', display: 'grid', placeItems: 'center', fontSize: 10 }}>⭐</span>
                  <span className="num" style={{ color: '#FFD21F', fontWeight: 700, fontSize: 13 }}>{(profile?.coins ?? 1000).toLocaleString()}</span>
                </span>
                {toggleTheme && (
                  <button onClick={toggleTheme} className="tap-target lobby-nav-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 16px', borderRadius: 14, background: '#0F1D5D', border: '2px solid #1E404F', cursor: 'pointer' }}>
                    <span style={{ fontSize: 18, color: '#FFFFFF' }}>⚙</span>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#FFFFFF' }}>SETTINGS</span>
                  </button>
                )}
              </div>
            </div>

            {/* Left nav column: Profile / Tutorial / Friends */}
            <div style={{ position: 'absolute', left: 20, top: 96, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => onShowProfile && onShowProfile()} className="tap-target lobby-nav-btn" style={{ width: 84, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 8px', borderRadius: 14, background: '#1E3A8A', border: '2px solid #3B82F6', cursor: 'pointer' }}>
                <span style={{ fontSize: 18, color: '#FFFFFF' }}>👤</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: '#FFFFFF' }}>PROFILE</span>
              </button>
              <button onClick={onShowTutorial} className="tap-target lobby-nav-btn" style={{ width: 84, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 8px', borderRadius: 14, background: '#6B21A8', border: '2px solid #A855F7', cursor: 'pointer' }}>
                <span style={{ fontSize: 18, color: '#FFFFFF' }}>📖</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: '#FFFFFF' }}>TUTORIAL</span>
              </button>
              <div className="lobby-nav-btn" style={{ width: 84, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 8px', borderRadius: 14, background: '#15803D', border: '2px solid #22C55E', position: 'relative' }}>
                <span style={{ fontSize: 18, color: '#FFFFFF' }}>🧑‍🤝‍🧑</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: '#FFFFFF' }}>FRIENDS</span>
                <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 99, background: 'rgba(0,0,0,.4)', color: '#FFFFFF' }}>SOON</span>
              </div>
            </div>

            {/* Chat, bottom-right, matching reference position — visual only, no functionality */}
            <div className="lobby-nav-btn" style={{ position: 'absolute', right: 20, bottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 16px', borderRadius: 14, background: '#1E3A8A', border: '2px solid #3B82F6' }}>
              <span style={{ fontSize: 18, color: '#FFFFFF' }}>💬</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#FFFFFF' }}>CHAT</span>
              <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 99, background: 'rgba(0,0,0,.4)', color: '#FFFFFF' }}>SOON</span>
            </div>

            {/* Mode cards, anchored toward the bottom like the reference's temple steps */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 14, paddingBottom: 8 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                {Object.entries(MODES).map(([key, m]) => (
                  <div key={key} style={{
                    width: 200, padding: 18, textAlign: 'center', position: 'relative', overflow: 'hidden',
                    borderRadius: 18, background: '#1A1F4D',
                    border: `2px solid ${m.accent ? '#00C2FF' : '#FF9D21'}`,
                    boxShadow: m.accent ? '0 0 24px rgba(0,194,255,.45)' : '0 0 24px rgba(255,157,33,.45)',
                  }}>
                    {m.accent && <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: 'rgba(0,194,255,.18)', color: '#00C2FF', border: '1px solid rgba(0,194,255,.4)' }}>POPULAR</span>}
                    <div style={{
                      width: 52, height: 52, margin: '0 auto 10px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 22,
                      background: m.accent ? 'radial-gradient(circle at 30% 25%, #6FE3FF, #00C2FF 45%, #0089B8 100%)' : 'radial-gradient(circle at 30% 25%, #FFC46B, #FF9D21 45%, #C96F00 100%)',
                      boxShadow: 'inset 0 2px 4px rgba(255,255,255,.35), inset 0 -4px 8px rgba(0,0,0,.25)',
                      color: '#0B1024',
                    }}>{m.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.04em', marginBottom: 4, color: '#FFFFFF' }}>{m.name.toUpperCase()}</div>
                    <div style={{ marginBottom: 14 }} />
                    <button
                      onClick={() => { setMode(key); setShowPopup(true); }}
                      className="tap-target mode-card-play"
                      style={{
                        width: '100%', minHeight: 44, borderRadius: 999, border: 'none', cursor: 'pointer',
                        fontWeight: 700, fontSize: 14, color: '#FFFFFF',
                        background: m.accent ? 'linear-gradient(180deg, #2E9EFF, #0066CC)' : 'linear-gradient(180deg, #FFAB3D, #E07800)',
                      }}
                    >
                      ▶ PLAY
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={() => { setMode('syntax'); setStep('play'); setTab('join'); }} className="btn-ghost tap-target">
                🔗 Join with code
              </button>
            </div>
          </div>
        </div>
      )}
      {step === 'play' && selectedMode && (
        <div className="scene lobby-play-scene" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <style>{`
            @media (orientation: landscape) and (max-width: 900px) and (max-height: 500px) {
              .lobby-play-scene { padding: 12px !important; }
              .lobby-play-panel { max-height: calc(100dvh - 24px); overflow-y: auto; padding: 14px !important; }
            }
          `}</style>
          <ThemeSwitcher />
          <div className="scene-content" style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button onClick={() => setStep('mode')} className="btn-ghost tap-target" style={{ minHeight: 44, padding: '0 14px', fontSize: 13 }}>← Back</button>
              <div style={{ flex: 1 }}/>
              <span className="chip chip-accent">{MODES[selectedMode].icon} {MODES[selectedMode].name}</span>
            </div>
            <div className="panel lobby-play-panel" style={{ padding: 24 }}>
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
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{[4,5,6,7,8].map(n => <Pill key={n} label={`${n}`} active={maxPlayers===n} onClick={() => setPlayers(n)}/>)}</div>
                  </div>
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 10 }}>Rounds</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{[3,5,7,10].map(n => <Pill key={n} label={`${n}`} active={rounds===n} onClick={() => setRounds(n)}/>)}</div>
                  </div>
                  {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
                  <button type="submit" disabled={loading} className="btn-cta tap-target" style={{ width: '100%' }}>{loading ? 'Creating…' : 'Create game →'}</button>
                </form>
              )}

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
