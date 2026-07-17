import React, { useState } from 'react';
import { auth, signOut } from '../utils/firebase';
import axios from 'axios';

const T = {
  pageBg:'#F7F2EA', cardBg:'#FFFFFF', border:'#E8E0D0',
  textPrimary:'#1A1A2E', textSecondary:'#9B8E7A', textMuted:'#C4B9A8',
  gold:'#C8930C', goldBg:'#FEF3E2', teal:'#1A8C8C', tealBg:'#E8F4F4',
  red:'#E94560', navy:'#1A1A2E', white:'#FFFFFF', tabBg:'#F0EDE8',
};

const AVATARS = ['😎','🧠','🦊','🐯','🐸','🦁','🐧','🐉','🦋','🐺','🦅','🐬','🎭','🧩','⚡','🔥'];

export default function ProfilePage({ profile, onSignOut, onBack }) {
  const [editing, setEditing]   = useState(false);
  const [avatar, setAvatar]     = useState(profile?.avatar || '😎');
  const [username, setUsername] = useState(profile?.username || '');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [saved, setSaved]       = useState(false);

  const winRate = profile?.gamesPlayed > 0
    ? Math.round((profile.wins / profile.gamesPlayed) * 100)
    : 0;

  async function handleSave() {
    setLoading(true); setError('');
    try {
      await axios.patch('/auth/profile', { username, avatar });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditing(false);
    } catch { setError('Failed to save. Try again.'); }
    setLoading(false);
  }

  async function handleSignOut() {
    try { await signOut(auth); onSignOut(); }
    catch { setError('Sign out failed.'); }
  }

  return (
    <div style={{ minHeight:'100vh', background:T.pageBg, padding:'20px 20px 40px', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <style>{`@keyframes wh-pop{0%{transform:scale(0.95);opacity:0;}100%{transform:scale(1);opacity:1;}}.wh-pop{animation:wh-pop 0.25s cubic-bezier(.34,1.56,.64,1) forwards;}`}</style>

      <div style={{ width:'100%', maxWidth:420 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={onBack} style={{ background:'none', border:'none', color:T.textSecondary, fontSize:13, cursor:'pointer', padding:0 }}>← Back</button>
          <h2 style={{ fontSize:18, fontWeight:700, color:T.navy, fontFamily:'Georgia,serif', margin:0, flex:1, textAlign:'center' }}>My Profile</h2>
          <div style={{ width:40 }}/>
        </div>

        {/* Profile card */}
        <div className="wh-pop" style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:20, padding:24, boxShadow:'0 8px 32px rgba(26,26,46,0.1)', marginBottom:14 }}>

          {/* Avatar + name */}
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:T.goldBg, border:`3px solid ${T.gold}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:38, margin:'0 auto 10px' }}>{avatar}</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:T.navy, fontFamily:'Georgia,serif', margin:0 }}>{profile?.username}</h3>
            <p style={{ fontSize:11, color:T.textSecondary, marginTop:3 }}>{profile?.country} · Joined {profile?.joinedDate || 'July 2026'}</p>
            <div style={{ marginTop:6 }}>
              <span style={{ padding:'3px 10px', borderRadius:99, background:T.goldBg, border:`1px solid rgba(200,147,12,0.3)`, color:T.gold, fontSize:11, fontWeight:600 }}>
                ⭐ Level {profile?.level || 1}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {[
              [profile?.gamesPlayed||0, 'Games'],
              [profile?.wins||0, 'Wins'],
              [profile?.totalPoints||0, 'Points'],
            ].map(([val,lbl]) => (
              <div key={lbl} style={{ flex:1, background:T.tabBg, borderRadius:12, padding:'10px 6px', textAlign:'center' }}>
                <p style={{ fontSize:20, fontWeight:800, color:T.navy, margin:0 }}>{val}</p>
                <p style={{ fontSize:9, color:T.textSecondary, margin:0, marginTop:2 }}>{lbl}</p>
              </div>
            ))}
          </div>

          {/* Win rate */}
          <div style={{ background:T.tabBg, borderRadius:10, padding:'10px 12px', marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:11, color:T.textSecondary }}>Win rate</span>
              <span style={{ fontSize:11, fontWeight:700, color:T.gold }}>{winRate}%</span>
            </div>
            <div style={{ height:6, background:T.border, borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${winRate}%`, background:`linear-gradient(90deg,${T.teal},${T.gold})`, borderRadius:3, transition:'width 0.5s ease' }}/>
            </div>
          </div>

          {error && <p style={{ color:T.red, fontSize:12, marginBottom:10, textAlign:'center' }}>{error}</p>}
          {saved && <p style={{ color:T.teal, fontSize:12, marginBottom:10, textAlign:'center' }}>✓ Profile saved!</p>}

          {/* Edit section */}
          {editing ? (
            <>
              <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Change avatar</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:5, marginBottom:14 }}>
                {AVATARS.map(a => (
                  <div key={a} onClick={()=>setAvatar(a)} style={{ aspectRatio:'1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, cursor:'pointer', border:`2px solid ${avatar===a?T.gold:'transparent'}`, background:avatar===a?T.goldBg:T.tabBg }}>
                    {a}
                  </div>
                ))}
              </div>
              <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Username</p>
              <input value={username} onChange={e=>setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g,'').slice(0,20))}
                style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1.5px solid ${T.border}`, background:T.white, color:T.textPrimary, fontSize:14, boxSizing:'border-box', outline:'none', marginBottom:14 }}/>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setEditing(false)} style={{ flex:1, padding:'12px', borderRadius:10, border:`1px solid ${T.border}`, background:'transparent', color:T.textSecondary, fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
                <button onClick={handleSave} disabled={loading} style={{ flex:1, padding:'12px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${T.teal},#115E59)`, color:T.white, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 3px 10px rgba(26,140,140,0.3)' }}>
                  {loading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </>
          ) : (
            <button onClick={()=>setEditing(true)} style={{ width:'100%', padding:'12px', borderRadius:12, border:`1.5px solid ${T.border}`, background:T.white, color:T.textPrimary, fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 1px 4px rgba(26,26,46,0.06)' }}>
              ✏️ Edit profile
            </button>
          )}
        </div>

        {/* Sign out */}
        <button onClick={handleSignOut} style={{ width:'100%', padding:'13px', borderRadius:12, border:`1.5px solid rgba(233,69,96,0.3)`, background:T.white, color:T.red, fontSize:13, fontWeight:600, cursor:'pointer' }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
