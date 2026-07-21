import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword } from '../utils/firebase';
import { ThemeSwitcher } from '../SynapseComponents';

function Field({ label, type = 'text', value, onChange, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '14px 16px', borderRadius: 14,
          border: `1.5px solid ${error ? 'var(--danger)' : focused ? 'var(--accent)' : 'var(--border)'}`,
          background: 'var(--surface)', color: 'var(--ink)', fontSize: 16,
          boxSizing: 'border-box', outline: 'none', fontFamily: 'var(--font-body)',
          boxShadow: focused ? '0 0 0 3px oklch(0.82 0.16 195 / 0.15)' : 'none',
          transition: 'border 0.2s, box-shadow 0.2s',
        }}/>
      {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{error}</p>}
    </div>
  );
}

export default function SignInPage({ onNavigate }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Enter your email and password.'); return; }
    setLoading(true); setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      onNavigate('checkProfile', { user: result.user });
    } catch (err) {
      if (err.code === 'auth/user-not-found')  setError('No account with this email.');
      else if (err.code === 'auth/wrong-password') setError('Wrong password. Try again.');
      else if (err.code === 'auth/invalid-credential') setError('Incorrect email or password.');
      else setError('Sign in failed. Try again.');
    }
    setLoading(false);
  }

  return (
    <div className="scene" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <ThemeSwitcher />
      <div className="scene-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '56px 20px 32px', overflowY: 'auto' }}>

        {/* Back */}
        <button onClick={() => onNavigate('welcome')} style={{ width: 40, height: 40, borderRadius: 99, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink)', fontSize: 18, marginBottom: 32, flexShrink: 0 }}>←</button>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.4em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>WELCOME BACK</div>
          <h1 style={{ fontSize: 40, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1, color: 'var(--ink)', marginBottom: 10 }}>Sign in</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-dim)' }}>Good to see you again.</p>
        </div>

        {/* Synapse logo glow */}
        <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 120, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent), transparent 60%)', opacity: 0.3, filter: 'blur(20px)', pointerEvents: 'none' }}/>
          <div style={{ fontSize: 52, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)', lineHeight: 1, position: 'relative' }}>
            Syn<span style={{ color: 'var(--accent)' }}>apse</span>
          </div>
        </div>

        {/* Form */}
        <div className="panel" style={{ padding: 24, marginBottom: 16 }}>
          {error && (
            <div style={{ background: 'oklch(0.68 0.22 22 / 0.15)', border: '1px solid oklch(0.68 0.22 22 / 0.35)', borderRadius: 12, padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
            <Field label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" />

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginBottom: 24, marginTop: -8 }}>
              <button type="button" style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn-primary tap-target" style={{ width: '100%', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>no account yet?</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
        </div>

        {/* Sign up link */}
        <button onClick={() => onNavigate('signup')} className="btn-ghost tap-target" style={{ width: '100%' }}>
          Create account
        </button>
      </div>
    </div>
  );
}
