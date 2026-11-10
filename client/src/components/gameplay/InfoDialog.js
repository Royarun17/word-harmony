import React from 'react';
import { Dialog } from '../../SynapseComponents';
import styles from './gameplay.module.css';

export const RULES = [
  'You start with 3 cards, each themed around one player\'s word.',
  'On your turn, pass one card to the next player.',
  'Collect 3 cards that all match the same theme.',
  'Once the deck has traveled all the way around, buzz in before your opponents do.',
];

function InfoDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title="How to play" tone="accent">
      <div className={styles.rulesList}>
        {RULES.map((rule, i) => (
          <div key={i} className={styles.ruleItem}>
            <span className={styles.ruleIndex}>{i + 1}</span>
            <span>{rule}</span>
          </div>
        ))}
      </div>
      <p className={styles.keys}>
        Keyboard: <kbd>1</kbd>–<kbd>4</kbd> pick a card · <kbd>Enter</kbd> pass · <kbd>B</kbd> buzz · <kbd>Esc</kbd> put it back
      </p>
    </Dialog>
  );
}

export default React.memo(InfoDialog);
