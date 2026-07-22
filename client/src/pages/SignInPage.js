import React, { useState, useEffect } from 'react';
import { auth, signInWithEmailAndPassword } from '../utils/firebase';
import { ThemeSwitcher } from '../SynapseComponents';

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

function AuthField({ label, type = 'text', placeholder, value, onChange, error, reveal, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPass = type === 'password';
  const effectiveType = isPass && reveal && show ? 'text' : type;
  const invalid = Boolean(error && error.trim());

  return (
    <div style={{ width: '100%' }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 8, color: invalid ? 'var(--danger)' : 'var(--ink-dim)' }}>
        {label}
      </label>
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'center', borderRadius: 24,
        background: 'oklch(0.22 0.03 232 / 0.85)',
        border: `1px solid ${invalid ? 'var(--danger)' : focused ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: invalid
          ? '0 0 0 4px oklch(0.68 0.22 22 / 0.18)'
          : focused
            ? '0 0 0 4px oklch(0.82 0.16 195 / 0.18), 0 0 24px oklch(0.82 0.16 195 / 0.25)'
            : 'inset 0 1px 0 oklch(1 0 0 / 0.03)',
        transition: 'box-shadow 200ms, border-color 200ms',
      }}>
        <span style={{ paddingLeft: 16, paddingRight: 4, color: focused ? 'var(--accent)' : 'var(--ink-mute)', display: 'flex', alignItems: 'center', fontSize: 18 }}>
          {isPass ? '🔒' : '✉'}
        </span>
        <input
          type={effectiveType} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, background: 'transparent', outline: 'none', padding: '16px', fontSize: 16, fontFamily: 'var(--font-body)', color: 'var(--ink)', minHeight: 56, border: 'none' }}
        />
        {isPass && reveal && (
          <button type="button" onClick={() => setShow(s => !s)}
            style={{ paddingRight: 16, paddingLeft: 8, color: 'var(--ink-mute)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 18 }}>
            {show ? '🙈' : '👁'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SignInPage({ onNavigate }) {
  const [email, setEmail]       = useState('');
  const [pw, setPw]             = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [authError, setAuthError] = useState('');
  const online = useOnline();

  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const canSubmit = emailValid && pw.length >= 1 && online;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setAuthError(''); setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pw);
      setSuccess(true);
      setTimeout(() => onNavigate('checkProfile', { user: result.user }), 650);
    } catch (err) {
      if (err.code === 'auth/user-not-found')       setAuthError('No account with this email.');
      else if (err.code === 'auth/wrong-password')  setAuthError('Wrong password. Try again.');
      else if (err.code === 'auth/invalid-credential') setAuthError('Incorrect email or password.');
      else setAuthError('Sign in failed. Try again.');
    }
    setLoading(false);
  }

  return (
    <div className="scene" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <ThemeSwitcher />
      <div className="scene-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '56px 24px 32px', overflowY: 'auto' }}>

        {/* Back button */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button onClick={() => onNavigate('welcome')} className="tap-target" style={{ width: 44, height: 44, borderRadius: 99, background: 'oklch(0.22 0.03 232 / 0.7)', border: '1px solid var(--border)', color: 'var(--ink)', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(8px)' }}>
            ‹
          </button>
        </div>

        {/* Synapse wordmark — floating with glow */}
        <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative', animation: 'syn-float 6s ease-in-out infinite' }}>
          <div aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 160, height: 80, background: 'radial-gradient(ellipse 70% 60% at 50% 50%, var(--accent), transparent 70%)', filter: 'blur(24px)', opacity: 0.6, pointerEvents: 'none' }}/>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 40, lineHeight: 1, letterSpacing: '-0.02em', position: 'relative' }}>
            <span style={{ color: 'var(--ink)' }}>Syn</span>
            <span style={{ color: 'var(--accent)', textShadow: '0 0 22px oklch(0.82 0.16 195 / 0.7)' }}>apse</span>
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 24, animation: 'syn-rise 500ms cubic-bezier(.2,.8,.2,1) both' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.32em', color: 'var(--accent)', marginBottom: 8 }}>Welcome back</div>
          <h1 style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 8 }}>Sign in</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-dim)' }}>Good to see you again.</p>
        </div>

        {/* Form */}
        <div style={{ animation: 'syn-rise 600ms 80ms cubic-bezier(.2,.8,.2,1) both' }}>
          {!online && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12, background: 'oklch(0.82 0.16 75 / 0.12)', border: '1px solid oklch(0.82 0.16 75 / 0.45)', color: 'var(--warn)' }}>
              <span style={{ fontSize: 16 }}>📶</span>
              <div style={{ fontSize: 12, fontWeight: 600 }}>You're offline. Reconnect to sign in.</div>
            </div>
          )}

          <div className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Error banner */}
            {authError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12, background: 'oklch(0.68 0.22 22 / 0.12)', border: '1px solid oklch(0.68 0.22 22 / 0.5)', color: 'var(--danger)', animation: 'syn-pop 260ms cubic-bezier(.2,.8,.2,1) both' }} role="alert">
                <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
                <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{authError}</div>
              </div>
            )}

            {/* Email */}
            <AuthField label="Email" type="email" placeholder="you@synapse.gg" autoComplete="email"
              value={email} onChange={e => { setEmail(e.target.value); if (authError) setAuthError(''); }}
              error={authError ? ' ' : null} />

            {/* Password + forgot */}
            <div>
              <AuthField label="Password" type="password" reveal autoComplete="current-password"
                placeholder="Your password"
                value={pw} onChange={e => { setPw(e.target.value); if (authError) setAuthError(''); }}
                error={authError ? ' ' : null} />
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="button" onClick={handleSubmit} disabled={(!canSubmit && !loading) || success}
              className="btn-primary tap-target"
              style={{ marginTop: 4, opacity: !canSubmit && !loading ? 0.55 : 1, cursor: !canSubmit ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {success ? '✓ Signed in' : loading ? '⏳ Signing in…' : 'Sign in →'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
              <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-mute)' }}>No account yet?</div>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            </div>

            {/* Create account */}
            <button type="button" onClick={() => onNavigate('signup')}
              className="btn-ghost tap-target"
              style={{ borderColor: 'oklch(0.82 0.16 195 / 0.55)', color: 'var(--accent)' }}>
              Create account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
