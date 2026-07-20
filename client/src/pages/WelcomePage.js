import React, { useState } from 'react';
import { ThemeSwitcher } from '../SynapseComponents';

export default function WelcomePage({ onNavigate }) {
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="syn-scene" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <ThemeSwitcher />
      <div className="syn-scene-content" style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo glow */}
        <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: 160, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent), transparent 60%)', opacity: 0.4, filter: 'blur(20px)', pointerEvents: 'none' }}/>
          <div style={{ fontSize: 10, letterSpacing: '0.4em', fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>REAL-TIME WORD GAME</div>
          <h1 style={{ fontSize: 72, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1, letterSpacing: '-0.02em' }}>Synapse</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-dim)', marginTop: 12 }}>Submit a word. Collect a set. Buzz first.</p>
        </div>

        {/* CTA panel */}
        <div className="syn-panel" style={{ padding: 24 }}>
          {error && (
            <div style={{ background: 'oklch(from var(--danger) l c h / 0.15)', border: '1px solid oklch(from var(--danger) l c h / 0.35)', borderRadius: 14, padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</div>
          )}

          <button onClick={() => onNavigate('signup')} className="syn-btn-primary tap" style={{ width: '100%', marginBottom: 10 }}>
            Get started
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>already have an account</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          </div>

          <button onClick={() => onNavigate('signin')} className="syn-btn-ghost tap" style={{ width: '100%' }}>
            Sign in
          </button>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <span className="syn-chip">🎮 3–8 players</span>
          <span className="syn-chip">🤖 Bot opponents</span>
          <span className="syn-chip">⚡ Real-time</span>
        </div>
      </div>
    </div>
  );
}
