import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword } from '../utils/firebase';

const T = {
  pageBg:'#F7F2EA', cardBg:'#FFFFFF', border:'#E8E0D0',
  textPrimary:'#1A1A2E', textSecondary:'#9B8E7A', textMuted:'#C4B9A8',
  gold:'#C8930C', goldBg:'#FEF3E2', teal:'#1A8C8C', tealBg:'#E8F4F4',
  red:'#E94560', navy:'#1A1A2E', white:'#FFFFFF', tabBg:'#F0EDE8',
};

function Input({ label, type='text', value, onChange, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:12 }}>
      <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{label}</p>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1.5px solid ${error?T.red:focused?T.gold:T.border}`, background:T.white, color:T.textPrimary, fontSize:14, boxSizing:'border-box', outline:'none', transition:'border 0.2s' }}/>
      {error && <p style={{ fontSize:11, color:T.red, marginTop:4 }}>{error}</p>}
    </div>
  );
}

export default function SignUpPage({ onNavigate }) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [agreed, setAgreed]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'At least 6 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    if (!agreed) e.agreed = 'Please accept the terms';
    return e;
  }

  async function handleSignUp(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setErrors({});
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      onNavigate('profileSetup', { user: result.user, displayName: name });
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setErrors({ email: 'This email is already registered. Try signing in with Google instead.' });
      else setErrors({ general: 'Sign up failed. Try again.' });
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh', background:T.pageBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{`@keyframes wh-pop{0%{transform:scale(0.95);opacity:0;}100%{transform:scale(1);opacity:1;}}.wh-pop{animation:wh-pop 0.25s cubic-bezier(.34,1.56,.64,1) forwards;}`}</style>

      <div className="wh-pop" style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:'100%', maxWidth:400, boxShadow:'0 8px 32px rgba(26,26,46,0.1)' }}>
        <button onClick={()=>onNavigate('welcome')} style={{ background:'none', border:'none', color:T.textSecondary, fontSize:13, cursor:'pointer', marginBottom:16, padding:0 }}>← Back</button>

        <div style={{ textAlign:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:22, fontWeight:700, color:T.navy, fontFamily:'Georgia,serif', margin:0 }}>Create account</h2>
          <p style={{ fontSize:12, color:T.textSecondary, marginTop:4 }}>Join Synapse today</p>
        </div>

        {errors.general && <p style={{ color:T.red, fontSize:12, marginBottom:12, textAlign:'center', background:'#FEE2E2', padding:'8px 12px', borderRadius:8 }}>{errors.general}</p>}

        <form onSubmit={handleSignUp}>
          <Input label="Full name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" error={errors.name}/>
          <Input label="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" error={errors.email}/>
          <Input label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" error={errors.password}/>
          <Input label="Confirm password" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password" error={errors.confirm}/>

          <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:16 }}>
            <div onClick={()=>setAgreed(s=>!s)} style={{ width:18, height:18, borderRadius:5, background: agreed?T.gold:T.white, border:`2px solid ${agreed?T.gold:T.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:1 }}>
              {agreed && <span style={{ color:T.navy, fontSize:11, fontWeight:700 }}>✓</span>}
            </div>
            <p style={{ fontSize:11, color:T.textSecondary, lineHeight:1.5, margin:0 }}>
              I agree to the <span style={{ color:T.gold, fontWeight:600 }}>Terms of Service</span> and <span style={{ color:T.gold, fontWeight:600 }}>Privacy Policy</span>
            </p>
          </div>
          {errors.agreed && <p style={{ fontSize:11, color:T.red, marginBottom:10 }}>{errors.agreed}</p>}

          <button type="submit" disabled={loading} style={{
            width:'100%', padding:'14px', borderRadius:12, border:'none',
            background: `linear-gradient(135deg,${T.gold},#A07010)`,
            color:T.navy, fontSize:14, fontWeight:800, fontFamily:'Georgia,serif',
            cursor:loading?'not-allowed':'pointer',
            boxShadow:'0 4px 16px rgba(200,147,12,0.3)', transition:'all 0.2s',
          }}>
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:16 }}>
          <span style={{ fontSize:12, color:T.textSecondary }}>Already have an account? </span>
          <button onClick={()=>onNavigate('signin')} style={{ background:'none', border:'none', color:T.gold, fontSize:12, fontWeight:700, cursor:'pointer' }}>Sign in</button>
        </div>
      </div>
    </div>
  );
}
