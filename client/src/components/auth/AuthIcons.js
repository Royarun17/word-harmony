import React from 'react';

// Icons for the Welcome / Sign Up / Sign In pages. All take currentColor.
const base = { width: '1em', height: '1em', viewBox: '0 0 24 24', 'aria-hidden': true, focusable: 'false' };
const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const UserIcon = () => (
  <svg {...base} {...line}><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c.8-4 3.8-6.2 7.5-6.2s6.7 2.2 7.5 6.2z" /></svg>
);
export const MailIcon = () => (
  <svg {...base} {...line}><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.8 6.5l8.2 6.3 8.2-6.3" /></svg>
);
export const LockIcon = () => (
  <svg {...base} {...line}><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" /><path d="M12 14.5v2.4" /></svg>
);
export const EyeIcon = () => (
  <svg {...base} {...line}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const EyeOffIcon = () => (
  <svg {...base} {...line}>
    <path d="M2.5 12S6 5.5 12 5.5c2 0 3.7.7 5.1 1.6M21.5 12S18 18.5 12 18.5c-2 0-3.7-.7-5.1-1.6" />
    <path d="M9.9 14.1a3 3 0 0 1 4.2-4.2M4 20 20 4" />
  </svg>
);
export const UserPlusIcon = () => (
  <svg {...base} fill="currentColor">
    <circle cx="9.5" cy="7.5" r="4.2" />
    <path d="M1.8 21c.5-4.6 3.6-7.4 7.7-7.4s7.2 2.8 7.7 7.4z" />
    <path d="M18 6.5h2v3h3v2h-3v3h-2v-3h-3v-2h3z" />
  </svg>
);
export const SignInIcon = () => (
  <svg {...base} {...line} strokeWidth="2.2">
    <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" /><path d="M3.5 12H14M10 8l4 4-4 4" />
  </svg>
);
export const BackArrowIcon = () => (
  <svg {...base} {...line} strokeWidth="3"><path d="M20 12H5M11 5.5 4.5 12 11 18.5" /></svg>
);
export const GoogleIcon = () => (
  <svg {...base} viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

// A gold laurel sprig; mirror it with the `flip` prop.
export const Laurel = ({ flip = false, className }) => (
  <svg className={className} viewBox="0 0 40 56" aria-hidden="true" focusable="false"
    style={flip ? { transform: 'scaleX(-1)' } : undefined}>
    <defs>
      <linearGradient id="whLaurel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff2b0" /><stop offset=".55" stopColor="#f5c04a" /><stop offset="1" stopColor="#c9821a" />
      </linearGradient>
    </defs>
    <path d="M30 54C14 46 8 30 14 6" fill="none" stroke="url(#whLaurel)" strokeWidth="2.6" strokeLinecap="round" />
    {[[13, 10, -40], [11, 19, -55], [11, 28, -65], [13, 37, -75], [18, 45, -85]].map(([x, y, r], i) => (
      <g key={i}>
        <ellipse cx={x} cy={y} rx="3.4" ry="7" transform={`rotate(${r} ${x} ${y}) translate(-5 0)`} fill="url(#whLaurel)" />
        <ellipse cx={x} cy={y} rx="3.2" ry="6.4" transform={`rotate(${-r - 10} ${x} ${y}) translate(6 2)`} fill="url(#whLaurel)" />
      </g>
    ))}
  </svg>
);

export const Sparkle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 1.5c.7 5.4 3.1 7.9 8.5 8.5-5.4.7-7.8 3.1-8.5 8.5-.7-5.4-3.1-7.8-8.5-8.5 5.4-.6 7.8-3.1 8.5-8.5z" fill="#f5c04a" />
  </svg>
);
