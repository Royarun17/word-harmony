import React from 'react';
import { WordCard } from '../../SynapseComponents';
import styles from './gameplay.module.css';

function PlayerHand({ hand, selected, onSelect, hasCompleteSet, isMyTurn }) {
  return (
    <div className={styles.handSection}>
      {isMyTurn && (
        <div className={styles.turnHint}>
          <span className="chip chip-accent" style={{ fontSize: 11 }}>Your turn — select a card to pass</span>
        </div>
      )}
      <div className={styles.handFan}>
        {hand.map((word, i) => {
          const isSelected = selected === word;
          const isMatch = hasCompleteSet && i < 3;
          return (
            <div
              key={word}
              className={`${styles.cardSlot}${isSelected ? ` ${styles.selected}` : ''}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <WordCard
                word={word.charAt(0).toUpperCase() + word.slice(1)}
                kind={isMatch ? 'match' : 'normal'}
                selected={isSelected}
                onClick={() => onSelect(isSelected ? null : word)}
                small
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(PlayerHand);
