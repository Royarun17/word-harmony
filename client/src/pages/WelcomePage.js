import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup } from '../utils/firebase';

const T = {
  pageBg:'#F7F2EA', cardBg:'#FFFFFF', border:'#E8E0D0',
  textPrimary:'#1A1A2E', textSecondary:'#9B8E7A', textMuted:'#C4B9A8',
  gold:'#C8930C', goldBg:'#FEF3E2', teal:'#1A8C8C', tealBg:'#E8F4F4',
  red:'#E94560', navy:'#1A1A2E', white:'#FFFFFF', tabBg:'#F0EDE8',
};

export default function WelcomePage({ onNavigate }) {
  const [loading, setLoading] = useState('');
  const [error, setError]     = useState('');

  async function handleGoogle() {
    setLoading('google'); setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onNavigate('checkProfile', { user: result.user });
    } catch (e) { setError('Google sign-in failed. Try again.'); }
    setLoading('');
  }

  return (
    <div style={{ minHeight:'100vh', background:T.pageBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{`@keyframes wh-pop{0%{transform:scale(0.95);opacity:0;}100%{transform:scale(1);opacity:1;}}.wh-pop{animation:wh-pop 0.3s cubic-bezier(.34,1.56,.64,1) forwards;} @keyframes wh-float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}.wh-float{animation:wh-float 3s ease-in-out infinite;}`}</style>

      {/* Logo */}
      <div className="wh-float" style={{ marginBottom:32, textAlign:'center' }}>
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
        <p style={{ fontSize:11, color:T.textSecondary, marginTop:6, letterSpacing:'0.1em' }}>CONNECT · PASS · BUZZ · WIN</p>
      </div>

      {/* Card */}
      <div className="wh-pop" style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:'100%', maxWidth:400, boxShadow:'0 8px 32px rgba(26,26,46,0.1)' }}>

        {/* Illustration */}
        <div style={{ background:T.tabBg, borderRadius:14, padding:20, textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:42, marginBottom:6 }}>🧠⚡🃏</div>
          <p style={{ fontSize:12, color:T.textSecondary, margin:0 }}>Real-time multiplayer word card game</p>
          <p style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>Up to 8 players · Bots · 3 difficulty levels</p>
        </div>

        {error && <p style={{ color:T.red, fontSize:12, marginBottom:12, textAlign:'center', background:'#FEE2E2', padding:'8px 12px', borderRadius:8 }}>{error}</p>}

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading==='google'} style={{
          width:'100%', padding:'13px', borderRadius:12, border:`1.5px solid ${T.border}`,
          background:T.white, color:T.textPrimary, fontSize:13, fontWeight:600,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          marginBottom:8, boxShadow:'0 1px 4px rgba(26,26,46,0.06)', transition:'all 0.15s',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading==='google' ? 'Signing in…' : 'Continue with Google'}
        </button>

        {/* Email */}
        <button onClick={()=>onNavigate('signup')} style={{
          width:'100%', padding:'13px', borderRadius:12, border:`1.5px solid ${T.border}`,
          background:T.white, color:T.textPrimary, fontSize:13, fontWeight:600,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          marginBottom:8, boxShadow:'0 1px 4px rgba(26,26,46,0.06)',
        }}>
          📧 Continue with Email
        </button>

        {/* Phone */}
        <button onClick={()=>onNavigate('phone')} style={{
          width:'100%', padding:'13px', borderRadius:12, border:`1.5px solid ${T.border}`,
          background:T.white, color:T.textPrimary, fontSize:13, fontWeight:600,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          marginBottom:16, boxShadow:'0 1px 4px rgba(26,26,46,0.06)',
        }}>
          📱 Continue with Phone
        </button>

        <div style={{ textAlign:'center' }}>
          <span style={{ fontSize:12, color:T.textSecondary }}>Already have an account? </span>
          <button onClick={()=>onNavigate('signin')} style={{ background:'none', border:'none', color:T.gold, fontSize:12, fontWeight:700, cursor:'pointer' }}>Sign in</button>
        </div>
      </div>
    </div>
  );
}
