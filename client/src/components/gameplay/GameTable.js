import React, { forwardRef } from 'react';
import styles from './gameplay.module.css';

const ORDINAL = ['1st', '2nd', '3rd'];
const ordinal = n => ORDINAL[n - 1] || `${n}th`;

// The middle of the screen: your progress, the prompt card (which is also the
// drop target for passing a card) and the buzzer.
const GameTable = forwardRef(function GameTable({
  myWord, otherWords, modeNoun, timeLeft, timerPercent, urgency,
  myScore, myRank, playerCount, hasCompleteSet, isMyTurn, turnPlayerName,
  ready, canBuzz, buzzed, buzzerLocked, buzzWindowLeft, onBuzz, dropActive, took,
}, ref) {
  let status = isMyTurn ? 'Pass a card, then buzz' : 'Waiting for your turn';
  if (buzzed) status = 'Buzzed in!';
  else if (buzzerLocked) status = 'Unlocks after the first lap';
  else if (buzzWindowLeft > 0) status = `Buzz now · ${buzzWindowLeft}s`;
  else if (ready) status = 'You have a set. Buzz!';
  else if (canBuzz) status = 'Buzzer open';

  return (
    <main className={styles.stage}>
      <section className={styles.you} aria-label="Your progress">
        <span className={`${styles.turnPill}${isMyTurn ? ` ${styles.mine}` : ''}`}>
          {isMyTurn ? 'Your turn' : turnPlayerName ? `${turnPlayerName} is playing` : 'Waiting…'}
        </span>
        <div className={styles.youScore}>
          <span className={styles.label}>Your score</span>
          <b>{(myScore || 0).toLocaleString()}</b>
          <span>{ordinal(myRank)} of {playerCount}</span>
        </div>
        <span className={`${styles.setChip}${hasCompleteSet ? ` ${styles.done}` : ''}`}>
          <span className={styles.setDot} aria-hidden>{hasCompleteSet ? '✓' : ''}</span>
          <span className={styles.setText}>{hasCompleteSet ? 'Set complete' : 'No set yet'}</span>
        </span>
      </section>

      <section ref={ref} className={`${styles.prompt}${dropActive ? ` ${styles.over}` : ''}${took ? ` ${styles.took}` : ''}`}>
        <div className={styles.ask}>Collect 3 {modeNoun} of one word</div>
        <div className={styles.word}>{myWord || '…'}</div>
        {otherWords.length > 0 && (
          <div className={styles.others} aria-label="Other words in play">
            {otherWords.map(w => <span key={w}>{w}</span>)}
          </div>
        )}
        <div className={`${styles.timer}${urgency !== 'normal' ? ` ${styles[urgency]}` : ''}`}>
          <div className={styles.track}>
            <div className={styles.fill} style={{ transform: `scaleX(${Math.max(0, Math.min(1, timerPercent / 100))})` }} />
          </div>
          <span className={styles.secs} aria-label={`${timeLeft} seconds left`}>{timeLeft}s</span>
        </div>
        <div className={styles.dropHint} aria-hidden>Drop to pass</div>
      </section>

      <section className={styles.buzzCol}>
        <button
          onClick={onBuzz}
          disabled={!canBuzz}
          aria-keyshortcuts="B"
          className={`${styles.buzz}${ready ? ` ${styles.ready}` : ''}${buzzed ? ` ${styles.buzzed}` : ''}`}
        >
          {buzzed ? '✓' : 'BUZZ'}
        </button>
        <span className={`${styles.buzzStatus}${canBuzz && !buzzed ? ` ${styles.open}` : ''}`} aria-live="polite">{status}</span>
      </section>
    </main>
  );
});

export default React.memo(GameTable);
