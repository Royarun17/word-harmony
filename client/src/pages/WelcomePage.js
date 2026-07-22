import React from 'react';
import { ThemeSwitcher } from '../SynapseComponents';

export default function WelcomePage({ onNavigate }) {
  return (
    <div className="scene" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px 40px' }}>
      <ThemeSwitcher />
      <div className="scene-content" style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Logo glow + wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', width: '100%' }}>
          <div aria-hidden style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 200, height: 120,
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, var(--accent), transparent 70%)',
            filter: 'blur(28px)', opacity: 0.55, pointerEvents: 'none',
          }}/>
          <div style={{ fontSize: 11, letterSpacing: '0.4em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10, position: 'relative' }}>
            Real-time word game
          </div>
          <h1 style={{
            fontSize: 72, fontWeight: 700, lineHeight: 1,
            letterSpacing: '-0.02em', fontFamily: 'var(--font-display)',
            position: 'relative', marginBottom: 14,
          }}>
            <span style={{ color: 'var(--ink)' }}>Syn</span>
            <span style={{ color: 'var(--accent)', textShadow: '0 0 30px oklch(0.82 0.16 195 / 0.7)' }}>apse</span>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-dim)', maxWidth: 280, margin: '0 auto', lineHeight: 1.5, position: 'relative' }}>
            Submit a word. Collect a matching set. Buzz first.
          </p>
        </div>

        {/* CTA panel */}
        <div className="panel" style={{ padding: 24, width: '100%', marginBottom: 20 }}>

          {/* Get started */}
          <button
            onClick={() => onNavigate('signup')}
            className="btn-primary tap-target"
            style={{ width: '100%', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Get started →
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            <span style={{ fontSize: 11, color: 'var(--ink-mute)', whiteSpace: 'nowrap' }}>already have an account</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          </div>

          {/* Sign in */}
          <button
            onClick={() => onNavigate('signin')}
            className="btn-ghost tap-target"
            style={{ width: '100%' }}>
            Sign in
          </button>
        </div>

        {/* Feature chips */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="chip">🎮 3–8 players</span>
          <span className="chip">🤖 Bot opponents</span>
          <span className="chip">⚡ Real-time</span>
        </div>

      </div>
    </div>
  );
}
