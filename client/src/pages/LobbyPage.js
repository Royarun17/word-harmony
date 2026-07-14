import React, { useState } from 'react';
import axios from 'axios';
import socket from '../utils/socket';

const T = {
  navy: '#1A1A2E', dark: '#0D1B2A', gold: '#C8930C', goldL: '#FFD166',
  teal: '#1A8C8C', tealL: '#99F6E4', red: '#E94560', white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.45)', border: 'rgba(255,255,255,0.1)',
  surface: 'rgba(255,255,255,0.06)', surfaceHover: 'rgba(255,255,255,0.1)',
};

const pill = (label, active, onClick, color='teal') => {
  const colors = {
    teal: { bg:'rgba(26,140,140,0.3)', border:'rgba(26,140,140,0.6)', text:T.tealL },
    gold: { bg:'rgba(200,147,12,0.3)', border:'rgba(200,147,12,0.6)', text:T.goldL },
    red:  { bg:'rgba(233,69,96,0.3)',  border:'rgba(233,69,96,0.6)',  text:'#FCA5A5' },
  };
  const c = colors[color] || colors.teal;
  return (
    <button onClick={onClick} style={{
      padding:'6px 14px', borderRadius:99, border:`1.5px solid ${active ? c.border : T.border}`,
      background: active ? c.bg : T.surface, color: active ? c.text : T.muted,
      fontSize:12, fontWeight: active ? 700 : 400, cursor:'pointer',
      transition:'all 0.15s ease', outline:'none',
    }}>{label}</button>
  );
};

export default function LobbyPage({ onJoined, onShowTutorial }) {
  const [tab, setTab]             = useState('create');
  const [name, setName]           = useState('');
  const [code, setCode]           = useState('');
  const [mode, setMode]           = useState('education');
  const [difficulty, setDiff]     = useState('medium');
  const [maxPlayers, setPlayers]  = useState(4);
  const [rounds, setRounds]       = useState(5);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  function validateName(n) {
    const t = n.trim();
    if (!t) return 'Enter your name.';
    if (t.length < 2) return 'Name must be at least 2 characters.';
    if (t.length > 20) return 'Name must be 20 characters or less.';
    if (!/[aeiouAEIOU]/.test(t)) return 'Please enter a real name.';
    if (!/^[a-zA-Z\s'\-]+$/.test(t)) return 'Letters only please.';
    if (/[^aeiou\s]{5,}/i.test(t)) return 'Please enter a real name.';
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
      <p style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'0.1em', marginBottom:8, textTransform:'uppercase' }}>{label}</p>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{children}</div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg,${T.navy} 0%,${T.dark} 100%)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20 }}>
      <style>{`
        @keyframes wh-pop{0%{transform:scale(0.95);opacity:0;}100%{transform:scale(1);opacity:1;}}
        .wh-pop{animation:wh-pop 0.25s cubic-bezier(.34,1.56,.64,1) forwards;}
        input:focus{outline:none!important;}
        button:active{transform:scale(0.97);}
      `}</style>

      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <h1 style={{ fontSize:36, fontWeight:700, color:T.white, fontFamily:'Georgia,serif', letterSpacing:-0.5, margin:0 }}>
          Word <span style={{ color:T.gold }}>Harmony</span>
        </h1>
        <p style={{ fontSize:12, color:T.muted, marginTop:4, letterSpacing:'0.12em' }}>MATCH · PASS · BUZZ · WIN</p>
      </div>

      {/* Card */}
      <div className="wh-pop" style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:24, width:'100%', maxWidth:420, boxShadow:'0 24px 48px rgba(0,0,0,0.5)' }}>

        {/* Tabs */}
        <div style={{ display:'flex', background:'rgba(0,0,0,0.3)', borderRadius:12, padding:3, marginBottom:20 }}>
          {['create','join'].map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{
              flex:1, padding:'8px', borderRadius:10, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
              background: tab===t ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: tab===t ? T.white : T.muted, transition:'all 0.2s ease',
            }}>{t==='create' ? 'Create game' : 'Join game'}</button>
          ))}
        </div>

        {/* Name input */}
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'0.1em', marginBottom:8, textTransform:'uppercase' }}>Your name</p>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name"
            style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1.5px solid ${T.border}`, background:'rgba(0,0,0,0.3)', color:T.white, fontSize:14, fontFamily:'Georgia,serif', boxSizing:'border-box', transition:'border 0.2s ease' }}
            onFocus={e=>e.target.style.borderColor='rgba(200,147,12,0.6)'}
            onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>

        {tab === 'join' ? (
          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'0.1em', marginBottom:8, textTransform:'uppercase' }}>Session code</p>
            <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="e.g. XK7F2" maxLength={5}
              style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1.5px solid ${T.border}`, background:'rgba(0,0,0,0.3)', color:T.goldL, fontSize:20, fontFamily:'monospace', fontWeight:700, letterSpacing:'0.2em', textAlign:'center', boxSizing:'border-box' }}
              onFocus={e=>e.target.style.borderColor='rgba(200,147,12,0.6)'}
              onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>
        ) : (
          <>
            <Section label="Game mode">
              {pill('📚 Education', mode==='education', ()=>setMode('education'), 'teal')}
              {pill('🎉 Fun', mode==='fun', ()=>setMode('fun'), 'gold')}
            </Section>
            <Section label="Difficulty">
              {pill('😊 Easy', difficulty==='easy', ()=>setDiff('easy'), 'teal')}
              {pill('🧠 Medium', difficulty==='medium', ()=>setDiff('medium'), 'gold')}
              {pill('🔥 Hard', difficulty==='hard', ()=>setDiff('hard'), 'red')}
            </Section>
            <Section label="Players">
              {[3,4,5,6,7,8].map(n => pill(`${n}`, maxPlayers===n, ()=>setPlayers(n), 'teal'))}
            </Section>
            <Section label="Rounds">
              {[3,5,7,10].map(n => pill(`${n}`, rounds===n, ()=>setRounds(n), 'gold'))}
            </Section>
          </>
        )}

        {error && <p style={{ color:'#FCA5A5', fontSize:12, marginBottom:12, textAlign:'center', background:'rgba(233,69,96,0.1)', padding:'8px 12px', borderRadius:8, border:'1px solid rgba(233,69,96,0.2)' }}>{error}</p>}

        <button onClick={tab==='create'?handleCreate:handleJoin} disabled={loading} style={{
          width:'100%', padding:'14px', borderRadius:14, border:'none', cursor:loading?'not-allowed':'pointer',
          background: loading ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg,${T.gold},#A07010)`,
          color: loading ? T.muted : T.navy, fontSize:15, fontWeight:800,
          fontFamily:'Georgia,serif', letterSpacing:0.5,
          boxShadow: loading ? 'none' : `0 4px 20px rgba(200,147,12,0.4)`,
          transition:'all 0.2s ease', marginTop:4,
        }}>
          {loading ? 'Loading…' : tab==='create' ? 'Create game' : 'Join game'}
        </button>

        <button onClick={onShowTutorial} style={{ width:'100%', marginTop:10, padding:'10px', borderRadius:12, border:`1px solid ${T.border}`, background:'transparent', color:T.muted, fontSize:12, cursor:'pointer', transition:'all 0.15s' }}
          onMouseEnter={e=>e.target.style.color=T.white} onMouseLeave={e=>e.target.style.color=T.muted}>
          📖 How to play
        </button>
      </div>
    </div>
  );
}
