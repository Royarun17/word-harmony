import React from 'react';

export default function CardLoader({ message = 'Loading\u2026' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', gap: 24,
      background: 'var(--scene-bg)',
    }}>
      <svg width="200" height="200" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="goo-card">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur"/>
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 45 -25"/>
          </filter>
        </defs>
        <g filter="url(#goo-card)">
          <g transform="translate(140, 52)">
            <rect x="-22" y="-18" width="18" height="26" rx="4" fill="var(--accent-2)" stroke="var(--accent-ink)" strokeWidth="1" transform="rotate(-15)"/>
            <rect x="-10" y="-20" width="18" height="26" rx="4" fill="var(--accent)" stroke="var(--accent-ink)" strokeWidth="1" transform="rotate(0)"/>
            <rect x="2"   y="-18" width="18" height="26" rx="4" fill="var(--accent-2)" stroke="var(--accent-ink)" strokeWidth="1" transform="rotate(15)"/>
          </g>
          <g transform="translate(62, 210)">
            <rect x="-22" y="-18" width="18" height="26" rx="4" fill="var(--accent-2)" stroke="var(--accent-ink)" strokeWidth="1" transform="rotate(-15)"/>
            <rect x="-10" y="-20" width="18" height="26" rx="4" fill="var(--accent)" stroke="var(--accent-ink)" strokeWidth="1" transform="rotate(0)"/>
            <rect x="2"   y="-18" width="18" height="26" rx="4" fill="var(--accent-2)" stroke="var(--accent-ink)" strokeWidth="1" transform="rotate(15)"/>
          </g>
          <g transform="translate(218, 210)">
            <rect x="-22" y="-18" width="18" height="26" rx="4" fill="var(--accent-2)" stroke="var(--accent-ink)" strokeWidth="1" transform="rotate(-15)"/>
            <rect x="-10" y="-20" width="18" height="26" rx="4" fill="var(--accent)" stroke="var(--accent-ink)" strokeWidth="1" transform="rotate(0)"/>
            <rect x="2"   y="-18" width="18" height="26" rx="4" fill="var(--accent-2)" stroke="var(--accent-ink)" strokeWidth="1" transform="rotate(15)"/>
          </g>
          <g>
            <rect x="-11" y="-16" width="22" height="32" rx="5" fill="var(--cta)" stroke="var(--cta-2)" strokeWidth="1.5"/>
            <rect x="-7"  y="-11" width="14" height="8"  rx="2" fill="white" opacity="0.5"/>
            <rect x="-7"  y="1"   width="14" height="3"  rx="1" fill="white" opacity="0.4"/>
            <rect x="-7"  y="7"   width="9"  height="3"  rx="1" fill="white" opacity="0.4"/>
            <animateMotion path="M140,52 L218,210 L62,210 Z" dur="2.4s" repeatCount="indefinite" rotate="auto"/>
          </g>
        </g>
      </svg>
      <p style={{ fontSize: 14, color: 'var(--ink-dim)', letterSpacing: '0.08em', fontWeight: 500, fontFamily: 'var(--font-display)' }}>
        {message}
      </p>
    </div>
  );
}
