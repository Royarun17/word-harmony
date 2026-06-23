import React from 'react';

export default function GameCard({ word, selected, onClick, disabled, label, incoming }) {
  return (
    <div
      className={`game-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${incoming ? 'card-incoming' : ''}`}
      onClick={!disabled ? onClick : undefined}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={e => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) onClick?.(); }}
      aria-pressed={selected}
      aria-label={`Card: ${word}`}
    >
      <span className="card-word">{word}</span>
      {label && <span className="card-label">{label}</span>}
    </div>
  );
}
