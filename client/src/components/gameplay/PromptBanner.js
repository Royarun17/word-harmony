import React from 'react';
import styles from './gameplay.module.css';

function PromptBanner({ topic, associationWord, handCount, complete }) {
  return (
    <div className={styles.promptBanner}>
      <div className={`panel ${styles.promptPanel}${complete ? ` ${styles.complete}` : ''}`}>
        <span className={styles.promptSpark} aria-hidden>✦</span>
        <div className={styles.promptBody}>
          <div className={styles.promptLabel}>YOUR PROMPT</div>
          <div className={styles.promptText}>
            Collect 3 {associationWord} of &quot;{topic}&quot;
          </div>
        </div>
        <span className={`chip num ${styles.promptChip}${complete ? ` ${styles.complete} chip-accent` : ''}`}>
          {complete ? '✓ Set!' : `${handCount} cards`}
        </span>
      </div>
    </div>
  );
}

export default React.memo(PromptBanner);
