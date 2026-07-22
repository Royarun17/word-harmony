import React, { useState, useMemo, useEffect } from 'react';
import { auth, createUserWithEmailAndPassword } from '../utils/firebase';
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

function AuthField({ label, type = 'text', placeholder, value, onChange, hint, error, icon, reveal, autoComplete }) {
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
        {icon && (
          <span style={{ paddingLeft: 16, paddingRight: 4, color: focused ? 'var(--accent)' : 'var(--ink-mute)', display: 'flex', alignItems: 'center', fontSize: 18 }}>
            {icon}
          </span>
        )}
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
      {(hint || error) && (
        <div style={{ marginTop: 8, fontSize: 11, color: invalid ? 'var(--danger)' : 'var(--ink-mute)', lineHeight: 1.4 }}>
          {error || hint}
        </div>
      )}
    </div>
  );
}

function OfflineBanner() {
  return (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12, background: 'oklch(0.82 0.16 75 / 0.12)', border: '1px solid oklch(0.82 0.16 75 / 0.45)', color: 'var(--warn)' }}>
      <span style={{ fontSize: 16 }}>📶</span>
      <div style={{ fontSize: 12, fontWeight: 600 }}>You're offline. Reconnect to continue.</div>
    </div>
  );
}

export default function SignUpPage({ onNavigate }) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [pw, setPw]           = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree]     = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [genError, setGenError] = useState('');
  const online = useOnline();

  const errors = useMemo(() => ({
    name:    !name.trim() ? 'Enter your name' : null,
    email:   !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email' : null,
    pw:      pw.length < 6 ? 'At least 6 characters' : null,
    confirm: confirm && confirm !== pw ? 'Passwords do not match' : null,
  }), [name, email, pw, confirm]);

  const canSubmit = !errors.name && !errors.email && !errors.pw && !errors.confirm && confirm && agree && online;

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit || loading) return;
    setLoading(true); setGenError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pw);
      setSuccess(true);
      setTimeout(() => onNavigate('profileSetup', { user: result.user, name }), 700);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setGenError('An account with this email already exists.');
      else setGenError('Could not create account. Try again.');
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

        {/* Synapse wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative', animation: 'syn-float 6s ease-in-out infinite' }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 160, height: 80, background: 'radial-gradient(ellipse 70% 60% at 50% 50%, var(--accent), transparent 70%)', filter: 'blur(24px)', opacity: 0.6, pointerEvents: 'none' }}/>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 40, lineHeight: 1, letterSpacing: '-0.02em', position: 'relative' }}>
            <span style={{ color: 'var(--ink)' }}>Syn</span>
            <span style={{ color: 'var(--accent)', textShadow: '0 0 22px oklch(0.82 0.16 195 / 0.7)' }}>apse</span>
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 24, animation: 'syn-rise 500ms cubic-bezier(.2,.8,.2,1) both' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.32em', color: 'var(--accent)', marginBottom: 8 }}>Join Synapse</div>
          <h1 style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 8 }}>Create account</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-dim)' }}>Start playing in seconds.</p>
        </div>

        {/* Form */}
        <div style={{ animation: 'syn-rise 600ms 80ms cubic-bezier(.2,.8,.2,1) both' }}>
          {!online && <OfflineBanner />}

          <div className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {genError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12, background: 'oklch(0.68 0.22 22 / 0.12)', border: '1px solid oklch(0.68 0.22 22 / 0.5)', color: 'var(--danger)', animation: 'syn-pop 260ms cubic-bezier(.2,.8,.2,1) both' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
                <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{genError}</div>
              </div>
            )}

            <AuthField label="Full name" placeholder="Alex Reyes" autoComplete="name" icon="👤" value={name} onChange={e => setName(e.target.value)} error={touched ? errors.name : null} />
            <AuthField label="Email" type="email" placeholder="you@synapse.gg" autoComplete="email" icon="✉" value={email} onChange={e => setEmail(e.target.value)} error={touched ? errors.email : null} />
            <AuthField label="Password" type="password" reveal autoComplete="new-password" placeholder="At least 6 characters" icon="🔒" value={pw} onChange={e => setPw(e.target.value)} hint="At least 6 characters" error={touched ? errors.pw : null} />
            <AuthField label="Confirm password" type="password" reveal autoComplete="new-password" placeholder="Repeat password" icon="🔒" value={confirm} onChange={e => setConfirm(e.target.value)} error={errors.confirm} />

            {/* Terms checkbox */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingTop: 4, cursor: 'pointer', userSelect: 'none' }}>
              <span onClick={() => setAgree(a => !a)} style={{
                position: 'relative', marginTop: 2, width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'all 200ms',
                background: agree ? 'linear-gradient(180deg, var(--accent), var(--accent-2))' : 'oklch(0.27 0.035 230 / 0.8)',
                border: `1px solid ${agree ? 'var(--accent)' : 'var(--border)'}`,
                boxShadow: agree ? '0 0 0 4px oklch(0.82 0.16 195 / 0.18), 0 0 16px oklch(0.82 0.16 195 / 0.5)' : 'inset 0 1px 0 oklch(1 0 0 / 0.04)',
              }}>
                {agree && <span style={{ color: 'var(--accent-ink)', fontSize: 14, fontWeight: 700 }}>✓</span>}
              </span>
              <span style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-dim)' }}>
                I agree to the{' '}
                <span style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Terms of Service</span>
                {' '}and{' '}
                <span style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Privacy Policy</span>
              </span>
            </label>

            <button type="button" onClick={handleSubmit} disabled={(!canSubmit && !loading) || success}
              className="btn-primary tap-target"
              style={{ marginTop: 8, opacity: !canSubmit && !loading ? 0.55 : 1, cursor: !canSubmit ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {success ? '✓ Welcome to Synapse' : loading ? '⏳ Creating account…' : 'Create account →'}
            </button>
          </div>
        </div>

        {/* Sign in link */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--ink-dim)' }}>
          Already have an account?{' '}
          <button onClick={() => onNavigate('signin')} style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
