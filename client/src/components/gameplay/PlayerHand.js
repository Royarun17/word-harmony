import React from 'react';
import styles from './gameplay.module.css';

const TINTS = ['#4c7dff', '#13a3a0', '#e0478f', '#f08a24', '#8a63d2', '#12a463'];
export const capitalise = w => w.charAt(0).toUpperCase() + w.slice(1);

export function HandCard({ word, index = 0, count = 1, showKey = false, className = '', style, ...rest }) {
  return (
    <button
      type="button"
      className={`${styles.card} ${className}`}
      style={{
        '--len': word.length,
        '--tint': TINTS[(word.length + index) % TINTS.length],
        '--i': index,
        '--count': count,
        animationDelay: `${200 + index * 70}ms`,
        ...style,
      }}
      {...rest}
    >
      {capitalise(word)}
      {showKey && <span className={styles.key} aria-hidden>{index + 1}</span>}
    </button>
  );
}

// Renders two grid cells of the hand row: the hint and the fanned cards.
function PlayerHand({ hand, selected, onSelect, hasCompleteSet, isMyTurn, onCardPointerDown, draggingWord }) {
  let hint = 'Collect 3 matching cards, then buzz';
  if (isMyTurn) {
    hint = selected
      ? <>Tap <b>Pass</b> or drag <b>{capitalise(selected)}</b> onto the word</>
      : 'Your turn · pick a card to pass';
  }

  return (
    <>
      <div className={styles.hint} aria-live="polite">{hint}</div>
      <div className={styles.handWrap}>
        <div className={styles.hand} style={{ '--n': Math.max(hand.length, 3) }}>
          {hand.map((word, i) => {
            const cls = [
              selected === word && styles.selected,
              // The server checks the first three cards for a set.
              hasCompleteSet && i < 3 && styles.match,
              draggingWord === word && styles.lifted,
            ].filter(Boolean).join(' ');
            return (
              <HandCard
                key={word}
                word={word}
                index={i}
                count={hand.length}
                showKey
                className={cls}
                aria-pressed={selected === word}
                aria-keyshortcuts={String(i + 1)}
                onPointerDown={e => onCardPointerDown && onCardPointerDown(word, e)}
                onClick={() => onSelect(word)}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

export default React.memo(PlayerHand);
