import React, { useState } from 'react';
import axios from 'axios';
import socket from '../utils/socket';
import { auth, signOut } from '../utils/firebase';
import { useTheme } from '../SynapseComponents';
import lobbyBg from '../assets/lobbyBgData.js';

const MODES = {
  syntax: { name: 'Syntax', accent: true,
    bullets: ['Submit any English word','Get 3 synonym cards generated','Collect 3 matching cards and buzz','Easy → common · Hard → rare vocab','Best for vocabulary and word lovers'],
    example: { word: 'happy', cards: ['Joyful','Elated','Content'] } },
  spark: { name: 'Spark', accent: false,
    bullets: ['Submit any topic word','Get 3 associated word cards','Collect 3 matching associations and buzz','Easy → obvious · Hard → cultural refs','Best for creative and lateral thinkers'],
    example: { word: 'football', cards: ['Lineman','Linebacker','League'] } },
};

// ── Real provided icon assets, converted 1:1 from the SVG pack (no redesign) ──
function SettingsGlyph() {
  return (
    <svg width="40" height="40" viewBox="0 0 512 512" aria-hidden>
      <defs>
        <linearGradient id="setM" x2="1" y2="1"><stop stopColor="#fff"/><stop offset=".45" stopColor="#e8efff"/><stop offset="1" stopColor="#8da2d2"/></linearGradient>
        <linearGradient id="setR" x2="1" y2="1"><stop stopColor="#76dbff"/><stop offset=".5" stopColor="#2688ff"/><stop offset="1" stopColor="#7438ff"/></linearGradient>
        <filter id="setS" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="14" stdDeviation="13" floodColor="#020615" floodOpacity=".65"/></filter>
      </defs>
      <g filter="url(#setS)">
        <path fill="url(#setR)" d="M223 28h66l12 58 42 19 50-32 47 47-32 50 19 42 58 12v66l-58 12-19 42 32 50-47 47-50-32-42 19-12 58h-66l-12-58-42-19-50 32-47-47 32-50-19-42-58-12v-66l58-12 19-42-32-50 47-47 50 32 42-19z"/>
        <path fill="url(#setM)" stroke="#fff" strokeWidth="7" d="M228 48h56l10 53 51 21 45-29 39 39-29 45 21 51 53 10v56l-53 10-21 51 29 45-39 39-45-29-51 21-10 53h-56l-10-53-51-21-45 29-39-39 29-45-21-51-53-10v-56l53-10 21-51-29-45 39-39 45 29 51-21z"/>
        <circle cx="256" cy="266" r="101" fill="#0a1747" stroke="#4fa7ff" strokeWidth="10"/>
        <circle cx="256" cy="266" r="55" fill="#07102e" stroke="#dce7ff" strokeWidth="11"/>
      </g>
    </svg>
  );
}
function TutorialGlyph() {
  return (
    <svg width="40" height="40" viewBox="0 0 512 512" aria-hidden>
      <defs>
        <linearGradient id="tutG" x2="1" y2="1"><stop stopColor="#fff7bd"/><stop offset=".45" stopColor="#ffd568"/><stop offset="1" stopColor="#d98500"/></linearGradient>
        <linearGradient id="tutP" x2="1" y2="1"><stop stopColor="#c16dff"/><stop offset="1" stopColor="#5b20d5"/></linearGradient>
        <filter id="tutS" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="14" stdDeviation="13" floodColor="#020615" floodOpacity=".65"/></filter>
      </defs>
      <g filter="url(#tutS)">
        <path d="M54 105c66-16 131-4 202 39 71-43 136-55 202-39v286c-68-18-135-5-202 39-67-44-134-57-202-39z" fill="url(#tutP)"/>
        <path d="M70 92c61-12 120 0 186 40v271c-61-37-123-48-186-34z" fill="url(#tutG)" stroke="#fff3b1" strokeWidth="7"/>
        <path d="M442 92c-61-12-120 0-186 40v271c61-37 123-48 186-34z" fill="url(#tutG)" stroke="#fff3b1" strokeWidth="7"/>
        <path d="M256 132v271" stroke="#b26a00" strokeWidth="10"/>
        <path d="M188 385v83l34-25 34 25v-83z" fill="#236cff" stroke="#8bd3ff" strokeWidth="6"/>
        <path d="M302 205c0-48 31-80 79-80 46 0 77 29 77 71 0 33-17 52-45 69-20 12-27 21-27 41v9h-47v-13c0-36 13-57 45-76 18-11 25-20 25-34 0-16-11-27-28-27-21 0-31 14-31 40zm35 147h52v52h-52z" fill="url(#tutP)" stroke="#4b1c9b" strokeWidth="5"/>
      </g>
    </svg>
  );
}
function FriendsGlyph() {
  return (
    <svg width="44" height="44" viewBox="0 0 512 512" aria-hidden>
      <defs>
        <linearGradient id="frB" x2="1" y2="1"><stop stopColor="#7fdbff"/><stop offset="1" stopColor="#2474e8"/></linearGradient>
        <linearGradient id="frY" x2="1" y2="1"><stop stopColor="#fff18b"/><stop offset="1" stopColor="#f2a400"/></linearGradient>
        <filter id="frS" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="14" stdDeviation="13" floodColor="#020615" floodOpacity=".65"/></filter>
      </defs>
      <g filter="url(#frS)">
        <path d="M86 407c0-83 50-143 128-143s128 60 128 143v31H86z" fill="url(#frB)" stroke="#d9f2ff" strokeWidth="8"/>
        <path d="M201 417c0-73 44-126 113-126s113 53 113 126v21H201z" fill="url(#frY)" stroke="#fff1b1" strokeWidth="8"/>
        <circle cx="214" cy="175" r="91" fill="url(#frB)" stroke="#d9f2ff" strokeWidth="9"/>
        <circle cx="332" cy="197" r="76" fill="url(#frY)" stroke="#fff1b1" strokeWidth="9"/>
      </g>
    </svg>
  );
}
function ChatGlyph() {
  return (
    <svg width="44" height="44" viewBox="0 0 512 512" aria-hidden>
      <defs>
        <linearGradient id="chM" x2="1" y2="1"><stop stopColor="#fff"/><stop offset=".5" stopColor="#eef2ff"/><stop offset="1" stopColor="#a2add5"/></linearGradient>
        <linearGradient id="chR" x2="1" y2="1"><stop stopColor="#79dfff"/><stop offset=".5" stopColor="#2a86ff"/><stop offset="1" stopColor="#7438ff"/></linearGradient>
        <filter id="chS" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="14" stdDeviation="13" floodColor="#020615" floodOpacity=".65"/></filter>
      </defs>
      <g filter="url(#chS)">
        <path fill="url(#chR)" d="M88 82h300c46 0 84 38 84 84v142c0 46-38 84-84 84H252l-92 72 18-72H88c-46 0-84-38-84-84V166c0-46 38-84 84-84z"/>
        <path fill="url(#chM)" stroke="#fff" strokeWidth="7" d="M96 98h286c39 0 70 31 70 70v134c0 39-31 70-70 70H243l-61 47 12-47H96c-39 0-70-31-70-70V168c0-39 31-70 70-70z"/>
        <circle cx="164" cy="245" r="27" fill="#35218a"/><circle cx="256" cy="245" r="27" fill="#35218a"/><circle cx="348" cy="245" r="27" fill="#35218a"/>
      </g>
    </svg>
  );
}

// ── Profile card: real frame art (avatar/level/ID/coin placeholders stripped
// out of the source SVG) with live player data overlaid at matching positions ──
function ProfileCardArt({ playerName, level, coins, onClick }) {
  const hue = React.useMemo(() => {
    let h = 0;
    for (let i = 0; i < playerName.length; i++) h = (h * 31 + playerName.charCodeAt(i)) | 0;
    return Math.abs(h) % 360;
  }, [playerName]);
  const initials = playerName.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <button onClick={onClick} className="tap-target" style={{ position: 'relative', width: 320, height: 106.7, border: 'none', background: 'none', padding: 0, cursor: onClick ? 'pointer' : 'default', flexShrink: 0 }}>
      <svg width="320" height="106.7" viewBox="0 0 900 300" style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <defs>
          <linearGradient id="pcP" x2="1" y2="1"><stop stopColor="#1b2c70"/><stop offset="1" stopColor="#07112f"/></linearGradient>
          <linearGradient id="pcR" x2="1" y2="1"><stop stopColor="#7de3ff"/><stop offset=".45" stopColor="#5a49ff"/><stop offset="1" stopColor="#b643ff"/></linearGradient>
          <linearGradient id="pcG" x2="1" y2="1"><stop stopColor="#fff6a8"/><stop offset=".38" stopColor="#ffd447"/><stop offset="1" stopColor="#e28a00"/></linearGradient>
          <linearGradient id="pcV" x2="1" y2="1"><stop stopColor="#b763ff"/><stop offset="1" stopColor="#5c20d6"/></linearGradient>
          <filter id="pcS" x="-30%" y="-40%" width="170%" height="190%"><feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#020615" floodOpacity=".65"/></filter>
        </defs>
        <g filter="url(#pcS)">
          <path d="M130 42H824c25 0 44 19 44 44v128c0 25-19 44-44 44H130z" fill="url(#pcR)"/>
          <path d="M142 54H815c22 0 39 17 39 39v114c0 22-17 39-39 39H142z" fill="url(#pcP)" stroke="#cfd7ff" strokeWidth="4"/>
          <circle cx="135" cy="150" r="108" fill="#101a49" stroke="url(#pcG)" strokeWidth="14"/>
          <circle cx="135" cy="150" r="91" fill="#182a68" stroke="#6b36ff" strokeWidth="8"/>
          <path d="M48 190l42-28 42 28v50l-42 28-42-28z" fill="url(#pcV)" stroke="#f0ceff" strokeWidth="6"/>
          <line x1="280" y1="150" x2="780" y2="150" stroke="#fff" opacity=".14" strokeWidth="3"/>
          <circle cx="321" cy="198" r="34" fill="url(#pcG)" stroke="#fff2a0" strokeWidth="5"/>
          <path d="M321 175l7 14 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="#fff7c5" stroke="#b06c00" strokeWidth="3"/>
        </g>
      </svg>

      {/* Real avatar photo/initials, sized to sit inside the ring */}
      <div style={{
        position: 'absolute', left: 50, top: 55, width: 60, height: 60, borderRadius: '50%', transform: 'translate(-50%,-50%)',
        background: `linear-gradient(140deg, hsl(${hue} 70% 58%), hsl(${(hue + 40) % 360} 70% 42%))`,
        display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-display)',
      }}>{initials}</div>

      {/* Real level number, over the hexagon badge */}
      <div style={{ position: 'absolute', left: 33, top: 79, transform: 'translate(-50%,-50%)', color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'Arial' }}>{level}</div>

      {/* Real username, where the ID text used to be */}
      <div style={{ position: 'absolute', left: 103, top: 46, transform: 'translateY(-100%)', color: '#e6ebff', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>{playerName}</div>

      {/* Real coin count */}
      <div className="num" style={{ position: 'absolute', left: 139, top: 79, transform: 'translateY(-100%)', color: '#ffd83d', fontWeight: 700, fontSize: 18, fontFamily: 'Arial' }}>{coins.toLocaleString()}</div>
    </button>
  );
}

// ── Mode cards: real card art (Syntax/Spark) used exactly as designed, with
// a transparent clickable layer over the whole card ──
function ModeCard({ mode, onPlay }) {
  const isSyntax = mode === 'syntax';
  return (
    <button onClick={onPlay} className="tap-target mode-card-play" style={{ width: 178, height: 240, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
      {isSyntax ? (
        <svg width="178" height="240" viewBox="0 0 520 700" aria-hidden>
          <defs>
            <linearGradient id="synPanel" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#123E8C"/><stop offset="55%" stopColor="#071A4A"/><stop offset="100%" stopColor="#040C28"/></linearGradient>
            <linearGradient id="synRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#73E6FF"/><stop offset="45%" stopColor="#1EA7FF"/><stop offset="100%" stopColor="#4D43FF"/></linearGradient>
            <linearGradient id="synButton" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#31C9FF"/><stop offset="45%" stopColor="#1276FF"/><stop offset="100%" stopColor="#083DA8"/></linearGradient>
            <linearGradient id="synBrain" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#E6A6FF"/><stop offset="50%" stopColor="#8B5CFF"/><stop offset="100%" stopColor="#32C8FF"/></linearGradient>
            <filter id="synShadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#020615" floodOpacity=".7"/></filter>
            <filter id="synGlow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#22B8FF" floodOpacity=".8"/></filter>
          </defs>
          <g filter="url(#synShadow)">
            <rect x="24" y="24" width="472" height="652" rx="42" fill="url(#synRim)" filter="url(#synGlow)"/>
            <rect x="38" y="38" width="444" height="624" rx="34" fill="url(#synPanel)" stroke="#D9F5FF" strokeWidth="4"/>
            <path d="M62 70c118-24 262-18 392 14-116 2-236 24-338 66-25 10-44 20-60 31z" fill="#FFFFFF" opacity=".08"/>
            <circle cx="260" cy="186" r="86" fill="#0A1B50" stroke="#36C8FF" strokeWidth="8"/>
            <g fill="none" stroke="url(#synBrain)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round">
              <path d="M260 126c-28-28-77-13-74 25-28 1-39 38-18 55-18 30 8 66 39 59 8 31 49 38 64 11"/>
              <path d="M260 126c28-28 77-13 74 25 28 1 39 38 18 55 18 30-8 66-39 59-8 31-49 38-64 11"/>
              <path d="M260 126v150"/>
              <path d="M212 158c22 8 28 24 27 45M308 158c-22 8-28 24-27 45M205 232c22-2 36 9 43 26M315 232c-22-2-36 9-43 26"/>
            </g>
            <text x="260" y="385" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="58" fontWeight="700" fill="#FFFFFF">SYNTAX</text>
            <rect x="76" y="500" width="368" height="110" rx="34" fill="url(#synButton)" stroke="#8EEBFF" strokeWidth="5"/>
            <path d="M100 517h320" stroke="#FFFFFF" strokeOpacity=".35" strokeWidth="10" strokeLinecap="round"/>
            <text x="260" y="573" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="54" fontWeight="700" fill="#FFFFFF">PLAY</text>
          </g>
        </svg>
      ) : (
        <svg width="178" height="240" viewBox="0 0 520 700" aria-hidden>
          <defs>
            <linearGradient id="spkPanel" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#5D1F12"/><stop offset="55%" stopColor="#2D0D09"/><stop offset="100%" stopColor="#120604"/></linearGradient>
            <linearGradient id="spkRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFF06D"/><stop offset="45%" stopColor="#FF9A16"/><stop offset="100%" stopColor="#FF4B16"/></linearGradient>
            <linearGradient id="spkButton" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFD544"/><stop offset="45%" stopColor="#FF9D00"/><stop offset="100%" stopColor="#C75200"/></linearGradient>
            <linearGradient id="spkBolt" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFFBD0"/><stop offset="45%" stopColor="#FFD940"/><stop offset="100%" stopColor="#FF7A00"/></linearGradient>
            <filter id="spkShadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#020615" floodOpacity=".7"/></filter>
            <filter id="spkGlow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#FF9E19" floodOpacity=".85"/></filter>
          </defs>
          <g filter="url(#spkShadow)">
            <rect x="24" y="24" width="472" height="652" rx="42" fill="url(#spkRim)" filter="url(#spkGlow)"/>
            <rect x="38" y="38" width="444" height="624" rx="34" fill="url(#spkPanel)" stroke="#FFF0A8" strokeWidth="4"/>
            <path d="M62 70c118-24 262-18 392 14-116 2-236 24-338 66-25 10-44 20-60 31z" fill="#FFFFFF" opacity=".07"/>
            <circle cx="260" cy="186" r="86" fill="#351006" stroke="#FF9D18" strokeWidth="8"/>
            <path d="M292 92l-95 126h58l-32 101 102-139h-61z" fill="url(#spkBolt)" stroke="#FFF2A4" strokeWidth="7" strokeLinejoin="round"/>
            <text x="260" y="385" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="58" fontWeight="700" fill="#FFFFFF">SPARK</text>
            <rect x="76" y="500" width="368" height="110" rx="34" fill="url(#spkButton)" stroke="#FFF2A4" strokeWidth="5"/>
            <path d="M100 517h320" stroke="#FFFFFF" strokeOpacity=".3" strokeWidth="10" strokeLinecap="round"/>
            <text x="260" y="573" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="54" fontWeight="700" fill="#FFFFFF">PLAY</text>
          </g>
        </svg>
      )}
    </button>
  );
}

function NavGlyphButton({ glyph, label, onClick }) {
  return (
    <button onClick={onClick} className="tap-target lobby-nav-btn" style={{ background: 'none', border: 'none', cursor: onClick ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 6 }}>
      {glyph}
      {label && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#FFFFFF', textShadow: '0 2px 6px rgba(0,0,0,.7)' }}>{label}</span>}
    </button>
  );
}

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
        <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 18 }}>{m.name}</h2>
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
          <style>{`.lobby-nav-btn:hover { filter: brightness(1.2); } .mode-card-play:hover { filter: brightness(1.1); } .mode-card-play:active { transform: scale(0.97); }`}</style>
          <div className="scene-content" style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: 20, justifyContent: 'space-between' }}>

            {/* Top row: profile card (top-left), chat icon (top-right) */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <ProfileCardArt playerName={playerName} level={profile?.level || 1} coins={profile?.coins ?? 1000} onClick={() => onShowProfile && onShowProfile()} />
              <NavGlyphButton glyph={<ChatGlyph />} label="" />
            </div>

            {/* Center: mode cards, equal spacing, arena visible around them */}
            <div style={{ display: 'flex', gap: 28, justifyContent: 'center', alignItems: 'center' }}>
              <ModeCard mode="syntax" onPlay={() => { setMode('syntax'); setShowPopup(true); }} />
              <ModeCard mode="spark" onPlay={() => { setMode('spark'); setShowPopup(true); }} />
            </div>

            {/* Bottom row: Settings / Tutorial / Friends, equally spaced */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 56 }}>
              {toggleTheme && <NavGlyphButton glyph={<SettingsGlyph />} label="SETTINGS" onClick={toggleTheme} />}
              <NavGlyphButton glyph={<TutorialGlyph />} label="TUTORIAL" onClick={onShowTutorial} />
              <NavGlyphButton glyph={<FriendsGlyph />} label="FRIENDS" />
            </div>

            <div style={{ textAlign: 'center' }}>
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
          <div className="scene-content" style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button onClick={() => setStep('mode')} className="btn-ghost tap-target" style={{ minHeight: 44, padding: '0 14px', fontSize: 13 }}>← Back</button>
              <div style={{ flex: 1 }}/>
              <span className="chip chip-accent">{MODES[selectedMode].name}</span>
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
