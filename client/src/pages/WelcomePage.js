import React, { useState } from 'react';
import { auth, signInWithGoogle, getRedirectResult } from '../utils/firebase';

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
      const result = await signInWithGoogle();
      if (result) {
        onNavigate('checkProfile', { user: result.user });
      }
      // if null — mobile redirect in progress, will return via onAuthStateChanged
    } catch (e) {
      if (e.code === 'auth/popup-blocked' || e.message?.includes('sessionStorage') || e.message?.includes('initial state')) {
        setError('Popup was blocked. Please allow popups for this site and try again.');
      } else if (e.code === 'auth/popup-closed-by-user') {
        setError('Sign-in window was closed. Please try again.');
      } else if (e.code === 'auth/cancelled-popup-request') {
        setError('');
      } else {
        setError('Google sign-in failed. Please try Email sign-in instead.');
      }
    }
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



        {/* Email */}
        <button onClick={()=>onNavigate('signup')} style={{
          width:'100%', padding:'13px', borderRadius:12, border:`1.5px solid ${T.border}`,
          background:T.white, color:T.textPrimary, fontSize:13, fontWeight:600,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          marginBottom:8, boxShadow:'0 1px 4px rgba(26,26,46,0.06)',
        }}>
          📧 Continue with Email
        </button>


        <div style={{ textAlign:'center' }}>
          <span style={{ fontSize:12, color:T.textSecondary }}>Already have an account? </span>
          <button onClick={()=>onNavigate('signin')} style={{ background:'none', border:'none', color:T.gold, fontSize:12, fontWeight:700, cursor:'pointer' }}>Sign in</button>
        </div>
      </div>
    </div>
  );
}
