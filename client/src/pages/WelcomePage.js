import React from 'react';
import { ThemeSwitcher } from '../SynapseComponents';

export default function WelcomePage({ onNavigate }) {
  return (
    <div className="scene welcome-scene" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px 40px' }}>
      <ThemeSwitcher />
      <style>{`
        @media (orientation: landscape) and (max-width: 900px) and (max-height: 500px) {
          .welcome-scene { padding: 20px 28px !important; }
          .welcome-content { max-width: 720px !important; flex-direction: row !important; align-items: center !important; gap: 36px; }
          .welcome-logo-block { flex: 1; margin-bottom: 0 !important; text-align: left !important; }
          .welcome-logo-block h1 { font-size: 48px !important; }
          .welcome-cta-col { flex: 1; display: flex; flex-direction: column; gap: 12px; width: 100%; }
          .welcome-panel { margin-bottom: 0 !important; padding: 16px !important; }
        }
      `}</style>
      <div className="scene-content welcome-content" style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Logo glow + wordmark */}
        <div className="welcome-logo-block" style={{ textAlign: 'center', marginBottom: 40, position: 'relative', width: '100%' }}>
          <div aria-hidden style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 200, height: 120,
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, var(--accent), transparent 70%)',
            filter: 'blur(28px)', opacity: 0.55, pointerEvents: 'none',
          }}/>
          <h1 style={{
            fontSize: 72, fontWeight: 700, lineHeight: 1,
            letterSpacing: '-0.02em', fontFamily: 'var(--font-display)',
            position: 'relative', marginBottom: 14,
          }}>
            <span style={{ color: 'var(--ink)' }}>Syn</span>
            <span style={{ color: 'var(--accent)', textShadow: '0 0 30px oklch(0.82 0.16 195 / 0.7)' }}>apse</span>
          </h1>
        </div>

        <div className="welcome-cta-col">
          {/* CTA panel */}
          <div className="panel welcome-panel" style={{ padding: 24, width: '100%', marginBottom: 20 }}>

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
        </div>

      </div>
    </div>
  );
}
