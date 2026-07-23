import React from 'react';
import { BuzzButton, Confetti } from '../../SynapseComponents';
import styles from './gameplay.module.css';

function ActionBar({
  selected, isMyTurn, onPass, onKeep, onQuit,
  ready, canBuzz, onBuzz, buzzed, showConfetti,
}) {
  const canPass = !!selected && isMyTurn;
  const passLabel = canPass ? `Pass "${selected.charAt(0).toUpperCase() + selected.slice(1)}"` : 'Pass';

  return (
    <div className={styles.actionBar}>
      <button onClick={onQuit} className={`btn-ghost tap-target ${styles.actionBtn}`}>🏳 Quit</button>

      <button
        onClick={canPass ? onPass : onKeep}
        className={`${canPass ? 'btn-primary' : 'btn-ghost'} tap-target ${styles.actionBtn}`}
      >
        {passLabel}
      </button>

      <div className={styles.buzzSlot}>
        <BuzzButton ready={ready} disabled={!canBuzz} onClick={onBuzz} />
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
        Keep
      </button>
    </div>
  );
}

export default React.memo(ActionBar);
