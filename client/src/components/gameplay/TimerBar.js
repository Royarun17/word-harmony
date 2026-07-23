import React from 'react';
import styles from './gameplay.module.css';

// Thin animated bar under the buzz button, mirroring the header's timer ring.
export default function TimerBar({ percent, urgency = 'normal' }) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div className={styles.timerBarWrap} aria-hidden>
      <div
        className={`${styles.timerBarFill} ${urgency === 'danger' ? styles.danger : urgency === 'warn' ? styles.warn : ''}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
