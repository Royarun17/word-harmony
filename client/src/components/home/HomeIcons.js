import React from 'react';

// Line and solid glyphs for the Home screen. They take currentColor, so each
// button sets its own colour in CSS.
const base = { width: '1em', height: '1em', viewBox: '0 0 24 24', 'aria-hidden': true, focusable: 'false' };

export const FriendsIcon = () => (
  <svg {...base} fill="currentColor">
    <circle cx="12" cy="7.5" r="3.3" /><circle cx="5.6" cy="9" r="2.5" /><circle cx="18.4" cy="9" r="2.5" />
    <path d="M5.5 19.5c0-3.6 2.9-6.3 6.5-6.3s6.5 2.7 6.5 6.3z" />
    <path d="M1.3 18.8c0-2.8 1.9-4.7 4.4-4.7.9 0 1.6.2 2.3.6-1.2 1.2-2 2.8-2.1 4.6z" />
    <path d="M22.7 18.8c0-2.8-1.9-4.7-4.4-4.7-.9 0-1.6.2-2.3.6 1.2 1.2 2 2.8 2.1 4.6z" />
  </svg>
);

export const BellIcon = () => (
  <svg {...base} fill="currentColor">
    <path d="M12 2.5a1.6 1.6 0 0 1 1.6 1.6v.6a6.4 6.4 0 0 1 4.8 6.2v4.2l1.9 2.4v1H3.7v-1l1.9-2.4v-4.2a6.4 6.4 0 0 1 4.8-6.2v-.6A1.6 1.6 0 0 1 12 2.5z" />
    <path d="M9.5 19.6h5a2.5 2.5 0 0 1-5 0z" />
  </svg>
);

export const GearIcon = () => (
  <svg {...base} fill="currentColor" fillRule="evenodd">
    <path d="M10.3 2h3.4l.5 2.6c.7.2 1.3.5 1.9.9l2.2-1.5 2.4 2.4-1.5 2.2c.4.6.7 1.2.9 1.9l2.6.5v3.4l-2.6.5c-.2.7-.5 1.3-.9 1.9l1.5 2.2-2.4 2.4-2.2-1.5c-.6.4-1.2.7-1.9.9l-.5 2.6h-3.4l-.5-2.6c-.7-.2-1.3-.5-1.9-.9l-2.2 1.5-2.4-2.4 1.5-2.2c-.4-.6-.7-1.2-.9-1.9L2 13.7v-3.4l2.6-.5c.2-.7.5-1.3.9-1.9L4 5.7l2.4-2.4 2.2 1.5c.6-.4 1.2-.7 1.9-.9zM12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z" />
  </svg>
);

export const PencilIcon = () => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M8 16l.6-2.6 6.6-6.6 2 2-6.6 6.6z" />
  </svg>
);

export const StarIcon = () => (
  <svg {...base} fill="currentColor"><path d="M12 2.8l2.8 5.8 6.3.8-4.6 4.4 1.1 6.3L12 17.1l-5.6 3 1.1-6.3-4.6-4.4 6.3-.8z" /></svg>
);

export const GamepadIcon = () => (
  <svg {...base} viewBox="0 0 48 32" fill="currentColor" fillRule="evenodd">
    <path d="M13 2h22c6.6 0 11 5.6 12 13.4.8 6.7-1.4 13.6-6.4 13.6-3.6 0-5.4-3-7.4-6H14.8c-2 3-3.8 6-7.4 6C2.4 29 .2 22.1 1 15.4 2 7.6 6.4 2 13 2zM11 9v4.5H6.5v4H11V22h4v-4.5h4.5v-4H15V9zm22.5 1.2a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2zm5.8 5a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2zm-5.8 5.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z" />
  </svg>
);

export const PeopleIcon = () => (
  <svg {...base} viewBox="0 0 48 32" fill="currentColor">
    <circle cx="24" cy="8.5" r="7.5" /><circle cx="10.5" cy="12" r="5.5" /><circle cx="37.5" cy="12" r="5.5" />
    <path d="M11 31.5c0-8 5.8-13.5 13-13.5s13 5.5 13 13.5z" />
    <path d="M0 31.5c0-6 3.8-10 8.8-10 1.6 0 3.1.4 4.3 1.2-2.4 2.3-4 5.4-4.3 8.8z" />
    <path d="M48 31.5c0-6-3.8-10-8.8-10-1.6 0-3.1.4-4.3 1.2 2.4 2.3 4 5.4 4.3 8.8z" />
  </svg>
);

export const QrIcon = () => (
  <svg {...base} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9V5a2 2 0 0 1 2-2h4M23 3h4a2 2 0 0 1 2 2v4M29 23v4a2 2 0 0 1-2 2h-4M9 29H5a2 2 0 0 1-2-2v-4" />
    <rect x="8" y="8" width="6" height="6" rx="1" /><rect x="18" y="8" width="6" height="6" rx="1" /><rect x="8" y="18" width="6" height="6" rx="1" />
    <path d="M18 18h2.5v2.5M24 18v.1M18 24h.1M21.5 24H24v-2.5" />
  </svg>
);

export const PlayIcon = () => (
  <svg {...base} fill="currentColor"><path d="M8 4.8c0-1 1.1-1.6 2-1.1l10.3 6.3c.8.5.8 1.6 0 2.1L10 18.3c-.9.5-2-.1-2-1.1z" /></svg>
);

export const BookIcon = () => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M12 6.5C10 5 7 4.4 3 4.6v13.5c4-.2 7 .4 9 1.9 2-1.5 5-2.1 9-1.9V4.6c-4-.2-7 .4-9 1.9zM12 6.5V20" />
  </svg>
);

export const RulesIcon = () => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2.8h8.5L19 7.3V20a1.2 1.2 0 0 1-1.2 1.2H6A1.2 1.2 0 0 1 4.8 20V4A1.2 1.2 0 0 1 6 2.8z" />
    <path d="M14.3 2.8v4.7H19M8.3 11.5h7.4M8.3 14.8h7.4M8.3 18h4.6" />
  </svg>
);

export const InfoIcon = () => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="9.2" /><path d="M12 11v6" /><circle cx="12" cy="7.6" r=".4" fill="currentColor" strokeWidth="1.6" />
  </svg>
);

export const CloseIcon = () => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
