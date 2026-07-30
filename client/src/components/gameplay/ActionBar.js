import React from 'react';
import { Confetti } from '../../SynapseComponents';
import styles from './gameplay.module.css';

function ActionBar({
  selected, isMyTurn, isDragging, onKeep, onQuit,
  ready, canBuzz, onBuzz, buzzed, showConfetti,
}) {
  const selectedLabel = selected ? selected.charAt(0).toUpperCase() + selected.slice(1) : null;

  return (
    <div className={styles.actionBarWrap}>
      <div className={styles.actionBarTop}>
        <button onClick={onQuit} className={`btn-ghost tap-target ${styles.actionBtnSm}`}>🏳 Quit</button>

        <div
          className={`${styles.passHint}${isDragging ? ` ${styles.passHintActive}` : ''}`}
          title="Drag a card onto the table to pass it"
        >
          {isDragging ? (
            <>Drop on table <span aria-hidden>→</span></>
          ) : selectedLabel ? (
            <>Pass <span className={styles.passHintWord}>&quot;{selectedLabel}&quot;</span> <span aria-hidden>→</span></>
          ) : isMyTurn ? (
            'Drag a card to pass'
          ) : (
            'Pass'
          )}
        </div>
      </div>

      <div className={styles.actionBarBottom}>
        <button
          onClick={onKeep}
          disabled={!selected}
          className={`tap-target ${styles.keepMain}`}
          style={{ opacity: selected ? 1 : 0.6 }}
        >
          <span><span aria-hidden>🔖</span> Keep</span>
          <span className={styles.keepMainCaption}>Cancel card selection</span>
        </button>

        <div className={styles.buzzSlotBig}>
          <button
            onClick={onBuzz}
            disabled={!canBuzz}
            className={`tap-target ${styles.buzzMain}${ready ? ` ${styles.buzzMainReady} sheen-sweep` : ''}`}
          >
            <span aria-hidden>⚡</span> BUZZ
          </button>
          {showConfetti && <Confetti count={60} />}
          {buzzed ? (
            <div className={styles.buzzToast}>
              <span className="chip chip-accent" style={{ fontSize: 11 }}>Buzzed in!</span>
            </div>
          ) : (
            <div className={styles.buzzCaption}>First correct match scores the most — up to 10 pts</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ActionBar);
