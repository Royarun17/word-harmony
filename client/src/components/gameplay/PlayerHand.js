import React, { useState } from 'react';
import { WordCard } from '../../SynapseComponents';
import styles from './gameplay.module.css';

function PlayerHand({ hand, selected, onSelect, hasCompleteSet, isMyTurn, onCardPointerDown, draggingWord }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.handSection}>
      <div className={styles.handHeaderRow}>
        {isMyTurn ? (
          <span className="chip chip-accent" style={{ fontSize: 11 }}>
            {draggingWord ? 'Drag to the table to pass' : 'Your turn — drag a card to the table to pass'}
          </span>
        ) : <span />}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={styles.collapseBtn}
          aria-label={collapsed ? 'Show hand' : 'Hide hand'}
        >
          {collapsed ? '▲' : '▼'}
        </button>
      </div>
      {!collapsed && (
        <div className={styles.handFan}>
          {hand.map((word, i) => {
            const isSelected = selected === word;
            const isMatch = hasCompleteSet && i < 3;
            const isDragging = draggingWord === word;
            return (
              <div
                key={word}
                className={`${styles.cardSlot}${isSelected ? ` ${styles.selected}` : ''}${isDragging ? ` ${styles.beingDragged}` : ''}`}
                style={{ animationDelay: `${i * 80}ms` }}
                onPointerDown={(e) => onCardPointerDown && onCardPointerDown(word, e)}
              >
                <WordCard
                  word={word.charAt(0).toUpperCase() + word.slice(1)}
                  kind={isMatch ? 'match' : 'normal'}
                  selected={isSelected}
                  onClick={() => onSelect(isSelected ? null : word)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default React.memo(PlayerHand);
