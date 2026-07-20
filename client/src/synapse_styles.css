import React, { useEffect, useState, useCallback } from 'react';

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
  const [theme, setTheme] = useState('neural');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('synapse.theme');
      if (saved === 'neural' || saved === 'library') setTheme(saved);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('synapse.theme', theme); } catch {}
  }, [theme]);
  const toggle = useCallback(() => setTheme(t => t === 'neural' ? 'library' : 'neural'), []);
  return <ThemeCtx.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeCtx.Provider>;
}
export function useTheme() { return React.useContext(ThemeCtx); }

// ── ThemeSwitcher ──────────────────────────────────────────────────────────
export function ThemeSwitcher() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} style={{
      position: 'absolute', top: 16, right: 16, zIndex: 50,
      background: 'oklch(0 0 0 / 0.35)', border: '1px solid oklch(1 0 0 / 0.12)',
      borderRadius: 99, padding: '6px 12px', color: 'var(--ink)',
      fontSize: 11, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)',
      fontFamily: 'var(--font-body)', letterSpacing: '0.06em',
    }}>
      {theme === 'neural' ? '📚 Library' : '🧠 Neural'}
    </button>
  );
}

// ── PlayerAvatar ───────────────────────────────────────────────────────────
export function PlayerAvatar({ name = '', seed, score, active, buzzing, size = 'md', align = 'center', compact = false }) {
  const dim = size === 'lg' ? 64 : size === 'sm' ? 36 : 48;
  const initials = name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const gradient = hashGradient(seed || name);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
      <div className={`syn-avatar-ring${active ? ' active' : ''}`} style={{ position: 'relative' }}>
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
          <span className="syn-chip syn-chip-accent" style={{
            position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
            letterSpacing: '0.14em', padding: '2px 8px', fontSize: 9, whiteSpace: 'nowrap',
          }}>TURN</span>
        )}
      </div>
      {!compact && (
        <div style={{ textAlign: align === 'right' ? 'right' : 'left', minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{name}</div>
          {typeof score === 'number' && (
            <div className="num" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{score.toLocaleString()} pts</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── WordCard ───────────────────────────────────────────────────────────────
export function WordCard({ word, kind = 'normal', selected, dim, small, hint, onClick, style }) {
  const w = small ? 88 : 120;
  const h = small ? 126 : 176;
  return (
    <button onClick={onClick} style={style} className={`syn-card tap${selected ? ' selected' : ''}${kind === 'match' ? ' match' : ''}${dim ? '' : ''}`}
      style={{ ...style, width: w, height: h, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 12, opacity: dim ? 0.6 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, opacity: 0.7 }}>
        <span>{hint || 'SYN'}</span>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', display: 'inline-block' }}/>
      </div>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '0 4px' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: small ? 20 : 26, fontWeight: 700, textAlign: 'center', lineHeight: 1, wordBreak: 'break-word', color: 'var(--card-ink)' }}>
          {word}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, opacity: 0.7, transform: 'rotate(180deg)' }}>
        <span>{hint || 'SYN'}</span>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', display: 'inline-block' }}/>
      </div>
      {selected && (
        <span style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%)',
          animation: 'syn-shine 1.6s ease-out infinite',
          mixBlendMode: 'screen',
        }}/>
      )}
    </button>
  );
}

// ── BuzzButton ─────────────────────────────────────────────────────────────
export function BuzzButton({ onClick, disabled, ready }) {
  return (
    <button onClick={onClick} disabled={disabled} className="tap"
      style={{ position: 'relative', display: 'grid', placeItems: 'center', borderRadius: 99, width: 132, height: 132, border: 'none', background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'transform 150ms', opacity: disabled ? 0.7 : 1 }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      aria-label="Buzz in">
      {ready && !disabled && (<>
        <span style={{ position: 'absolute', inset: 0, borderRadius: 99, boxShadow: '0 0 0 2px var(--accent)', animation: 'syn-ring 1.6s ease-out infinite' }}/>
        <span style={{ position: 'absolute', inset: 0, borderRadius: 99, boxShadow: '0 0 0 2px var(--accent-2)', animation: 'syn-ring 1.6s ease-out 0.5s infinite' }}/>
      </>)}
      <span style={{
        position: 'absolute', inset: 8, borderRadius: 99,
        background: 'radial-gradient(circle at 30% 25%, oklch(0.92 0.16 195) 0%, var(--accent) 45%, var(--accent-2) 100%)',
        boxShadow: 'inset 0 4px 10px oklch(1 0 0 / 0.35), inset 0 -8px 14px oklch(0 0 0 / 0.3), var(--glow-accent)',
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
    <div className="syn-timer-ring num" style={{ '--p': p }}>
      <span style={{ position: 'relative', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{seconds}</span>
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
    <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {pieces.map((p, i) => (
        <span key={i} style={{
          position: 'absolute', left: '50%', top: 32,
          width: 8, height: 12, borderRadius: 2,
          background: `hsl(${p.hue} 85% 60%)`,
          transform: 'translate(-50%,0)',
          animation: `syn-confetti ${p.dur}s ${p.delay}s cubic-bezier(.2,.6,.2,1) forwards`,
          '--cx': `${p.cx}px`,
          boxShadow: '0 1px 2px rgba(0,0,0,.2)',
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

// ── BackCardFace (face-down card) ──────────────────────────────────────────
export function BackCard({ width = 52, height = 72, rotate = 0, style: extraStyle }) {
  return (
    <div style={{
      ...extraStyle,
      width, height,
      borderRadius: 10,
      background: 'linear-gradient(160deg, var(--surface-2), var(--surface))',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
      transform: `rotate(${rotate}deg)`,
      flexShrink: 0,
    }}/>
  );
}
