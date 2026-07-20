import React, { useState } from 'react';
import { auth, signInWithGoogle, getRedirectResult, signInWithEmailAndPassword } from '../utils/firebase';

const T = {
  pageBg:'#F7F2EA', cardBg:'#FFFFFF', border:'#E8E0D0',
  textPrimary:'#1A1A2E', textSecondary:'#9B8E7A', textMuted:'#C4B9A8',
  gold:'#C8930C', teal:'#1A8C8C', red:'#E94560', navy:'#1A1A2E',
  white:'#FFFFFF', tabBg:'#F0EDE8',
};

export default function SignInPage({ onNavigate }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState('');
  const [error, setError]       = useState('');

  async function handleEmail(e) {
    e.preventDefault();
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading('email'); setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      onNavigate('checkProfile', { user: result.user });
    } catch (err) {
      if (err.code==='auth/user-not-found') setError('No account with this email');
      else if (err.code==='auth/wrong-password') setError('Wrong password');
      else setError('Sign in failed. Try again.');
    }
    setLoading('');
  }

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
        setError('Google sign-in failed. Please try Email instead.');
      }
    }
    setLoading('');
  }

  return (
    <div style={{ minHeight:'100vh', background:T.pageBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{`@keyframes wh-pop{0%{transform:scale(0.95);opacity:0;}100%{transform:scale(1);opacity:1;}}.wh-pop{animation:wh-pop 0.25s cubic-bezier(.34,1.56,.64,1) forwards;}`}</style>

      <div className="wh-pop" style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:'100%', maxWidth:400, boxShadow:'0 8px 32px rgba(26,26,46,0.1)' }}>
        <button onClick={()=>onNavigate('welcome')} style={{ background:'none', border:'none', color:T.textSecondary, fontSize:13, cursor:'pointer', marginBottom:16, padding:0 }}>← Back</button>

        <div style={{ textAlign:'center', marginBottom:24 }}>
          <h2 style={{ fontSize:22, fontWeight:700, color:T.navy, fontFamily:'Georgia,serif', margin:0 }}>Welcome back!</h2>
          <p style={{ fontSize:12, color:T.textSecondary, marginTop:4 }}>Sign in to Synapse</p>
        </div>

        {error && <p style={{ color:T.red, fontSize:12, marginBottom:12, textAlign:'center', background:'#FEE2E2', padding:'8px 12px', borderRadius:8 }}>{error}</p>}

        <form onSubmit={handleEmail}>
          <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Email</p>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@email.com"
            style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1.5px solid ${T.border}`, background:T.white, color:T.textPrimary, fontSize:14, boxSizing:'border-box', outline:'none', marginBottom:12 }}
            onFocus={e=>e.target.style.borderColor=T.gold} onBlur={e=>e.target.style.borderColor=T.border}/>

          <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Password</p>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Your password"
            style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1.5px solid ${T.border}`, background:T.white, color:T.textPrimary, fontSize:14, boxSizing:'border-box', outline:'none', marginBottom:6 }}
            onFocus={e=>e.target.style.borderColor=T.gold} onBlur={e=>e.target.style.borderColor=T.border}/>

          <div style={{ textAlign:'right', marginBottom:16 }}>
            <button type="button" style={{ background:'none', border:'none', color:T.gold, fontSize:12, fontWeight:600, cursor:'pointer' }}>Forgot password?</button>
          </div>

          <button type="submit" disabled={loading==='email'} style={{
            width:'100%', padding:'14px', borderRadius:12, border:'none',
            background:`linear-gradient(135deg,${T.gold},#A07010)`,
            color:T.navy, fontSize:14, fontWeight:800, fontFamily:'Georgia,serif',
            cursor:'pointer', boxShadow:'0 4px 16px rgba(200,147,12,0.3)', marginBottom:12,
          }}>
            {loading==='email' ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>




        <div style={{ textAlign:'center', marginTop:16 }}>
          <span style={{ fontSize:12, color:T.textSecondary }}>No account yet? </span>
          <button onClick={()=>onNavigate('signup')} style={{ background:'none', border:'none', color:T.gold, fontSize:12, fontWeight:700, cursor:'pointer' }}>Sign up</button>
        </div>
      </div>
    </div>
  );
}
