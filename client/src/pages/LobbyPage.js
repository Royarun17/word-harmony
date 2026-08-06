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

function BrainGlyph() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      <defs>
        <radialGradient id="brainGlow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#C9A6FF"/>
          <stop offset="100%" stopColor="#7B4FE0"/>
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="34" rx="26" ry="16" fill="#B98CFF" opacity="0.18"/>
      <path d="M20 20c-6 0-9 5-8 10-3 2-3 8 1 10-1 5 3 9 8 9 2 3 6 4 9 2 3 2 7 1 9-2 5 0 9-4 8-9 4-2 4-8 1-10 1-5-2-10-8-10-2-3-6-4-9-2-3-2-7-1-11 2z" fill="url(#brainGlow)" stroke="#5B2FBF" strokeWidth="1.5"/>
      <path d="M32 20v29M20 26c3 1 5 4 4 7M44 26c-3 1-5 4-4 7M18 38c3 0 5 2 5 5M46 38c-3 0-5 2-5 5" stroke="#5B2FBF" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7"/>
    </svg>
  );
}

function LightningGlyph() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE49A"/>
          <stop offset="100%" stopColor="#FF9D21"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="24" fill="#FF9D21" opacity="0.14"/>
      <path d="M36 6 16 36h12l-4 22 22-30H34z" fill="url(#boltGrad)" stroke="#C9600A" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function ModeCard({ mode, m, onPlay }) {
  const purple = mode === 'syntax';
  const border = '#E8B94D';
  const glow = purple ? 'rgba(155,92,255,.55)' : 'rgba(255,90,60,.55)';
  const bg = purple
    ? 'linear-gradient(160deg, #3B1E63, #1B0E33)'
    : 'linear-gradient(160deg, #6B1E28, #350E14)';
  return (
    <div style={{
      width: 200, minHeight: 300, padding: '20px 16px', borderRadius: 20, position: 'relative',
      background: bg, border: `3px solid ${border}`,
      boxShadow: `0 0 28px ${glow}, inset 0 0 0 1px rgba(255,255,255,.08)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* corner accents */}
      <span aria-hidden style={{ position: 'absolute', top: 6, left: 6, width: 14, height: 14, borderTop: `3px solid ${border}`, borderLeft: `3px solid ${border}`, borderTopLeftRadius: 8 }}/>
      <span aria-hidden style={{ position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderTop: `3px solid ${border}`, borderRight: `3px solid ${border}`, borderTopRightRadius: 8 }}/>
      <span aria-hidden style={{ position: 'absolute', bottom: 6, left: 6, width: 14, height: 14, borderBottom: `3px solid ${border}`, borderLeft: `3px solid ${border}`, borderBottomLeftRadius: 8 }}/>
      <span aria-hidden style={{ position: 'absolute', bottom: 6, right: 6, width: 14, height: 14, borderBottom: `3px solid ${border}`, borderRight: `3px solid ${border}`, borderBottomRightRadius: 8 }}/>

      {m.accent && <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 8, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(0,0,0,.4)', color: '#E8B94D', border: `1px solid ${border}` }}>POPULAR</span>}

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {purple ? <BrainGlyph /> : <LightningGlyph />}
      </div>

      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.04em', color: '#FFFFFF', marginBottom: 16 }}>
        {m.name.toUpperCase()}
      </div>

      <button
        onClick={onPlay}
        className="tap-target mode-card-play"
        style={{
          width: '100%', minHeight: 46, borderRadius: 12, cursor: 'pointer',
          fontWeight: 700, fontSize: 15, letterSpacing: '0.04em', color: '#3A2200',
          background: 'linear-gradient(180deg, #FFE49A, #E8B94D)',
          border: '2px solid #B9862B',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6), 0 4px 10px rgba(0,0,0,.35)',
        }}
      >
        PLAY
      </button>
    </div>
  );
}

function GearGlyph() {
  return (
    <svg width="40" height="40" viewBox="0 0 512 512" aria-hidden>
      <defs>
        <linearGradient id="gearMetal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF"/>
          <stop offset="38%" stopColor="#EEF3FF"/>
          <stop offset="72%" stopColor="#AFC0E7"/>
          <stop offset="100%" stopColor="#7185B5"/>
        </linearGradient>
        <linearGradient id="gearRim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#79D7FF"/>
          <stop offset="50%" stopColor="#2A86FF"/>
          <stop offset="100%" stopColor="#6B35FF"/>
        </linearGradient>
        <radialGradient id="gearHub" cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#2E468B"/>
          <stop offset="55%" stopColor="#11215C"/>
          <stop offset="100%" stopColor="#060B27"/>
        </radialGradient>
        <filter id="gearShadow" x="-40%" y="-40%" width="180%" height="190%">
          <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#020615" floodOpacity="0.65"/>
        </filter>
        <filter id="gearGlow" x="-45%" y="-45%" width="190%" height="190%">
          <feDropShadow dx="0" dy="0" stdDeviation="9" floodColor="#3D8DFF" floodOpacity="0.75"/>
          <feDropShadow dx="0" dy="0" stdDeviation="15" floodColor="#783DFF" floodOpacity="0.45"/>
        </filter>
      </defs>
      <g filter="url(#gearShadow)">
        <path fill="url(#gearRim)" filter="url(#gearGlow)"
          d="M223 28h66l12 58c15 5 29 11 42 19l50-32 47 47-32 50c8 13 14 27 19 42l58 12v66l-58 12c-5 15-11 29-19 42l32 50-47 47-50-32c-13 8-27 14-42 19l-12 58h-66l-12-58c-15-5-29-11-42-19l-50 32-47-47 32-50c-8-13-14-27-19-42l-58-12v-66l58-12c5-15 11-29 19-42l-32-50 47-47 50 32c13-8 27-14 42-19z"/>
        <path fill="url(#gearMetal)" stroke="#F8FBFF" strokeWidth="7"
          d="M228 48h56l10 53c18 5 35 12 51 21l45-29 39 39-29 45c9 16 16 33 21 51l53 10v56l-53 10c-5 18-12 35-21 51l29 45-39 39-45-29c-16 9-33 16-51 21l-10 53h-56l-10-53c-18-5-35-12-51-21l-45 29-39-39 29-45c-9-16-16-33-21-51l-53-10v-56l53-10c5-18 12-35 21-51l-29-45 39-39 45 29c16-9 33-16 51-21z"/>
        <circle cx="256" cy="266" r="101" fill="url(#gearHub)" stroke="#4FA7FF" strokeWidth="10"/>
        <circle cx="256" cy="266" r="55" fill="#07102E" stroke="#D9E7FF" strokeWidth="11"/>
        <path d="M147 176C177 111 242 82 310 101c24 7 45 19 63 35-56-10-112 2-160 35-24 16-45 37-62 61-10-17-12-37-4-56z" fill="#FFFFFF" opacity="0.24"/>
        <path d="M186 387c47 31 111 38 166 10-20 29-54 51-93 56-31 4-62-4-87-21z" fill="#263E8B" opacity="0.25"/>
      </g>
    </svg>
  );
}
function BookGlyph() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden style={{ filter: 'drop-shadow(0 0 8px rgba(180,120,255,.65))' }}>
      <path d="M20 10c-3-2-8-2-12-1v20c4-1 9-1 12 1V10z" fill="#F4E7C4" stroke="#B9862B" strokeWidth="1.2"/>
      <path d="M20 10c3-2 8-2 12-1v20c-4-1-9-1-12 1V10z" fill="#F4E7C4" stroke="#B9862B" strokeWidth="1.2"/>
      <rect x="17" y="9" width="6" height="22" fill="#2E56B8" opacity="0.85"/>
      <text x="20" y="21" textAnchor="middle" fontSize="11" fontWeight="700" fill="#7B4FE0" fontFamily="Georgia, serif">?</text>
    </svg>
  );
}
function FriendsGlyph() {
  return (
    <svg width="44" height="40" viewBox="0 0 44 40" aria-hidden style={{ filter: 'drop-shadow(0 0 8px rgba(120,170,255,.55))' }}>
      <circle cx="16" cy="14" r="8" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="1.2"/>
      <path d="M4 34c0-7 5-12 12-12s12 5 12 12" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="1.2"/>
      <circle cx="28" cy="12" r="7" fill="#E8B94D" stroke="#B9862B" strokeWidth="1.2"/>
      <path d="M18 34c0-6 4.5-11 10-11s10 5 10 11" fill="#E8B94D" stroke="#B9862B" strokeWidth="1.2"/>
    </svg>
  );
}
function ChatGlyph() {
  return (
    <svg width="40" height="36" viewBox="0 0 40 36" aria-hidden style={{ filter: 'drop-shadow(0 0 8px rgba(180,120,255,.6))' }}>
      <path d="M4 6a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H14l-7 7V26H8a4 4 0 0 1-4-4V6z" fill="#F4F1FF" stroke="#7B4FE0" strokeWidth="1.4"/>
      <circle cx="14" cy="14" r="2.2" fill="#2A2050"/>
      <circle cx="20" cy="14" r="2.2" fill="#2A2050"/>
      <circle cx="26" cy="14" r="2.2" fill="#2A2050"/>
    </svg>
  );
}
function NavGlyphButton({ glyph, label, onClick }) {
  return (
    <button onClick={onClick} className="tap-target lobby-nav-btn" style={{ background: 'none', border: 'none', cursor: onClick ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 6 }}>
      {glyph}
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#FFFFFF', textShadow: '0 2px 6px rgba(0,0,0,.7)' }}>{label}</span>
    </button>
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

            {/* Top row: profile card left, chat icon right */}
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
                  <div className="num" style={{ fontSize: 10, color: '#C4B8FF', letterSpacing: '0.06em', marginBottom: 4 }}>ID: SYN{playerIdCode}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 13 }}>⭐</span>
                    <span className="num" style={{ color: '#FFD21F', fontWeight: 700, fontSize: 13 }}>{(profile?.coins ?? 1000).toLocaleString()}</span>
                  </div>
                </div>
              </button>

              <NavGlyphButton glyph={<ChatGlyph />} label="" />
            </div>

            {/* Bottom-left row: Settings / Tutorial / Friends — glossy standalone icons, matching reference */}
            <div style={{ position: 'absolute', left: 20, bottom: 20, display: 'flex', gap: 22 }}>
              {toggleTheme && <NavGlyphButton glyph={<GearGlyph />} label="SETTINGS" onClick={toggleTheme} />}
              <NavGlyphButton glyph={<BookGlyph />} label="TUTORIAL" onClick={onShowTutorial} />
              <NavGlyphButton glyph={<FriendsGlyph />} label="FRIENDS" />
            </div>

            {/* Mode cards, anchored toward the bottom like the reference's temple steps */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 14, paddingBottom: 8 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                {Object.entries(MODES).map(([key, m]) => (
                  <ModeCard key={key} mode={key} m={m} onPlay={() => { setMode(key); setShowPopup(true); }} />
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
