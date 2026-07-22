import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { auth } from '../utils/firebase';
import { ThemeSwitcher, useTheme } from '../SynapseComponents';

const AVATARS = ['😎','🧠','🦊','🐯','🐸','🦁','🐧','🐉','🦋','🐺','🦅','🐬','🎭','🧩','⚡','🔥'];
const TAKEN = new Set(['admin','synapse','wordmaster','neo','test']);
const COUNTRIES = [
  { code:'US', flag:'🇺🇸', name:'United States' },
  { code:'GB', flag:'🇬🇧', name:'United Kingdom' },
  { code:'IN', flag:'🇮🇳', name:'India' },
  { code:'AU', flag:'🇦🇺', name:'Australia' },
  { code:'CA', flag:'🇨🇦', name:'Canada' },
  { code:'DE', flag:'🇩🇪', name:'Germany' },
  { code:'FR', flag:'🇫🇷', name:'France' },
  { code:'BR', flag:'🇧🇷', name:'Brazil' },
  { code:'JP', flag:'🇯🇵', name:'Japan' },
  { code:'KR', flag:'🇰🇷', name:'South Korea' },
  { code:'ZA', flag:'🇿🇦', name:'South Africa' },
  { code:'XX', flag:'🌍', name:'Other' },
];

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--ink-dim)' }}>
      {children}
    </div>
  );
}

function UsernameInput({ value, onChange, avail, disabled }) {
  const [focused, setFocused] = useState(false);
  const invalid = avail.kind === 'err';
  const ok = avail.kind === 'ok';
  return (
    <div style={{
      marginTop: 12, position: 'relative', display: 'flex', alignItems: 'center', borderRadius: 999,
      background: 'oklch(0.22 0.03 232 / 0.85)',
      border: `1px solid ${invalid ? 'var(--danger)' : (ok || focused) ? 'var(--accent)' : 'var(--border)'}`,
      boxShadow: invalid
        ? '0 0 0 4px oklch(0.68 0.22 22 / 0.18)'
        : (focused || ok) ? '0 0 0 4px oklch(0.82 0.16 195 / 0.18), 0 0 24px oklch(0.82 0.16 195 / 0.25)'
        : 'inset 0 1px 0 oklch(1 0 0 / 0.03)',
      transition: 'box-shadow 200ms, border-color 200ms',
    }}>
      <span style={{ paddingLeft: 16, paddingRight: 4, color: focused ? 'var(--accent)' : 'var(--ink-mute)', display: 'flex', alignItems: 'center', fontSize: 18 }}>👤</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value.slice(0, 20))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={20} autoComplete="off" autoCapitalize="off" spellCheck={false}
        disabled={disabled}
        placeholder="e.g. WordMaster_Alex"
        style={{ flex: 1, background: 'transparent', outline: 'none', padding: '16px 12px', fontSize: 16, fontFamily: 'var(--font-body)', color: 'var(--ink)', minHeight: 56, border: 'none' }}
      />
      <span style={{ paddingRight: 16, paddingLeft: 4, display: 'flex', alignItems: 'center', fontSize: 16 }}>
        {avail.kind === 'checking' && <span style={{ color: 'var(--ink-mute)', animation: 'syn-pulse 1s ease-in-out infinite' }}>⏳</span>}
        {avail.kind === 'ok'       && <span style={{ color: 'var(--accent)' }}>✓</span>}
        {avail.kind === 'err'      && <span style={{ color: 'var(--danger)' }}>✗</span>}
      </span>
    </div>
  );
}

function AvailabilityHint({ avail }) {
  if (avail.kind === 'idle') return null;
  const color = avail.kind === 'ok' ? 'var(--accent)' : avail.kind === 'err' ? 'var(--danger)' : 'var(--ink-mute)';
  return (
    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color, display: 'flex', alignItems: 'center', gap: 4 }}>
      {avail.kind === 'checking' && 'Checking…'}
      {avail.kind === 'ok'       && '✓ Available'}
      {avail.kind === 'err'      && `✗ ${avail.msg}`}
    </div>
  );
}

function ThemeCard({ active, onClick, icon, title, subtitle, tone }) {
  const baseBg = tone === 'warm'
    ? 'linear-gradient(160deg, oklch(0.28 0.05 60 / 0.9), oklch(0.22 0.04 50 / 0.9))'
    : 'linear-gradient(160deg, oklch(0.24 0.04 245 / 0.9), oklch(0.18 0.03 250 / 0.9))';
  return (
    <button type="button" onClick={onClick}
      className="tap-target"
      style={{
        position: 'relative', textAlign: 'left', borderRadius: 20, padding: 16,
        background: baseBg,
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: active
          ? '0 0 0 3px oklch(0.82 0.16 195 / 0.2), 0 0 22px oklch(0.82 0.16 195 / 0.4)'
          : 'inset 0 1px 0 oklch(1 0 0 / 0.03)',
        cursor: 'pointer', transition: 'all 200ms',
      }}>
      {active && (
        <span style={{
          position: 'absolute', top: 8, right: 8, width: 22, height: 22,
          background: 'var(--accent)', color: 'var(--accent-ink)',
          borderRadius: 99, display: 'grid', placeItems: 'center', fontSize: 12,
          boxShadow: '0 0 12px oklch(0.82 0.16 195 / 0.7)',
        }}>✓</span>
      )}
      <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: active ? 'var(--accent)' : 'var(--ink)', marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{subtitle}</div>
    </button>
  );
}

function CountrySheet({ selected, onSelect, onClose }) {
  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end',
      background: 'oklch(0 0 0 / 0.55)', backdropFilter: 'blur(6px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxHeight: '70vh', overflowY: 'auto',
        borderRadius: '28px 28px 0 0', padding: 20, paddingBottom: 32,
        background: 'var(--bg)', borderTop: '1px solid var(--border)',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
        animation: 'syn-rise 260ms cubic-bezier(.2,.8,.2,1) both',
      }}>
        <div style={{ width: 48, height: 6, borderRadius: 99, background: 'var(--border)', margin: '0 auto 16px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <SectionLabel>Choose your country</SectionLabel>
          <button onClick={onClose} className="tap-target" style={{ width: 32, height: 32, borderRadius: 99, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', display: 'grid', placeItems: 'center', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {COUNTRIES.map(c => {
            const active = c.code === selected;
            return (
              <button key={c.code} type="button" onClick={() => onSelect(c)}
                className="tap-target"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '0 16px', minHeight: 52, borderRadius: 16,
                  background: active ? 'oklch(0.82 0.16 195 / 0.14)' : 'oklch(0.22 0.03 232 / 0.85)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  color: 'var(--ink)', cursor: 'pointer', transition: 'all 150ms',
                }}>
                <span style={{ fontSize: 22 }}>{c.flag}</span>
                <span style={{ flex: 1, textAlign: 'left', fontSize: 15, fontWeight: 500 }}>{c.name}</span>
                {active && <span style={{ color: 'var(--accent)', fontSize: 16 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ProfileSetupPage({ onNavigate, user, prefillName }) {
  const { theme, setTheme } = useTheme() || { theme: 'neural', setTheme: () => {} };
  const [avatar, setAvatar]         = useState('😊');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [username, setUsername]     = useState(prefillName ? prefillName.replace(/\s+/g, '_').slice(0, 20) : '');
  const [country, setCountry]       = useState(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryTouched, setCountryTouched] = useState(false);
  const [avail, setAvail]           = useState({ kind: 'idle' });
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState('');
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const u = username.trim();
    if (!u) return setAvail({ kind: 'idle' });
    if (u.length < 3) return setAvail({ kind: 'err', msg: 'Too short — min 3 characters' });
    if (!/^[a-zA-Z0-9_]+$/.test(u)) return setAvail({ kind: 'err', msg: 'Invalid characters' });
    setAvail({ kind: 'checking' });
    timer.current = setTimeout(async () => {
      if (TAKEN.has(u.toLowerCase())) { setAvail({ kind: 'err', msg: 'Already taken' }); return; }
      try {
        const { data } = await axios.get(`/profile/check-username?username=${encodeURIComponent(u)}`);
        setAvail(data.available ? { kind: 'ok' } : { kind: 'err', msg: 'Already taken' });
      } catch { setAvail({ kind: 'ok' }); }
    }, 650);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [username]);

  const canSubmit = avail.kind === 'ok' && !!country && !loading && !done;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!country) { setCountryTouched(true); return; }
    if (!canSubmit) return;
    setLoading(true); setError('');
    try {
      const idToken = await auth.currentUser?.getIdToken();
      await axios.post('/profile/save', {
        uid: user?.uid || auth.currentUser?.uid,
        username: username.trim(),
        avatar, country: country.code,
        countryName: country.name,
        countryFlag: country.flag,
        theme,
      }, { headers: { Authorization: `Bearer ${idToken}` } });
      setDone(true);
      setTimeout(() => onNavigate('lobby'), 700);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save profile. Try again.');
    }
    setLoading(false);
  }

  return (
    <div className="scene" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <ThemeSwitcher />
      <div className="scene-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '56px 24px 32px', overflowY: 'auto' }}>

        {/* Back */}
        <button onClick={() => onNavigate('welcome')} className="tap-target" style={{ width: 44, height: 44, borderRadius: 99, background: 'oklch(0.22 0.03 232 / 0.7)', border: '1px solid var(--border)', color: 'var(--ink)', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(8px)', marginBottom: 24, flexShrink: 0 }}>‹</button>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 24, position: 'relative', animation: 'syn-float 6s ease-in-out infinite' }}>
          <div aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 160, height: 80, background: 'radial-gradient(ellipse 70% 60% at 50% 50%, var(--accent), transparent 70%)', filter: 'blur(24px)', opacity: 0.55, pointerEvents: 'none' }}/>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 40, lineHeight: 1, letterSpacing: '-0.02em', position: 'relative' }}>
            <span style={{ color: 'var(--ink)' }}>Syn</span>
            <span style={{ color: 'var(--accent)', textShadow: '0 0 22px oklch(0.82 0.16 195 / 0.7)' }}>apse</span>
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 24, animation: 'syn-rise 500ms cubic-bezier(.2,.8,.2,1) both' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.32em', color: 'var(--accent)', marginBottom: 8 }}>Profile setup</div>
          <h1 style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 8 }}>👋 Welcome to Synapse</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-dim)' }}>Let's create your profile.</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12, background: 'oklch(0.68 0.22 22 / 0.12)', border: '1px solid oklch(0.68 0.22 22 / 0.5)', color: 'var(--danger)', marginBottom: 16, animation: 'syn-pop 260ms cubic-bezier(.2,.8,.2,1) both' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'syn-rise 600ms 80ms cubic-bezier(.2,.8,.2,1) both' }}>

          {/* AVATAR */}
          <div className="panel" style={{ padding: 20 }}>
            <SectionLabel>Your avatar</SectionLabel>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 88, height: 88, borderRadius: 99,
                background: 'oklch(0.22 0.03 232 / 0.9)',
                border: '1px solid oklch(0.82 0.16 195 / 0.5)',
                boxShadow: '0 0 0 4px oklch(0.82 0.16 195 / 0.18), 0 0 32px oklch(0.82 0.16 195 / 0.5)',
                display: 'grid', placeItems: 'center',
                fontSize: 44, lineHeight: 1,
                animation: 'syn-pulse 2.4s ease-in-out infinite, syn-float 6s ease-in-out infinite',
              }}>{avatar}</div>
              <button type="button" onClick={() => setPickerOpen(v => !v)}
                className="btn-ghost tap-target"
                style={{ minHeight: 44, paddingInline: 18, borderRadius: 999, display: 'flex', alignItems: 'center', gap: 8 }}>
                ✏ Change Avatar
              </button>
            </div>
            {pickerOpen && (
              <div style={{
                marginTop: 20, borderRadius: 20, padding: 16,
                background: 'oklch(0.27 0.035 230 / 0.9)', border: '1px solid var(--border)',
                animation: 'syn-rise 220ms cubic-bezier(.2,.8,.2,1) both',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <SectionLabel>Choose your avatar</SectionLabel>
                  <button type="button" onClick={() => setPickerOpen(false)} className="tap-target" style={{ width: 32, height: 32, borderRadius: 99, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', display: 'grid', placeItems: 'center', fontSize: 16 }}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {AVATARS.map(emo => {
                    const active = emo === avatar;
                    return (
                      <button key={emo} type="button"
                        onClick={() => { setAvatar(emo); setPickerOpen(false); }}
                        className="tap-target"
                        style={{
                          width: 52, height: 52, margin: '0 auto', fontSize: 26,
                          borderRadius: 99, display: 'grid', placeItems: 'center',
                          background: active ? 'oklch(0.82 0.16 195 / 0.18)' : 'oklch(0.22 0.03 232 / 0.85)',
                          border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                          boxShadow: active ? '0 0 0 3px oklch(0.82 0.16 195 / 0.22), 0 0 20px oklch(0.82 0.16 195 / 0.45)' : 'inset 0 1px 0 oklch(1 0 0 / 0.04)',
                          cursor: 'pointer', transition: 'all 150ms',
                        }}>{emo}</button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* USERNAME */}
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <SectionLabel>Username</SectionLabel>
              <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums' }}>{username.length} / 20</span>
            </div>
            <UsernameInput value={username} onChange={setUsername} avail={avail} disabled={loading || done} />
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-mute)' }}>Letters, numbers and underscores only</div>
            <AvailabilityHint avail={avail} />
          </div>

          {/* COUNTRY */}
          <div className="panel" style={{ padding: 20 }}>
            <SectionLabel>Country</SectionLabel>
            <button type="button" onClick={() => setCountryOpen(true)} disabled={loading || done}
              className="tap-target"
              style={{
                marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '0 16px', minHeight: 56, borderRadius: 999,
                background: 'oklch(0.22 0.03 232 / 0.85)',
                border: `1px solid ${countryTouched && !country ? 'var(--danger)' : 'var(--border)'}`,
                color: 'var(--ink)', cursor: 'pointer', transition: 'all 150ms',
              }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{country?.flag ?? '🌍'}</span>
              <span style={{ flex: 1, textAlign: 'left', fontSize: 15, fontWeight: 500, color: country ? 'var(--ink)' : 'var(--ink-mute)' }}>
                {country?.name ?? 'Select your country'}
              </span>
              <span style={{ color: 'var(--ink-mute)', fontSize: 18 }}>›</span>
            </button>
            {countryTouched && !country && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--danger)' }}>Please choose your country</div>
            )}
          </div>

          {/* THEME */}
          <div className="panel" style={{ padding: 20 }}>
            <SectionLabel>Theme</SectionLabel>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <ThemeCard active={theme === 'neural'} onClick={() => setTheme('neural')} icon="🧠" title="Neural Network" subtitle="Sci-fi · Teal" tone="cool" />
              <ThemeCard active={theme === 'library'} onClick={() => setTheme('library')} icon="📚" title="Ancient Library" subtitle="Classic · Gold" tone="warm" />
            </div>
          </div>

          {/* SUBMIT */}
          <button type="submit" disabled={(!canSubmit && !loading && !done)}
            className="btn-primary tap-target"
            style={{ opacity: canSubmit || loading || done ? 1 : 0.55, cursor: canSubmit || loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {done    ? '✓ Let\'s play!'
             : loading ? '⏳ Saving…'
             : 'Save & Continue →'}
          </button>
        </form>

        {countryOpen && (
          <CountrySheet
            selected={country?.code ?? null}
            onSelect={c => { setCountry(c); setCountryTouched(true); setCountryOpen(false); }}
            onClose={() => setCountryOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
