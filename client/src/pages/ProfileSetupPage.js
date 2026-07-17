import React, { useState } from 'react';
import axios from 'axios';

const T = {
  pageBg:'#F7F2EA', cardBg:'#FFFFFF', border:'#E8E0D0',
  textPrimary:'#1A1A2E', textSecondary:'#9B8E7A', textMuted:'#C4B9A8',
  gold:'#C8930C', goldBg:'#FEF3E2', teal:'#1A8C8C', tealBg:'#E8F4F4',
  red:'#E94560', navy:'#1A1A2E', white:'#FFFFFF', tabBg:'#F0EDE8',
};

const AVATARS = ['😎','🧠','🦊','🐯','🐸','🦁','🐧','🐉','🦋','🐺','🦅','🐬','🎭','🧩','⚡','🔥'];
const COUNTRIES = ['🇮🇳 India','🇺🇸 United States','🇬🇧 United Kingdom','🇦🇺 Australia','🇨🇦 Canada','🇸🇬 Singapore','🇯🇵 Japan','🇰🇷 South Korea','🇧🇷 Brazil','🇳🇬 Nigeria','🇦🇪 UAE','🌍 Other'];

export default function ProfileSetupPage({ user, displayName, onComplete }) {
  const [username, setUsername]   = useState(displayName || '');
  const [avatar, setAvatar]       = useState('😎');
  const [country, setCountry]     = useState('🇮🇳 India');
  const [checking, setChecking]   = useState(false);
  const [usernameOk, setUsernameOk] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  async function checkUsername(val) {
    if (val.length < 3) { setUsernameOk(null); return; }
    setChecking(true);
    try {
      const { data } = await axios.get(`/auth/check-username?username=${val}`);
      setUsernameOk(data.available);
    } catch { setUsernameOk(null); }
    setChecking(false);
  }

  function handleUsernameChange(val) {
    const clean = val.replace(/[^a-zA-Z0-9_]/g,'').slice(0,20);
    setUsername(clean);
    if (clean.length >= 3) checkUsername(clean);
    else setUsernameOk(null);
  }

  async function handleSave() {
    if (!username || username.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (usernameOk === false) { setError('Username already taken'); return; }
    setLoading(true); setError('');
    try {
      await axios.post('/auth/profile', {
        firebaseUid: user.uid,
        email: user.email || '',
        phone: user.phoneNumber || '',
        username,
        avatar,
        country,
        displayName: user.displayName || username,
      });
      onComplete({ uid: user.uid, username, avatar, country });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile. Try again.');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh', background:T.pageBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{`@keyframes wh-pop{0%{transform:scale(0.95);opacity:0;}100%{transform:scale(1);opacity:1;}}.wh-pop{animation:wh-pop 0.25s cubic-bezier(.34,1.56,.64,1) forwards;}`}</style>

      <div className="wh-pop" style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:'100%', maxWidth:420, boxShadow:'0 8px 32px rgba(26,26,46,0.1)' }}>

        <div style={{ textAlign:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:22, fontWeight:700, color:T.navy, fontFamily:'Georgia,serif', margin:0 }}>Set up your profile</h2>
          <p style={{ fontSize:12, color:T.textSecondary, marginTop:4 }}>This is how other players see you</p>
        </div>

        {error && <p style={{ color:T.red, fontSize:12, marginBottom:12, textAlign:'center', background:'#FEE2E2', padding:'8px 12px', borderRadius:8 }}>{error}</p>}

        {/* Selected avatar preview */}
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:T.goldBg, border:`3px solid ${T.gold}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:38, margin:'0 auto' }}>{avatar}</div>
        </div>

        {/* Avatar picker */}
        <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Choose avatar</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:6, marginBottom:16 }}>
          {AVATARS.map(a => (
            <div key={a} onClick={()=>setAvatar(a)} style={{
              aspectRatio:'1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, cursor:'pointer', border:`2px solid ${avatar===a?T.gold:'transparent'}`,
              background: avatar===a ? T.goldBg : T.tabBg,
              transition:'all 0.15s', boxShadow: avatar===a ? `0 0 0 2px rgba(200,147,12,0.2)` : 'none',
            }}>{a}</div>
          ))}
        </div>

        {/* Username */}
        <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Username</p>
        <div style={{ position:'relative', marginBottom:6 }}>
          <input value={username} onChange={e=>handleUsernameChange(e.target.value)}
            placeholder="e.g. WordMaster_Arun"
            style={{ width:'100%', padding:'12px 36px 12px 14px', borderRadius:10, border:`1.5px solid ${usernameOk===true?T.teal:usernameOk===false?T.red:T.border}`, background:T.white, color:T.textPrimary, fontSize:14, boxSizing:'border-box', outline:'none' }}/>
          <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:14 }}>
            {checking ? '⏳' : usernameOk===true ? '✅' : usernameOk===false ? '❌' : ''}
          </span>
        </div>
        <p style={{ fontSize:11, color: usernameOk===true?T.teal:usernameOk===false?T.red:T.textMuted, marginBottom:14 }}>
          {usernameOk===true ? '✓ Username available!' : usernameOk===false ? '✗ Already taken' : 'Letters, numbers and _ only · 3-20 chars'}
        </p>

        {/* Country */}
        <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Country</p>
        <select value={country} onChange={e=>setCountry(e.target.value)} style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1.5px solid ${T.border}`, background:T.white, color:T.textPrimary, fontSize:14, outline:'none', marginBottom:20, cursor:'pointer' }}>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button onClick={handleSave} disabled={loading} style={{
          width:'100%', padding:'14px', borderRadius:12, border:'none',
          background:`linear-gradient(135deg,${T.gold},#A07010)`,
          color:T.navy, fontSize:14, fontWeight:800, fontFamily:'Georgia,serif',
          cursor:loading?'not-allowed':'pointer',
          boxShadow:'0 4px 16px rgba(200,147,12,0.3)',
        }}>
          {loading ? 'Saving…' : 'Save profile →'}
        </button>
      </div>
    </div>
  );
}
