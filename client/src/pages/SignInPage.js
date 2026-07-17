import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword } from '../utils/firebase';

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
      const result = await signInWithPopup(auth, googleProvider);
      onNavigate('checkProfile', { user: result.user });
    } catch { setError('Google sign-in failed.'); }
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

        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <div style={{ flex:1, height:1, background:T.border }}/>
          <span style={{ fontSize:11, color:T.textMuted }}>or</span>
          <div style={{ flex:1, height:1, background:T.border }}/>
        </div>

        <button onClick={handleGoogle} disabled={loading==='google'} style={{
          width:'100%', padding:'13px', borderRadius:12, border:`1.5px solid ${T.border}`,
          background:T.white, color:T.textPrimary, fontSize:13, fontWeight:600,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:8,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading==='google' ? 'Signing in…' : 'Continue with Google'}
        </button>

        <button onClick={()=>onNavigate('phone')} style={{
          width:'100%', padding:'13px', borderRadius:12, border:`1.5px solid ${T.border}`,
          background:T.white, color:T.textPrimary, fontSize:13, fontWeight:600,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
        }}>
          📱 Continue with Phone
        </button>

        <div style={{ textAlign:'center', marginTop:16 }}>
          <span style={{ fontSize:12, color:T.textSecondary }}>No account yet? </span>
          <button onClick={()=>onNavigate('signup')} style={{ background:'none', border:'none', color:T.gold, fontSize:12, fontWeight:700, cursor:'pointer' }}>Sign up</button>
        </div>
      </div>
    </div>
  );
}
