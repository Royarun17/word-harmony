import React, { useState } from 'react';
import {
  auth,
  firebaseConfigured,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from '../utils/firebase';
import {
  AuthScene, AuthPanel, AuthField, Alert, GoldButton, LinkButton, authStyles as styles,
} from '../components/auth/AuthKit';
import { MailIcon, LockIcon, SignInIcon } from '../components/auth/AuthIcons';
import { useOnline, EMAIL_RE } from './SignUpPage';
import background from '../assets/auth/bg-signin.webp';
import mascot from '../assets/auth/signin-mascot.webp';
import cardFan from '../assets/auth/fan-signin.webp';

// Figures at their painted positions in the 1672x941 reference.
const FIGURES = [
  { src: mascot, x: 120, y: 160, w: 595 },
  { src: cardFan, x: 45, y: 630, w: 635 },
];

const NOT_CONFIGURED = 'Sign-in isn’t available in this build yet (Firebase isn’t configured).';

function signInError(code) {
  switch (code) {
    case 'auth/user-not-found': return 'No account with this email. Check it, or create an account.';
    case 'auth/wrong-password': return 'Wrong password. Try again.';
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    case 'auth/invalid-email': return 'That email address doesn’t look right.';
    case 'auth/user-disabled': return 'This account has been disabled.';
    case 'auth/too-many-requests': return 'Too many attempts. Wait a moment, or reset your password.';
    case 'auth/network-request-failed': return 'Network problem. Check your connection and try again.';
    default: return 'Sign in failed. Try again.';
  }
}

export default function SignInPage({ onNavigate }) {
  const [mode, setMode] = useState('signin'); // signin | reset
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authError, setAuthError] = useState('');
  const [resetSent, setResetSent] = useState('');
  const online = useOnline();

  const emailError = !email.trim() ? 'Enter your email.' : !EMAIL_RE.test(email.trim()) ? 'Enter a valid email, like you@example.com.' : '';
  const pwError = !pw ? 'Enter your password.' : '';
  const change = setter => e => { setter(e.target.value); if (authError) setAuthError(''); };

  function switchMode(next) {
    setMode(next); setSubmitted(false); setAuthError(''); setResetSent(''); setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (loading || success) return;
    if (emailError) { document.getElementById('signin-email')?.focus(); return; }
    if (pwError) { document.getElementById('signin-password')?.focus(); return; }
    if (!firebaseConfigured) { setAuthError(NOT_CONFIGURED); return; }
    if (!online) { setAuthError('You’re offline. Reconnect to sign in.'); return; }
    setAuthError(''); setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pw);
      setSuccess(true);
      setTimeout(() => onNavigate('checkProfile', { user: result.user }), 650);
    } catch (err) {
      setAuthError(signInError(err.code));
    }
    setLoading(false);
  }

  async function handleReset(e) {
    e.preventDefault();
    setSubmitted(true);
    if (loading) return;
    if (emailError) { document.getElementById('reset-email')?.focus(); return; }
    if (!firebaseConfigured) { setAuthError(NOT_CONFIGURED); return; }
    if (!online) { setAuthError('You’re offline. Reconnect to reset your password.'); return; }
    setAuthError(''); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(email.trim());
    } catch (err) {
      // Don't reveal whether an account exists for this email.
      if (err.code === 'auth/user-not-found') setResetSent(email.trim());
      else setAuthError(err.code === 'auth/invalid-email' ? 'That email address doesn’t look right.' : signInError(err.code));
    }
    setLoading(false);
  }

  const signInFooter = (
    <>
      <GoldButton type="submit" form="signin-form" className={styles.submit} icon={<SignInIcon />} busy={loading} disabled={success}>
        {success ? 'Signed In!' : loading ? 'Signing In…' : 'Sign In'}
      </GoldButton>
      <div className={styles.footRow}>
        <p>New here? <LinkButton onClick={() => onNavigate('signup')}>Create Account</LinkButton></p>
      </div>
    </>
  );
  const resetFooter = (
    <>
      <GoldButton type="submit" form="reset-form" className={styles.submit} icon={<MailIcon />} busy={loading}>
        {loading ? 'Sending…' : resetSent ? 'Send Again' : 'Send Reset Link'}
      </GoldButton>
      <div className={styles.footRow}>
        <p>Remembered it? <LinkButton onClick={() => switchMode('signin')}>Back to Sign In</LinkButton></p>
      </div>
    </>
  );

  return (
    <AuthScene
      background={background}
      figures={FIGURES}
      onBack={() => (mode === 'reset' ? switchMode('signin') : onNavigate('welcome'))}
    >
      {mode === 'signin' ? (
        <AuthPanel title="Welcome Back" variant="signin" footer={signInFooter}>
          <form id="signin-form" className={styles.form} onSubmit={handleSubmit} noValidate>
            {!online && <Alert tone="info">You’re offline. Reconnect to sign in.</Alert>}
            {authError && <Alert>{authError}</Alert>}
            {success && <Alert tone="success">Signed in! Loading your profile…</Alert>}

            <AuthField id="signin-email" icon={<MailIcon />} label="Email" type="email" inputMode="email" autoComplete="email" enterKeyHint="next"
              value={email} onChange={change(setEmail)} error={submitted ? emailError : ''} />
            <AuthField id="signin-password" icon={<LockIcon />} label="Password" type="password" revealable autoComplete="current-password" enterKeyHint="go"
              value={pw} onChange={change(setPw)} error={submitted ? pwError : ''} />

            <div className={styles.forgot}>
              <LinkButton onClick={() => switchMode('reset')}>Forgot Password?</LinkButton>
            </div>
          </form>
        </AuthPanel>
      ) : (
        <AuthPanel title="Reset Password" variant="signin" footer={resetFooter}>
          <form id="reset-form" className={styles.form} onSubmit={handleReset} noValidate>
            {authError && <Alert>{authError}</Alert>}
            {resetSent ? (
              <Alert tone="success">
                If an account exists for {resetSent}, a reset link is on its way. Check your inbox and spam folder.
              </Alert>
            ) : (
              <p className={styles.lead}>Enter your email and we’ll send you a link to choose a new password.</p>
            )}
            <AuthField id="reset-email" icon={<MailIcon />} label="Email" type="email" inputMode="email" autoComplete="email" enterKeyHint="send"
              value={email} onChange={change(setEmail)} error={submitted ? emailError : ''} autoFocus />
          </form>
        </AuthPanel>
      )}
    </AuthScene>
  );
}
