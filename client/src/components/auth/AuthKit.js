import React, { useEffect, useRef, useState } from 'react';
import logo from '../../assets/auth/welcome-logo.webp';
import { BackArrowIcon, EyeIcon, EyeOffIcon, Laurel, Sparkle } from './AuthIcons';
import styles from './auth.module.css';

// Shared pieces for the Welcome, Sign Up and Sign In pages.
//
// Each page's background is its own reference picture with the UI and figures
// removed. The figures go back on top at exactly the place they were painted,
// so everything shares one "stage": the 1672x941 reference, scaled by --s and
// offset by --sx/--sy (see auth.module.css). Words and controls are real UI.

export { styles as authStyles };

// A layer placed in reference coordinates: x, y and width in reference pixels.
export function stageStyle(x, y, w, extra) {
  return { '--x': x, '--y': y, '--w': w, ...extra };
}

export function AuthScene({ background, figures = [], onBack, children }) {
  return (
    <main className={styles.scene}>
      <img className={styles.bg} src={background} alt="" aria-hidden />
      {figures.map(f => (
        <img key={f.src} className={styles.layer} style={stageStyle(f.x, f.y, f.w)} src={f.src} alt={f.alt || ''} aria-hidden={f.alt ? undefined : true} />
      ))}
      {onBack && (
        <button type="button" className={styles.back} onClick={onBack}>
          <BackArrowIcon /> Back
        </button>
      )}
      {children}
    </main>
  );
}

export function Logo({ className = '', style }) {
  return <img className={`${styles.logo} ${className}`} style={style} src={logo} alt="Word Harmony" />;
}

// How much of the layout viewport the on-screen keyboard is covering.
function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);
  return inset;
}

// The cream form card: logo above it (with its own space), a heading that stays
// put, a scrolling middle for the fields, and pinned actions at the bottom so
// the main button is always reachable — also while the keyboard is open.
export function AuthPanel({ title, variant, footer, children }) {
  const kb = useKeyboardInset();
  const kbOpen = kb > 80;
  const bodyRef = useRef(null);

  // Keep the field being typed in visible inside the scrolling middle.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return undefined;
    const onFocus = e => {
      if (!(e.target instanceof HTMLElement)) return;
      const target = e.target.closest(`.${styles.fieldWrap}`) || e.target;
      window.setTimeout(() => target.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 260);
    };
    body.addEventListener('focusin', onFocus);
    return () => body.removeEventListener('focusin', onFocus);
  }, []);

  return (
    <div
      className={`${styles.column} ${variant ? styles[variant] : ''}${kbOpen ? ` ${styles.kbOpen}` : ''}`}
      style={{ '--kb': `${kb}px` }}
    >
      <Logo className={styles.panelLogo} />
      <section className={styles.panel} aria-labelledby="auth-title">
        <header className={styles.panelHead}>
          <div className={styles.headRow}>
            <Laurel className={styles.headLaurel} />
            <h1 id="auth-title">{title}</h1>
            <Laurel className={styles.headLaurel} flip />
          </div>
          <Divider />
        </header>
        <div className={styles.panelBody} ref={bodyRef}>{children}</div>
        {footer && <footer className={styles.panelFoot}>{footer}</footer>}
      </section>
    </div>
  );
}

export function Divider({ className = '' }) {
  return (
    <div className={`${styles.divider} ${className}`} aria-hidden>
      <span /><Sparkle className={styles.dividerStar} /><span />
    </div>
  );
}

export function AuthField({
  id, icon, label, type = 'text', value, onChange, onBlur, error, hint,
  autoComplete, inputMode, revealable = false, autoFocus, enterKeyHint,
}) {
  const [shown, setShown] = useState(false);
  const describedBy = [error && `${id}-error`, hint && !error && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={styles.fieldWrap}>
      <label className={styles.srOnly} htmlFor={id}>{label}</label>
      <div className={`${styles.field}${error ? ` ${styles.fieldError}` : ''}`}>
        <span className={styles.fieldIcon} aria-hidden>{icon}</span>
        <input
          id={id}
          type={revealable && shown ? 'text' : type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={label}
          autoComplete={autoComplete}
          inputMode={inputMode}
          enterKeyHint={enterKeyHint}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          spellCheck={false}
          autoCapitalize={type === 'email' || type === 'password' ? 'none' : undefined}
        />
        {revealable && (
          <button
            type="button"
            className={styles.reveal}
            onClick={() => setShown(s => !s)}
            aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={shown}
            aria-controls={id}
          >
            {shown ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        )}
      </div>
      {error && <p id={`${id}-error`} className={styles.fieldMsg}>{error}</p>}
      {hint && !error && <p id={`${id}-hint`} className={`${styles.fieldMsg} ${styles.fieldHint}`}>{hint}</p>}
    </div>
  );
}

export function Alert({ tone = 'error', children }) {
  return <div className={`${styles.alert} ${styles[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}

// The raised gold primary button, laurels either side of the label.
export function GoldButton({ icon, children, laurels = true, className = '', busy, style, ...rest }) {
  return (
    <button className={`${styles.gold} ${className}`} style={style} aria-busy={busy || undefined} {...rest}>
      {laurels && <Laurel className={styles.btnLaurel} />}
      <span className={styles.goldLabel}>
        {busy ? <span className={styles.spinner} aria-hidden /> : icon}
        <span>{children}</span>
      </span>
      {laurels && <Laurel className={styles.btnLaurel} flip />}
    </button>
  );
}

export function PlumButton({ icon, children, className = '', style, ...rest }) {
  return (
    <button className={`${styles.plum} ${className}`} style={style} {...rest}>
      {icon}<span>{children}</span>
    </button>
  );
}

export function LinkButton({ children, className = '', ...rest }) {
  return <button type="button" className={`${styles.link} ${className}`} {...rest}>{children}</button>;
}
