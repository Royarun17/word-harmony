import React, { useState } from 'react';
import { TimerRing, useTheme } from '../../SynapseComponents';
import styles from './gameplay.module.css';

function GameHeader({ round, rounds, timeLeft, urgency, modeLabel, onExit, onInfo, roomCode, playerCount, maxPlayers }) {
  const [copied, setCopied] = useState(false);
  const { toggle } = useTheme() || {};

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className={styles.headerWrap}>
      <div className={styles.headerRow}>
        <button onClick={onExit} className={styles.iconBtn} aria-label="Exit game">←</button>

        <button onClick={copyCode} className={styles.roomChip} aria-label="Copy room code">
          <span className={styles.roomChipLabel}>ROOM</span>
          <span className="num">{roomCode}</span>
          <span aria-hidden>{copied ? '✓' : '⎘'}</span>
        </button>

        <div style={{ flex: 1 }} />

        <span className={`chip ${styles.playerCountChip}`}>👥 {playerCount}/{maxPlayers}</span>
        {toggle && <button onClick={toggle} className={styles.iconBtn} aria-label="Settings / theme">⚙</button>}
        <button onClick={onInfo} className={styles.iconBtn} aria-label="Game rules">ℹ</button>
      </div>

      <div className={styles.headerCenter}>
        <div className={styles.headerStat}>
          <div className={styles.eyebrow}>ROUND</div>
          <div className={`num ${styles.statValue}`}>{round}/{rounds}</div>
        </div>
        <TimerRing progress={(timeLeft / 30) * 100} seconds={timeLeft} tone={urgency} />
        <div className={styles.headerStat}>
          <div className={styles.eyebrow}>MODE</div>
          <div className={styles.statValue}>{modeLabel}</div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(GameHeader);
