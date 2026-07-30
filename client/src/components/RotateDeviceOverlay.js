import React, { useState, useEffect } from 'react';

// Phone-sized + portrait = blocked. The width cap keeps this from ever
// triggering on tablets/desktops that happen to be tall (e.g. a portrait
// monitor) — only genuinely phone-sized viewports get the rotate prompt.
const QUERY = '(max-width: 900px) and (orientation: portrait)';

export default function RotateDeviceOverlay() {
  const [blocked, setBlocked] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const check = () => setBlocked(mq.matches);
    check();
    if (mq.addEventListener) mq.addEventListener('change', check);
    else mq.addListener(check); // Safari <14 fallback
    window.addEventListener('resize', check);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', check);
      else mq.removeListener(check);
      window.removeEventListener('resize', check);
    };
  }, []);

  if (!blocked) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'linear-gradient(180deg, oklch(0.17 0.025 235), oklch(0.1 0.02 240))',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 28, textAlign: 'center', color: '#fff',
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 60, animation: 'gp-rotate-hint 1.6s ease-in-out infinite' }} aria-hidden>📱</div>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, marginTop: 18, marginBottom: 6 }}>
        Rotate your device
      </h2>
      <p style={{ fontSize: 14, opacity: 0.7, maxWidth: 280, lineHeight: 1.5, margin: 0 }}>
        Synapse is played in landscape — turn your phone sideways to continue.
      </p>
      <style>{`
        @keyframes gp-rotate-hint {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  );
}
