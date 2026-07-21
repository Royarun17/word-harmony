import React, { useEffect, useState, useCallback, forwardRef } from 'react';

// ── Utility: hash-based gradient for avatars ───────────────────────────────
export function hashGradient(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const h1 = Math.abs(h) % 360;
  const h2 = (h1 + 55) % 360;
  return `linear-gradient(140deg, hsl(${h1} 70% 55%), hsl(${h2} 70% 40%))`;
}

// ── ThemeProvider ──────────────────────────────────────────────────────────
const ThemeCtx = React.createContext(null);
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('neural');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('synapse.theme');
      if (saved === 'neural' || saved === 'library') setThemeState(saved);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('synapse.theme', theme); } catch {}
  }, [theme]);
  const setTheme = useCallback((t) => setThemeState(t), []);
  const toggle = useCallback(() => setThemeState(t => t === 'neural' ? 'library' : 'neural'), []);
  return <ThemeCtx.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeCtx.Provider>;
}
export function useTheme() { return React.useContext(ThemeCtx); }

// ── ThemeSwitcher ──────────────────────────────────────────────────────────
export function ThemeSwitcher() {
  const { theme, toggle } = useTheme() || {};
  if (!toggle) return null;
  return (
    <button onClick={toggle} style={{
      position: 'absolute', top: 16, right: 16, zIndex: 50,
      background: 'oklch(0 0 0 / 0.35)', border: '1px solid oklch(1 0 0 / 0.12)',
      borderRadius: 99, padding: '6px 14px', color: 'var(--ink)',
      fontSize: 11, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)',
      fontFamily: 'var(--font-body)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {theme === 'neural' ? '📚 LIBRARY' : '🧠 NEURAL'}
    </button>
  );
}

// ── PlayerAvatar ───────────────────────────────────────────────────────────
export function PlayerAvatar({ name = '', seed, score, active, buzzing, size = 'md', align = 'center', compact = false }) {
  const dim = size === 'lg' ? 68 : size === 'sm' ? 40 : 52;
  const initials = name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const gradient = hashGradient(seed || name);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
      <div className={active ? 'avatar-active' : ''} style={{ position: 'relative' }}>
        <div className="avatar-ring">
          <div style={{
            width: dim, height: dim, borderRadius: 99,
            background: gradient,
            display: 'grid', placeItems: 'center',
            fontSize: dim * 0.36, fontWeight: 700, color: '#fff',
            fontFamily: 'var(--font-display)',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,.35), 0 6px 16px rgba(0,0,0,.5)',
            animation: buzzing ? 'syn-pulse 0.7s ease-in-out infinite' : undefined,
          }}>{initials}</div>
          {active && (
            <span className="chip chip-accent" style={{
              position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
              letterSpacing: '0.14em', padding: '2px 8px', fontSize: 9, whiteSpace: 'nowrap',
            }}>TURN</span>
          )}
        </div>
      </div>
      {!compact && (
        <div style={{ textAlign: align === 'right' ? 'right' : 'left', minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{name}</div>
          {typeof score === 'number' && (
            <div className="number-tab" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{score.toLocaleString()} pts</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── WordCard ───────────────────────────────────────────────────────────────
export const WordCard = forwardRef(function WordCard({ word, kind = 'normal', selected, dim, small, hint, onClick, style, className }, ref) {
  const w = small ? 92 : 128;
  const h = small ? 130 : 180;
  return (
    <button ref={ref} type="button" onClick={onClick}
      className={`card-surface card-hover tap-target${selected ? ' card-selected' : ''}${kind === 'match' ? ' ring-match' : ''}${className ? ' ' + className : ''}`}
      style={{ ...style, width: w, height: h, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 12, opacity: dim ? 0.6 : 1, cursor: 'pointer', border: 'none', textAlign: 'left', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, opacity: 0.7, color: 'var(--card-ink)' }}>
        <span>{hint || 'SYN'}</span>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', display: 'inline-block', flexShrink: 0 }}/>
      </div>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '0 4px' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: small ? 20 : 26, fontWeight: 700, textAlign: 'center', lineHeight: 1, wordBreak: 'break-words', color: 'var(--card-ink)' }}>
          {word}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, opacity: 0.7, transform: 'rotate(180deg)', color: 'var(--card-ink)' }}>
        <span>{hint || 'SYN'}</span>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', display: 'inline-block' }}/>
      </div>
      {selected && (
        <span aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%)',
          animation: 'syn-shine 1.6s ease-out infinite',
          mixBlendMode: 'screen',
          borderRadius: 'inherit',
        }}/>
      )}
    </button>
  );
});

// ── BuzzButton ─────────────────────────────────────────────────────────────
export function BuzzButton({ onClick, disabled, ready }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="tap-target"
      style={{ position: 'relative', display: 'grid', placeItems: 'center', borderRadius: 99, width: 132, height: 132, border: 'none', background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'transform 150ms', opacity: disabled ? 0.7 : 1 }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      aria-label="Buzz in">
      {ready && !disabled && (<>
        <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 99, boxShadow: '0 0 0 2px var(--accent)', animation: 'syn-ring 1.6s ease-out infinite' }}/>
        <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 99, boxShadow: '0 0 0 2px var(--accent-2)', animation: 'syn-ring 1.6s ease-out 0.5s infinite' }}/>
      </>)}
      <span aria-hidden style={{
        position: 'absolute', inset: 8, borderRadius: 99,
        background: 'radial-gradient(circle at 30% 25%, oklch(from var(--accent) calc(l + .12) c h) 0%, var(--accent) 45%, var(--accent-2) 100%)',
        boxShadow: 'inset 0 4px 10px oklch(1 0 0 / .35), inset 0 -8px 14px oklch(0 0 0 / .3), var(--glow-accent)',
        animation: !disabled ? 'syn-pulse 1.8s ease-in-out infinite' : undefined,
      }}/>
      <span style={{ position: 'relative', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '0.18em', color: 'var(--accent-ink)', textShadow: '0 1px 0 rgba(255,255,255,.4)' }}>
        BUZZ
      </span>
    </button>
  );
}

// ── TimerRing ──────────────────────────────────────────────────────────────
export function TimerRing({ progress, seconds }) {
  const p = Math.max(0, Math.min(100, progress));
  return (
    <div className="timer-ring number-tab" style={{ '--p': p }}>
      <span style={{ position: 'relative', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{seconds}</span>
    </div>
  );
}

// ── Dialog ─────────────────────────────────────────────────────────────────
export function Dialog({ open, onClose, title, children, footer, tone = 'default', dismissible = true }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && dismissible) onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, dismissible]);
  if (!open) return null;
  const toneColor = tone === 'danger' ? 'var(--danger)' : tone === 'win' ? 'var(--win)' : 'var(--accent)';
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} role="dialog" aria-modal="true">
      <button type="button" onClick={() => dismissible && onClose?.()} aria-label="Close backdrop" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, oklch(0 0 0 / .55), oklch(0 0 0 / .8))', backdropFilter: 'blur(6px)', border: 'none', cursor: 'pointer', animation: 'syn-rise 220ms ease-out both' }}/>
      <div className="panel" style={{ position: 'relative', width: '92%', maxWidth: 380, padding: 20, marginBottom: 24, borderRadius: 28, animation: 'syn-pop 320ms cubic-bezier(.2,.8,.2,1) both', boxShadow: `0 24px 60px rgba(0,0,0,.55), 0 0 0 1px ${toneColor}55, 0 0 40px ${toneColor}33` }}>
        {dismissible && (
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 99, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>✕</button>
        )}
        {title && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.28em', fontWeight: 600, color: toneColor, textTransform: 'uppercase' }}>SYNAPSE</div>
            <h2 style={{ marginTop: 4, fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1.2 }}>{title}</h2>
          </div>
        )}
        <div style={{ fontSize: 14, color: 'var(--ink-dim)' }}>{children}</div>
        {footer && <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

// ── Confetti ───────────────────────────────────────────────────────────────
export function Confetti({ count = 40 }) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    setPieces(Array.from({ length: count }, () => ({
      cx: (Math.random() - 0.5) * 320,
      hue: Math.floor(Math.random() * 360),
      delay: Math.random() * 0.6,
      dur: 1.6 + Math.random() * 1.4,
    })));
  }, [count]);
  return (
    <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 100 }}>
      {pieces.map((p, i) => (
        <span key={i} style={{
          position: 'absolute', left: '50%', top: 32,
          width: 8, height: 12, borderRadius: 2,
          background: `hsl(${p.hue} 85% 60%)`,
          transform: 'translate(-50%,0)',
          animation: `syn-confetti ${p.dur}s ${p.delay}s cubic-bezier(.2,.6,.2,1) forwards`,
          '--cx': `${p.cx}px`,
        }}/>
      ))}
    </div>
  );
}

// ── SectionHeader ──────────────────────────────────────────────────────────
export function SectionHeader({ eyebrow, title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
      <div>
        {eyebrow && <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4, color: 'var(--accent)' }}>{eyebrow}</div>}
        <h2 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.05, fontFamily: 'var(--font-display)' }}>{title}</h2>
      </div>
      {right}
    </div>
  );
}

// ── States ─────────────────────────────────────────────────────────────────
function StateFrame({ icon, tone, eyebrow, title, body, actions }) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 99, display: 'grid', placeItems: 'center', marginBottom: 16, background: `oklch(from ${tone} l c h / .18)`, border: `1px solid oklch(from ${tone} l c h / .5)`, boxShadow: `0 0 30px oklch(from ${tone} l c h / .35)`, color: tone, fontSize: 24 }}>{icon}</div>
      <div style={{ fontSize: 10, letterSpacing: '0.32em', fontWeight: 600, color: tone, textTransform: 'uppercase' }}>{eyebrow}</div>
      <h3 style={{ marginTop: 4, fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 700 }}>{title}</h3>
      {body && <p style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-dim)', maxWidth: 280 }}>{body}</p>}
      {actions && <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
    </div>
  );
}
export function LoadingState({ label = 'Warming up the table…' }) {
  return <StateFrame tone="var(--accent)" icon="⏳" eyebrow="LOADING" title="Just a moment" body={label}/>;
}
export function SuccessState({ title = 'Locked in', body = 'Your play has been recorded. Waiting for other players…', actions }) {
  return <StateFrame tone="var(--win)" icon="✓" eyebrow="SUCCESS" title={title} body={body} actions={actions}/>;
}
export function ErrorState({ title = "That didn't work", body = 'Something interrupted the round. Try again in a moment.', actions }) {
  return <StateFrame tone="var(--danger)" icon="⚠" eyebrow="ERROR" title={title} body={body} actions={actions}/>;
}
export function OfflineState({ actions }) {
  return <StateFrame tone="var(--warn)" icon="📶" eyebrow="OFFLINE" title="Connection lost" body="We paused the match. It will resume automatically when you're back online." actions={actions}/>;
}
