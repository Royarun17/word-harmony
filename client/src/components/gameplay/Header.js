import React from 'react';
import { TimerRing } from '../../SynapseComponents';
import styles from './gameplay.module.css';

function GameHeader({ round, rounds, timeLeft, urgency, modeLabel, onExit, onInfo }) {
  return (
    <div className={styles.header}>
      <button onClick={onExit} className={styles.iconBtn} aria-label="Exit game">←</button>

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

      <button onClick={onInfo} className={styles.iconBtn} aria-label="Game rules">ℹ</button>
    </div>
  );
}

export default React.memo(GameHeader);
