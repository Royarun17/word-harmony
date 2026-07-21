import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword } from '../utils/firebase';
import { ThemeSwitcher } from '../SynapseComponents';

function Field({ label, type = 'text', value, onChange, placeholder, error, hint }) {
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
      {hint && !error && <p style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 6 }}>{hint}</p>}
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
  const [genError, setGenError] = useState('');

  function validate() {
    const e = {};
    if (!name.trim())                      e.name = 'Enter your name';
    if (!email.includes('@'))              e.email = 'Enter a valid email';
    if (password.length < 6)              e.password = 'At least 6 characters';
    if (confirm !== password)             e.confirm = 'Passwords do not match';
    if (!agreed)                          e.agreed = 'You must agree to continue';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setGenError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      onNavigate('profileSetup', { user: result.user, name });
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setGenError('An account with this email already exists.');
      else setGenError('Could not create account. Try again.');
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
          <div style={{ fontSize: 11, letterSpacing: '0.4em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>JOIN SYNAPSE</div>
          <h1 style={{ fontSize: 40, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1, color: 'var(--ink)', marginBottom: 10 }}>Create account</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-dim)' }}>Start playing in seconds.</p>
        </div>

        {/* Form */}
        <div className="panel" style={{ padding: 24, marginBottom: 16 }}>
          {genError && (
            <div style={{ background: 'oklch(0.68 0.22 22 / 0.15)', border: '1px solid oklch(0.68 0.22 22 / 0.35)', borderRadius: 12, padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>{genError}</div>
          )}

          <form onSubmit={handleSubmit}>
            <Field label="Full name" value={name} onChange={e => setName(e.target.value)} placeholder="Alex Reyes" error={errors.name} />
            <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" error={errors.email} />
            <Field label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" error={errors.password} hint="At least 6 characters" />
            <Field label="Confirm password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" error={errors.confirm} />

            {/* Terms */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24 }}>
              <button type="button" onClick={() => setAgreed(!agreed)} style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                background: agreed ? 'linear-gradient(140deg, var(--accent), var(--accent-2))' : 'transparent',
                border: `2px solid ${errors.agreed ? 'var(--danger)' : agreed ? 'transparent' : 'var(--border)'}`,
                cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--accent-ink)', fontSize: 13,
                boxShadow: agreed ? 'var(--glow-accent)' : 'none', transition: 'all 200ms',
              }}>
                {agreed && '✓'}
              </button>
              <div style={{ fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5 }}>
                I agree to the <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Terms of Service</span> and <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Privacy Policy</span>
                {errors.agreed && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.agreed}</div>}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary tap-target" style={{ width: '100%', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>
        </div>

        {/* Sign in link */}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-mute)' }}>
          Already have an account?{' '}
          <button onClick={() => onNavigate('signin')} style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}>Sign in</button>
        </p>
      </div>
    </div>
  );
}
