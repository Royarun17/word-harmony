import React, { useState } from 'react';
import axios from 'axios';
import socket from '../utils/socket';

const T = {
  pageBg:'#F7F2EA', cardBg:'#FFFFFF', inputBg:'#FFFFFF',
  hudBg:'#FFFFFF', tabBg:'#F0EDE8', tabActive:'#FFFFFF',
  textPrimary:'#1A1A2E', textSecondary:'#9B8E7A', textMuted:'#C4B9A8',
  border:'#E8E0D0', gold:'#C8930C', goldBg:'#FEF3E2',
  teal:'#1A8C8C', tealBg:'#E8F4F4', red:'#E94560',
  navy:'#1A1A2E', white:'#FFFFFF',
};

function Pill({ label, active, onClick, color='teal' }) {
  const colors = {
    teal: { bg: T.tealBg, border: T.teal, text: T.teal },
    gold: { bg: T.goldBg, border: T.gold, text: T.gold },
    red:  { bg: '#FEE2E2', border: T.red, text: T.red },
  };
  const c = colors[color] || colors.teal;
  return (
    <button onClick={onClick} style={{
      padding:'6px 14px', borderRadius:99,
      border: `1.5px solid ${active ? c.border : T.border}`,
      background: active ? c.bg : T.white,
      color: active ? c.text : T.textSecondary,
      fontSize:12, fontWeight: active ? 700 : 400,
      cursor:'pointer', transition:'all 0.15s ease',
    }}>{label}</button>
  );
}

export default function LobbyPage({ onJoined, onShowTutorial }) {
  const [tab, setTab]         = useState('create');
  const [name, setName]       = useState('');
  const [code, setCode]       = useState('');
  const [mode, setMode]       = useState('education');
  const [difficulty, setDiff] = useState('medium');
  const [maxPlayers, setPlayers] = useState(4);
  const [rounds, setRounds]   = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  function validateName(n) {
    const t = n.trim();
    if (!t) return 'Enter your name.';
    if (t.length < 2) return 'Name must be at least 2 characters.';
    if (t.length > 20) return 'Name must be 20 characters or less.';
    if (!/[aeiouAEIOU]/.test(t)) return 'Please enter a real name.';
    if (!/^[a-zA-Z\s'\-]+$/.test(t)) return 'Letters only please.';
    return null;
  }

  async function handleCreate(e) {
    e.preventDefault();
    const err = validateName(name); if (err) { setError(err); return; }
    setLoading(true); setError('');
    try {
      const { data } = await axios.post('/session/create', { playerName: name.trim(), rounds, gameMode: mode, difficulty, maxPlayers });
      socket.connect();
      socket.emit('join_session', { sessionId: data.sessionId, playerId: data.playerId, playerName: name.trim() });
      onJoined({ sessionId: data.sessionId, playerId: data.playerId, playerName: name.trim(), isHost: true });
    } catch { setError('Could not create game. Try again.'); }
    setLoading(false);
  }

  async function handleJoin(e) {
    e.preventDefault();
    const err = validateName(name); if (err) { setError(err); return; }
    if (!code.trim()) { setError('Enter a session code.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await axios.post('/session/join', { sessionId: code.trim().toUpperCase(), playerName: name.trim() });
      socket.connect();
      socket.emit('join_session', { sessionId: data.sessionId, playerId: data.playerId, playerName: name.trim() });
      onJoined({ sessionId: data.sessionId, playerId: data.playerId, playerName: name.trim(), isHost: false });
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
      <style>{`
        @keyframes wh-pop{0%{transform:scale(0.96);opacity:0;}100%{transform:scale(1);opacity:1;}}
        .wh-pop{animation:wh-pop 0.25s cubic-bezier(.34,1.56,.64,1) forwards;}
        input:focus{outline:none!important;border-color:${T.gold}!important;}
        button:active{transform:scale(0.97);}
      `}</style>

      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:24, display:'flex', justifyContent:'center' }}>
        <svg width="240" height="52" viewBox="0 0 400 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="48" r="22" fill="#1A1A2E"/>
          <circle cx="90" cy="48" r="22" fill="#1A1A2E"/>
          <circle cx="60" cy="18" r="22" fill="#C8930C"/>
          <line x1="52" y1="48" x2="68" y2="48" stroke="#1A1A2E" strokeWidth="3" opacity="0.12" strokeLinecap="round"/>
          <line x1="45" y1="36" x2="53" y2="26" stroke="#1A1A2E" strokeWidth="3" opacity="0.12" strokeLinecap="round"/>
          <line x1="75" y1="36" x2="67" y2="26" stroke="#1A1A2E" strokeWidth="3" opacity="0.12" strokeLinecap="round"/>
          <text x="30" y="55" textAnchor="middle" fontFamily="Georgia,serif" fontSize="20" fontWeight="700" fill="#FFFFFF">S</text>
          <text x="90" y="55" textAnchor="middle" fontFamily="Georgia,serif" fontSize="20" fontWeight="700" fill="#FFFFFF">E</text>
          <path d="M57 8 L51 20 L60 20 L57 30" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="128" y="54" fontFamily="Georgia,serif" fontSize="42" fontWeight="800" fill="#1A1A2E" letterSpacing="-1">Syn</text>
          <text x="232" y="54" fontFamily="Georgia,serif" fontSize="42" fontWeight="800" fill="#C8930C" letterSpacing="-1">apse</text>
        </svg>
      </div>

      {/* Card */}
      <div className="wh-pop" style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:20, padding:24, width:'100%', maxWidth:420, boxShadow:'0 8px 32px rgba(26,26,46,0.1)' }}>

        {/* Tabs */}
        <div style={{ display:'flex', background:T.tabBg, borderRadius:12, padding:3, marginBottom:20 }}>
          {['create','join'].map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{
              flex:1, padding:'8px', borderRadius:10, border: tab===t ? `1px solid ${T.border}` : 'none',
              cursor:'pointer', fontSize:12, fontWeight:700,
              background: tab===t ? T.tabActive : 'transparent',
              color: tab===t ? T.textPrimary : T.textSecondary,
              transition:'all 0.2s ease', boxShadow: tab===t ? '0 1px 4px rgba(26,26,46,0.08)' : 'none',
            }}>{t==='create' ? 'Create game' : 'Join game'}</button>
          ))}
        </div>

        {/* Name */}
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', marginBottom:8, textTransform:'uppercase' }}>Your name</p>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name"
            style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1.5px solid ${T.border}`, background:T.inputBg, color:T.textPrimary, fontSize:14, fontFamily:'Georgia,serif', boxSizing:'border-box', transition:'border 0.2s ease' }}/>
        </div>

        {tab === 'join' ? (
          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', marginBottom:8, textTransform:'uppercase' }}>Session code</p>
            <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="e.g. XK7F2" maxLength={5}
              style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1.5px solid ${T.border}`, background:T.inputBg, color:T.gold, fontSize:22, fontFamily:'monospace', fontWeight:800, letterSpacing:'0.2em', textAlign:'center', boxSizing:'border-box' }}/>
          </div>
        ) : (
          <>
            <Section label="Game mode">
              <Pill label="📚 Education" active={mode==='education'} onClick={()=>setMode('education')} color="teal"/>
              <Pill label="🎉 Fun" active={mode==='fun'} onClick={()=>setMode('fun')} color="gold"/>
            </Section>
            <Section label="Difficulty">
              <Pill label="😊 Easy" active={difficulty==='easy'} onClick={()=>setDiff('easy')} color="teal"/>
              <Pill label="🧠 Medium" active={difficulty==='medium'} onClick={()=>setDiff('medium')} color="gold"/>
              <Pill label="🔥 Hard" active={difficulty==='hard'} onClick={()=>setDiff('hard')} color="red"/>
            </Section>
            <Section label="Players">
              {[3,4,5,6,7,8].map(n => <Pill key={n} label={`${n}`} active={maxPlayers===n} onClick={()=>setPlayers(n)} color="teal"/>)}
            </Section>
            <Section label="Rounds">
              {[3,5,7,10].map(n => <Pill key={n} label={`${n}`} active={rounds===n} onClick={()=>setRounds(n)} color="gold"/>)}
            </Section>
          </>
        )}

        {error && (
          <p style={{ color:T.red, fontSize:12, marginBottom:12, textAlign:'center', background:'#FEE2E2', padding:'8px 12px', borderRadius:8, border:`1px solid rgba(233,69,96,0.2)` }}>{error}</p>
        )}

        <button onClick={tab==='create'?handleCreate:handleJoin} disabled={loading} style={{
          width:'100%', padding:'14px', borderRadius:14, border:'none',
          cursor:loading?'not-allowed':'pointer',
          background: loading ? T.tabBg : `linear-gradient(135deg,${T.gold},#A07010)`,
          color: loading ? T.textSecondary : T.navy,
          fontSize:15, fontWeight:800, fontFamily:'Georgia,serif', letterSpacing:0.5,
          boxShadow: loading ? 'none' : '0 4px 16px rgba(200,147,12,0.3)',
          transition:'all 0.2s ease', marginTop:4,
        }}>
          {loading ? 'Loading…' : tab==='create' ? 'Create game' : 'Join game'}
        </button>

        <button onClick={onShowTutorial} style={{ width:'100%', marginTop:10, padding:'10px', borderRadius:12, border:`1px solid ${T.border}`, background:'transparent', color:T.textSecondary, fontSize:12, cursor:'pointer' }}>
          📖 How to play
        </button>
      </div>
    </div>
  );
}
