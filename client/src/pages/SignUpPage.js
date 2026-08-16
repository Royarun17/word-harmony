import React, { useEffect, useMemo, useState } from 'react';
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithGoogle,
} from '../utils/firebase';
import cleanTabletop from '../assets/signup/tabletop-base-v2.webp';
import mayaMascot from '../assets/signup/maya-bright-glow-radiant.webp';
import topLeftPlant from '../assets/signup/plant-top-left.webp';
import topRightPlant from '../assets/signup/plant-top-right-v2.webp';
import bookStack from '../assets/signup/book-stack.webp';
import snackBowl from '../assets/signup/snack-bowl.webp';
import leftPapers from '../assets/signup/left-papers.webp';
import notebook from '../assets/signup/notebook-v1.webp';
import pencil from '../assets/signup/pencil-v2.webp';
import coffeeCup from '../assets/signup/coffee-cup.webp';
import './SignUpPage.css';

function useOnline() {
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

function SignUpField({ id, label, type = 'text', value, onChange, placeholder, autoComplete, error }) {
  return (
    <label className={`wh-signup-field${error ? ' wh-signup-field--error' : ''}`} htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <small id={`${id}-error`}>{error}</small>}
    </label>
  );
}

function GoogleMark() {
  return <span className="wh-google-mark" aria-hidden="true" />;
}

export default function SignUpPage({ onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const online = useOnline();

  const errors = useMemo(() => ({
    name: !name.trim() ? 'Enter your display name' : '',
    email: !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email' : '',
    password: password.length < 6 ? 'Use at least 6 characters' : '',
    confirmPassword: !confirmPassword
      ? 'Confirm your password'
      : confirmPassword !== password
        ? 'Passwords do not match'
        : '',
  }), [name, email, password, confirmPassword]);

  const canSubmit = online
    && agreed
    && Object.values(errors).every((error) => !error);

  const clearFormError = () => {
    if (formError) setFormError('');
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit || loading || success) return;

    setLoading(true);
    setFormError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      setSuccess(true);
      window.setTimeout(() => onNavigate('profileSetup', {
        user: result.user,
        name: name.trim(),
      }), 650);
    } catch (error) {
      setFormError(error.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    if (!online || googleLoading) return;
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

  return (
    <main
      className="wh-signup"
      style={{
        '--signup-clean-tabletop': `url(${cleanTabletop})`,
      }}
    >
      <div className="wh-signup__scene" aria-hidden="true" />

      <div className="wh-signup__props" aria-hidden="true">
        <img className="wh-signup-prop wh-signup-prop--plant-left" src={topLeftPlant} alt="" />
        <img className="wh-signup-prop wh-signup-prop--plant-right" src={topRightPlant} alt="" />
        <img className="wh-signup-prop wh-signup-prop--books" src={bookStack} alt="" />
        <img className="wh-signup-prop wh-signup-prop--left-papers" src={leftPapers} alt="" />
        <img className="wh-signup-prop wh-signup-prop--snacks" src={snackBowl} alt="" />
        <img className="wh-signup-prop wh-signup-prop--notebook" src={notebook} alt="" />
        <img className="wh-signup-prop wh-signup-prop--pencil" src={pencil} alt="" />
        <img className="wh-signup-prop wh-signup-prop--coffee" src={coffeeCup} alt="" />
      </div>

      <button
        className="wh-signup__back"
        type="button"
        aria-label="Back to Welcome"
        onClick={() => onNavigate('welcome')}
      />

      <section className="wh-signup__mascot" aria-label="Maya holding Bright, Glow and Radiant cards">
        <img src={mayaMascot} alt="Maya holding Bright, Glow and Radiant cards" />
      </section>

      <div className="wh-signup__ribbon" aria-hidden="true">JOIN THE TABLE</div>

      <section className="wh-signup-card" aria-labelledby="signup-title">
        <header className="wh-signup-card__header">
          <span className="wh-signup-card__spark wh-signup-card__spark--left" aria-hidden="true" />
          <h1 id="signup-title">CREATE ACCOUNT</h1>
          <span className="wh-signup-card__spark wh-signup-card__spark--right" aria-hidden="true" />
        </header>

        {!online && <div className="wh-signup-alert" role="alert">You’re offline. Reconnect to continue.</div>}
        {formError && <div className="wh-signup-alert wh-signup-alert--error" role="alert">{formError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="wh-signup-grid">
            <SignUpField
              id="signup-display-name"
              label="DISPLAY NAME"
              value={name}
              onChange={(event) => { setName(event.target.value); clearFormError(); }}
              placeholder="Maya"
              autoComplete="name"
              error={touched ? errors.name : ''}
            />
            <SignUpField
              id="signup-email"
              label="EMAIL"
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); clearFormError(); }}
              placeholder="player@example.com"
              autoComplete="email"
              error={touched ? errors.email : ''}
            />
            <SignUpField
              id="signup-password"
              label="PASSWORD"
              type="password"
              value={password}
              onChange={(event) => { setPassword(event.target.value); clearFormError(); }}
              placeholder="••••••••"
              autoComplete="new-password"
              error={touched ? errors.password : ''}
            />
            <SignUpField
              id="signup-confirm-password"
              label="CONFIRM PASSWORD"
              type="password"
              value={confirmPassword}
              onChange={(event) => { setConfirmPassword(event.target.value); clearFormError(); }}
              placeholder="••••••••"
              autoComplete="new-password"
              error={touched ? errors.confirmPassword : ''}
            />
          </div>

          <label className="wh-signup-terms">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            <span aria-hidden="true">✓</span>
            <strong>I AGREE TO THE TERMS</strong>
          </label>

          <button
            className="wh-signup-button wh-signup-button--primary"
            type="submit"
            aria-disabled={!canSubmit || loading || success}
          >
            {success ? 'ACCOUNT CREATED!' : loading ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="wh-signup-divider" aria-hidden="true"><span>OR</span></div>

        <button
          className="wh-signup-button wh-signup-button--google"
          type="button"
          onClick={handleGoogleSignUp}
          disabled={!online || googleLoading}
        >
          <GoogleMark />
          {googleLoading ? 'CONNECTING…' : 'CONTINUE WITH GOOGLE'}
        </button>

        <p className="wh-signup-signin">
          Already playing?{' '}
          <button type="button" onClick={() => onNavigate('signin')}>SIGN IN</button>
        </p>
      </section>
    </main>
  );
}
