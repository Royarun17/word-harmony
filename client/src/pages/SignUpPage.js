import React, { useEffect, useMemo, useState } from 'react';
import {
  auth,
  firebaseConfigured,
  createUserWithEmailAndPassword,
  signInWithGoogle,
} from '../utils/firebase';
import {
  AuthScene, AuthPanel, AuthField, Alert, GoldButton, LinkButton, authStyles as styles,
} from '../components/auth/AuthKit';
import { UserIcon, MailIcon, LockIcon, UserPlusIcon, GoogleIcon } from '../components/auth/AuthIcons';
import background from '../assets/auth/bg-signup.webp';
import mascot from '../assets/auth/signup-mascot.webp';
import cardFan from '../assets/auth/fan-signup.webp';

// Figures at their painted positions in the 1672x941 reference.
const FIGURES = [
  { src: mascot, x: 170, y: 150, w: 500 },
  { src: cardFan, x: 75, y: 655, w: 555 },
];

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return online;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signUpError(code) {
  switch (code) {
    case 'auth/email-already-in-use': return 'An account with this email already exists. Try signing in.';
    case 'auth/invalid-email': return 'That email address doesn’t look right.';
    case 'auth/weak-password': return 'Choose a stronger password (at least 6 characters).';
    case 'auth/network-request-failed': return 'Network problem. Check your connection and try again.';
    case 'auth/too-many-requests': return 'Too many attempts. Wait a moment and try again.';
    default: return 'Could not create your account. Please try again.';
  }
}

export default function SignUpPage({ onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const online = useOnline();

  const errors = useMemo(() => ({
    name: !name.trim() ? 'Enter your name.' : name.trim().length > 24 ? 'Keep it to 24 characters or fewer.' : '',
    email: !email.trim() ? 'Enter your email.' : !EMAIL_RE.test(email.trim()) ? 'Enter a valid email, like you@example.com.' : '',
    password: !password ? 'Create a password.' : password.length < 6 ? 'Use at least 6 characters.' : '',
    confirmPassword: !confirmPassword ? 'Confirm your password.' : confirmPassword !== password ? 'Passwords don’t match.' : '',
    agreed: agreed ? '' : 'Please agree to the terms to continue.',
  }), [name, email, password, confirmPassword, agreed]);

  // Show a field's error once it has been left, or after a submit attempt.
  const show = key => ((submitted || touched[key]) ? errors[key] : '');
  const blur = key => () => setTouched(t => ({ ...t, [key]: true }));
  const change = setter => event => { setter(event.target.value); if (formError) setFormError(''); };

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (loading || success) return;
    const firstInvalid = ['name', 'email', 'password', 'confirmPassword', 'agreed'].find(k => errors[k]);
    if (firstInvalid) {
      const ids = { name: 'signup-name', email: 'signup-email', password: 'signup-password', confirmPassword: 'signup-confirm', agreed: 'signup-terms' };
      document.getElementById(ids[firstInvalid])?.focus();
      return;
    }
    if (!firebaseConfigured) { setFormError('Accounts aren’t available in this build yet (Firebase isn’t configured).'); return; }
    if (!online) { setFormError('You’re offline. Reconnect to create your account.'); return; }

    setLoading(true);
    setFormError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      setSuccess(true);
      window.setTimeout(() => onNavigate('profileSetup', { user: result.user, name: name.trim() }), 650);
    } catch (error) {
      setFormError(signUpError(error.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    if (googleLoading) return;
    if (!firebaseConfigured) { setFormError('Accounts aren’t available in this build yet (Firebase isn’t configured).'); return; }
    if (!online) { setFormError('You’re offline. Reconnect to continue.'); return; }
    setGoogleLoading(true);
    setFormError('');
    try {
      const result = await signInWithGoogle();
      onNavigate('checkProfile', { user: result.user });
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setFormError('Google sign-in could not be completed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  const footer = (
    <>
      <GoldButton type="submit" form="signup-form" className={styles.submit} icon={<UserPlusIcon />} busy={loading} disabled={success}>
        {success ? 'Account Created!' : loading ? 'Creating Account…' : 'Create Account'}
      </GoldButton>
      <div className={styles.footRow}>
        <p>Already have an account? <LinkButton onClick={() => onNavigate('signin')}>Sign In</LinkButton></p>
        <span className={styles.altOr} aria-hidden>or</span>
        <button
          type="button"
          className={styles.googleRound}
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
          aria-busy={googleLoading || undefined}
          aria-label={googleLoading ? 'Connecting to Google' : 'Continue with Google'}
          title="Continue with Google"
        >
          {googleLoading ? <span className={styles.spinner} aria-hidden /> : <GoogleIcon />}
        </button>
      </div>
    </>
  );

  return (
    <AuthScene background={background} figures={FIGURES} onBack={() => onNavigate('welcome')}>
      <AuthPanel title="Create Account" footer={footer}>
        <form id="signup-form" className={styles.form} onSubmit={handleSubmit} noValidate>
          {!online && <Alert tone="info">You’re offline. Reconnect to continue.</Alert>}
          {formError && <Alert>{formError}</Alert>}
          {success && <Alert tone="success">Account created! Setting up your profile…</Alert>}

          <AuthField id="signup-name" icon={<UserIcon />} label="Name" autoComplete="nickname" enterKeyHint="next"
            value={name} onChange={change(setName)} onBlur={blur('name')} error={show('name')} />
          <AuthField id="signup-email" icon={<MailIcon />} label="Email" type="email" inputMode="email" autoComplete="email" enterKeyHint="next"
            value={email} onChange={change(setEmail)} onBlur={blur('email')} error={show('email')} />
          <AuthField id="signup-password" icon={<LockIcon />} label="Password" type="password" revealable autoComplete="new-password" enterKeyHint="next"
            value={password} onChange={change(setPassword)} onBlur={blur('password')} error={show('password')}
            hint={password && password.length < 6 ? 'At least 6 characters.' : ''} />
          <AuthField id="signup-confirm" icon={<LockIcon />} label="Confirm Password" type="password" revealable autoComplete="new-password" enterKeyHint="done"
            value={confirmPassword} onChange={change(setConfirmPassword)} onBlur={blur('confirmPassword')} error={show('confirmPassword')} />

          <div className={styles.fieldWrap}>
            <label className={styles.check}>
              <input id="signup-terms" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                aria-invalid={Boolean(show('agreed'))} aria-describedby={show('agreed') ? 'signup-terms-error' : undefined} />
              I agree to the Terms
            </label>
            {show('agreed') && <p id="signup-terms-error" className={styles.fieldMsg}>{show('agreed')}</p>}
          </div>
        </form>
      </AuthPanel>
    </AuthScene>
  );
}
