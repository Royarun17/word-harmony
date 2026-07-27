import React from 'react';
import { Confetti } from '../../SynapseComponents';
import styles from './gameplay.module.css';

function ActionBar({
  selected, isMyTurn, isDragging, onKeep, onQuit,
  ready, canBuzz, onBuzz, buzzed, showConfetti,
}) {
  const hintLabel = isDragging
    ? 'Drop on table →'
    : selected
      ? `"${selected.charAt(0).toUpperCase() + selected.slice(1)}" selected`
      : isMyTurn
        ? 'Drag a card to pass'
        : 'Pass';

  return (
    <div className={styles.actionBar}>
      <button onClick={onQuit} className={`btn-ghost tap-target ${styles.actionBtn}`}>🏳 Quit</button>

      <div className={`${styles.actionBtn} ${styles.passHint}${isDragging ? ` ${styles.passHintActive}` : ''}`}>
        {hintLabel}
      </div>

      <div className={styles.buzzSlot}>
        <button
          onClick={onBuzz}
          disabled={!canBuzz}
          className={`tap-target ${styles.actionBtn} ${styles.buzzPill}${ready ? ` ${styles.buzzPillReady}` : ''}`}
        >
          <span aria-hidden>⚡</span> Buzz
        </button>
        {showConfetti && <Confetti count={50} />}
        {buzzed && (
          <div className={styles.buzzToast}>
            <span className="chip chip-accent" style={{ fontSize: 11 }}>Buzzed in!</span>
          </div>
        )}
      </div>

      <button
        onClick={onKeep}
        disabled={!selected}
        className={`btn-ghost tap-target ${styles.actionBtn}`}
        style={{ opacity: selected ? 1 : 0.5 }}
      >
        <span aria-hidden>↻</span> Keep
      </button>
    </div>
  );
}

export default React.memo(ActionBar);
