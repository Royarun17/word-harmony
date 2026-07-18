import React, { useState } from 'react';
import axios from 'axios';
import socket from '../utils/socket';
import { auth, signOut } from '../utils/firebase';

const T = {
  pageBg:'#F7F2EA', cardBg:'#FFFFFF', border:'#E8E0D0',
  textPrimary:'#1A1A2E', textSecondary:'#9B8E7A', textMuted:'#C4B9A8',
  gold:'#C8930C', goldBg:'#FEF3E2', teal:'#1A8C8C', tealBg:'#E8F4F4',
  red:'#E94560', navy:'#1A1A2E', white:'#FFFFFF', tabBg:'#F0EDE8',
};

const MODE_INFO = {
  syntax: {
    name: 'Syntax',
    icon: '📚',
    color: T.teal,
    colorBg: T.tealBg,
    colorBorder: 'rgba(26,140,140,0.3)',
    subtitle: 'Education Mode',
    tagline: 'Match synonyms — words that mean the same thing',
    bullets: [
      'Submit any English word',
      'Get 3 synonym cards generated from your word',
      'Collect 3 matching synonyms and buzz to score',
      'Easy → common words · Hard → rare vocabulary',
      'Best for vocabulary lovers and word game fans',
    ],
    example: { word: 'happy', cards: ['Joyful', 'Elated', 'Content'] },
  },
  spark: {
    name: 'Spark',
    icon: '⚡',
    color: T.gold,
    colorBg: T.goldBg,
    colorBorder: 'rgba(200,147,12,0.3)',
    subtitle: 'Fun Mode',
    tagline: 'Match topic associations — words connected by theme',
    bullets: [
      'Submit any topic word',
      'Get 3 associated words connected to your topic',
      'Collect 3 matching associations and buzz to score',
      'Easy → obvious links · Hard → cultural references',
      'Best for casual play and creative thinkers',
    ],
    example: { word: 'football', cards: ['Lineman', 'Linebacker', 'League'] },
  },
};

function Pill({ label, active, onClick, color='teal' }) {
  const colors = {
    teal: { bg:T.tealBg, border:T.teal, text:T.teal },
    gold: { bg:T.goldBg, border:T.gold, text:T.gold },
    red:  { bg:'#FEE2E2', border:T.red, text:T.red },
  };
  const c = colors[color] || colors.teal;
  return (
    <button onClick={onClick} style={{
      padding:'6px 14px', borderRadius:99,
      border:`1.5px solid ${active ? c.border : T.border}`,
      background: active ? c.bg : T.white,
      color: active ? c.text : T.textSecondary,
      fontSize:12, fontWeight: active ? 700 : 400,
      cursor:'pointer', transition:'all 0.15s ease',
    }}>{label}</button>
  );
}

// ── Step 1: Mode Selection ─────────────────────────────────────────────────
function ModeSelectStep({ profile, onModeSelect, onShowProfile, onSignOut }) {
  return (
    <div style={{ minHeight:'100vh', background:T.pageBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20 }}>
      <style>{`@keyframes wh-pop{0%{transform:scale(0.95);opacity:0;}100%{transform:scale(1);opacity:1;}}.wh-pop{animation:wh-pop 0.25s cubic-bezier(.34,1.56,.64,1) forwards;} @keyframes wh-float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}.wh-float{animation:wh-float 3s ease-in-out infinite;}`}</style>

      {/* Logo */}
      <div className="wh-float" style={{ marginBottom:24, textAlign:'center' }}>
        <svg width="200" height="44" viewBox="0 0 400 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="48" r="22" fill="#1A1A2E"/>
          <circle cx="90" cy="48" r="22" fill="#1A1A2E"/>
          <circle cx="60" cy="18" r="22" fill="#C8930C"/>
          <line x1="52" y1="48" x2="68" y2="48" stroke="#1A1A2E" strokeWidth="3" opacity="0.12"/>
          <line x1="45" y1="36" x2="53" y2="26" stroke="#1A1A2E" strokeWidth="3" opacity="0.12"/>
          <line x1="75" y1="36" x2="67" y2="26" stroke="#1A1A2E" strokeWidth="3" opacity="0.12"/>
          <text x="30" y="55" textAnchor="middle" fontFamily="Georgia,serif" fontSize="20" fontWeight="700" fill="#fff">S</text>
          <text x="90" y="55" textAnchor="middle" fontFamily="Georgia,serif" fontSize="20" fontWeight="700" fill="#fff">E</text>
          <path d="M57 8 L51 20 L60 20 L57 30" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="128" y="54" fontFamily="Georgia,serif" fontSize="42" fontWeight="800" fill="#1A1A2E">Syn</text>
          <text x="232" y="54" fontFamily="Georgia,serif" fontSize="42" fontWeight="800" fill="#C8930C">apse</text>
        </svg>
      </div>

      {/* Player greeting */}
      <div className="wh-pop" style={{ marginBottom:20, textAlign:'center' }}>
        <p style={{ fontSize:14, color:T.textSecondary, margin:0 }}>
          Welcome back, <span style={{ color:T.navy, fontWeight:700, fontFamily:'Georgia,serif' }}>{profile?.username || 'Player'}</span> {profile?.avatar || '😎'}
        </p>
      </div>

      {/* Mode cards */}
      <div className="wh-pop" style={{ width:'100%', maxWidth:420 }}>
        <p style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:'0.12em', textTransform:'uppercase', textAlign:'center', marginBottom:14 }}>Choose your mode</p>

        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>

          {/* Syntax card */}
          <button onClick={() => onModeSelect('syntax')} style={{
            background:T.white, border:`2px solid ${T.border}`, borderRadius:16,
            padding:'18px 20px', cursor:'pointer', textAlign:'left',
            boxShadow:'0 2px 8px rgba(26,26,46,0.06)', transition:'all 0.2s ease',
            display:'flex', alignItems:'center', gap:16,
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.teal;e.currentTarget.style.boxShadow='0 4px 16px rgba(26,140,140,0.15)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow='0 2px 8px rgba(26,26,46,0.06)';}}>
            <div style={{ width:52, height:52, borderRadius:14, background:T.tealBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>📚</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                <span style={{ fontSize:16, fontWeight:800, color:T.navy, fontFamily:'Georgia,serif' }}>Syntax</span>
              </div>
            </div>
            <span style={{ fontSize:18, color:T.textMuted }}>›</span>
          </button>

          {/* Spark card */}
          <button onClick={() => onModeSelect('spark')} style={{
            background:T.white, border:`2px solid ${T.border}`, borderRadius:16,
            padding:'18px 20px', cursor:'pointer', textAlign:'left',
            boxShadow:'0 2px 8px rgba(26,26,46,0.06)', transition:'all 0.2s ease',
            display:'flex', alignItems:'center', gap:16,
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.gold;e.currentTarget.style.boxShadow='0 4px 16px rgba(200,147,12,0.15)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow='0 2px 8px rgba(26,26,46,0.06)';}}>
            <div style={{ width:52, height:52, borderRadius:14, background:T.goldBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>⚡</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                <span style={{ fontSize:16, fontWeight:800, color:T.navy, fontFamily:'Georgia,serif' }}>Spark</span>
              </div>
            </div>
            <span style={{ fontSize:18, color:T.textMuted }}>›</span>
          </button>
        </div>

        {/* Profile button only */}
        <div style={{ display:'flex' }}>
          <button onClick={onShowProfile} style={{ flex:1, padding:'10px', borderRadius:10, border:`1px solid ${T.border}`, background:T.white, color:T.textPrimary, fontSize:12, fontWeight:600, cursor:'pointer' }}>
            👤 My Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Mode Info Popup ────────────────────────────────────────────────
function ModeInfoPopup({ mode, onContinue, onBack }) {
  const info = MODE_INFO[mode];
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(26,26,46,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20, backdropFilter:'blur(4px)' }}>
      <style>{`@keyframes wh-pop{0%{transform:scale(0.9);opacity:0;}100%{transform:scale(1);opacity:1;}}.wh-pop{animation:wh-pop 0.25s cubic-bezier(.34,1.56,.64,1) forwards;}`}</style>
      <div className="wh-pop" style={{ background:T.cardBg, borderRadius:20, padding:24, width:'100%', maxWidth:420, boxShadow:'0 24px 48px rgba(26,26,46,0.2)', border:`1px solid ${T.border}` }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <div style={{ width:56, height:56, borderRadius:14, background:info.colorBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>{info.icon}</div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <h2 style={{ fontSize:20, fontWeight:800, color:T.navy, fontFamily:'Georgia,serif', margin:0 }}>{info.name}</h2>
            </div>

          </div>
        </div>

        {/* Bullets */}
        <div style={{ background:T.tabBg, borderRadius:12, padding:'12px 14px', marginBottom:14 }}>
          {info.bullets.map((b, i) => (
            <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom: i < info.bullets.length-1 ? 8 : 0 }}>
              <span style={{ color:info.color, fontWeight:700, fontSize:14, lineHeight:1.4, flexShrink:0 }}>•</span>
              <span style={{ fontSize:12, color:T.textPrimary, lineHeight:1.5 }}>{b}</span>
            </div>
          ))}
        </div>

        {/* Example */}
        <div style={{ background:info.colorBg, borderRadius:12, padding:'12px 14px', marginBottom:16, border:`1px solid ${info.colorBorder}` }}>
          <p style={{ fontSize:10, fontWeight:700, color:info.color, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Example</p>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:T.textSecondary }}>Submit</span>
            <span style={{ padding:'4px 12px', borderRadius:99, background:info.color, color:'#fff', fontSize:12, fontWeight:700 }}>{info.example.word}</span>
            <span style={{ fontSize:12, color:T.textSecondary }}>→ cards:</span>
            {info.example.cards.map(c => (
              <span key={c} style={{ padding:'4px 10px', borderRadius:8, background:T.white, border:`1px solid ${T.border}`, fontSize:11, fontWeight:600, color:T.navy, fontFamily:'Georgia,serif' }}>{c}</span>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onBack} style={{ flex:1, padding:'12px', borderRadius:12, border:`1px solid ${T.border}`, background:'transparent', color:T.textSecondary, fontSize:13, fontWeight:600, cursor:'pointer' }}>← Back</button>
          <button onClick={onContinue} style={{ flex:2, padding:'12px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${info.color},${mode==='syntax'?'#115E59':'#A07010'})`, color:mode==='syntax'?T.white:T.navy, fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'Georgia,serif', boxShadow:`0 4px 14px ${info.colorBorder}` }}>
            Play {info.name} →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Create / Join ──────────────────────────────────────────────────
function CreateJoinStep({ profile, mode, onJoined, onShowTutorial, onBack }) {
  const info = MODE_INFO[mode];
  const [tab, setTab]           = useState('create');
  const [code, setCode]         = useState('');
  const [difficulty, setDiff]   = useState('medium');
  const [maxPlayers, setPlayers]= useState(4);
  const [rounds, setRounds]     = useState(5);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const gameMode = mode === 'syntax' ? 'education' : 'fun';
  const playerName = profile?.username || 'Player';

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

  const Section = ({ label, children }) => (
    <div style={{ marginBottom:14 }}>
      <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', marginBottom:8, textTransform:'uppercase' }}>{label}</p>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{children}</div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:T.pageBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20 }}>
      <style>{`@keyframes wh-pop{0%{transform:scale(0.95);opacity:0;}100%{transform:scale(1);opacity:1;}}.wh-pop{animation:wh-pop 0.25s cubic-bezier(.34,1.56,.64,1) forwards;} input:focus{outline:none!important;border-color:${T.gold}!important;}`}</style>

      <div className="wh-pop" style={{ width:'100%', maxWidth:420 }}>

        {/* Back + mode badge */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <button onClick={onBack} style={{ background:'none', border:'none', color:T.textSecondary, fontSize:13, cursor:'pointer', padding:0 }}>← Back</button>
          <div style={{ flex:1 }}/>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:99, background:info.colorBg, border:`1px solid ${info.colorBorder}` }}>
            <span>{info.icon}</span>
            <span style={{ fontSize:11, fontWeight:700, color:info.color }}>{info.name}</span>
          </div>
        </div>



        {/* Card */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:20, padding:24, boxShadow:'0 8px 32px rgba(26,26,46,0.1)' }}>

          {/* Tabs */}
          <div style={{ display:'flex', background:T.tabBg, borderRadius:12, padding:3, marginBottom:20 }}>
            {['create','join'].map(t => (
              <button key={t} onClick={()=>setTab(t)} style={{
                flex:1, padding:'8px', borderRadius:10,
                border: tab===t ? `1px solid ${T.border}` : 'none',
                cursor:'pointer', fontSize:12, fontWeight:700,
                background: tab===t ? T.cardBg : 'transparent',
                color: tab===t ? T.textPrimary : T.textSecondary,
                transition:'all 0.2s ease',
                boxShadow: tab===t ? '0 1px 4px rgba(26,26,46,0.08)' : 'none',
              }}>{t==='create' ? 'Create game' : 'Join game'}</button>
            ))}
          </div>

          {tab === 'join' ? (
            <form onSubmit={handleJoin}>
              <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', marginBottom:8, textTransform:'uppercase' }}>Session code</p>
              <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="e.g. XK7F2" maxLength={5}
                style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1.5px solid ${T.border}`, background:T.white, color:T.gold, fontSize:22, fontFamily:'monospace', fontWeight:800, letterSpacing:'0.2em', textAlign:'center', boxSizing:'border-box', marginBottom:14 }}/>
              {error && <p style={{ color:T.red, fontSize:12, marginBottom:10, padding:'8px 12px', background:'#FEE2E2', borderRadius:8, textAlign:'center' }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${T.gold},#A07010)`, color:T.navy, fontSize:14, fontWeight:800, fontFamily:'Georgia,serif', cursor:'pointer', boxShadow:'0 4px 16px rgba(200,147,12,0.3)' }}>
                {loading ? 'Joining…' : 'Join game →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreate}>
              <Section label="Difficulty">
                <Pill label="😊 Easy"   active={difficulty==='easy'}   onClick={()=>setDiff('easy')}   color="teal"/>
                <Pill label="🧠 Medium" active={difficulty==='medium'} onClick={()=>setDiff('medium')} color="gold"/>
                <Pill label="🔥 Hard"   active={difficulty==='hard'}   onClick={()=>setDiff('hard')}   color="red"/>
              </Section>
              <Section label="Players">
                {[3,4,5,6,7,8].map(n => <Pill key={n} label={`${n}`} active={maxPlayers===n} onClick={()=>setPlayers(n)} color="teal"/>)}
              </Section>
              <Section label="Rounds">
                {[3,5,7,10].map(n => <Pill key={n} label={`${n}`} active={rounds===n} onClick={()=>setRounds(n)} color="gold"/>)}
              </Section>
              {error && <p style={{ color:T.red, fontSize:12, marginBottom:10, padding:'8px 12px', background:'#FEE2E2', borderRadius:8, textAlign:'center' }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${T.gold},#A07010)`, color:T.navy, fontSize:14, fontWeight:800, fontFamily:'Georgia,serif', cursor:'pointer', boxShadow:'0 4px 16px rgba(200,147,12,0.3)', marginTop:4 }}>
                {loading ? 'Creating…' : 'Create game →'}
              </button>
            </form>
          )}

          <button onClick={onShowTutorial} style={{ width:'100%', marginTop:10, padding:'10px', borderRadius:12, border:`1px solid ${T.border}`, background:'transparent', color:T.textSecondary, fontSize:12, cursor:'pointer' }}>
            📖 How to play
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main LobbyPage ─────────────────────────────────────────────────────────
export default function LobbyPage({ onJoined, onShowTutorial, prefillName='', onShowProfile, onSignOut, profile }) {
  const [step, setStep]           = useState('modeSelect'); // modeSelect | modeInfo | createJoin
  const [selectedMode, setMode]   = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  async function handleSignOut() {
    try { await signOut(auth); if (onSignOut) onSignOut(); }
    catch (e) { console.error('Sign out error', e); }
  }

  function handleModeSelect(mode) {
    setMode(mode);
    setShowPopup(true);
  }

  function handleContinue() {
    setShowPopup(false);
    setStep('createJoin');
  }

  return (
    <>
      {step === 'modeSelect' && (
        <ModeSelectStep
          profile={profile}
          onModeSelect={handleModeSelect}
          onShowProfile={onShowProfile}
          onSignOut={handleSignOut}
        />
      )}
      {step === 'createJoin' && selectedMode && (
        <CreateJoinStep
          profile={profile}
          mode={selectedMode}
          onJoined={onJoined}
          onShowTutorial={onShowTutorial}
          onBack={() => setStep('modeSelect')}
        />
      )}
      {showPopup && selectedMode && (
        <ModeInfoPopup
          mode={selectedMode}
          onContinue={handleContinue}
          onBack={() => setShowPopup(false)}
        />
      )}
    </>
  );
}
