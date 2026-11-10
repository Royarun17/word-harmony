import React, { useState } from 'react';
import PlayerSeat from './PlayerSeat';
import styles from './gameplay.module.css';

function GameHeader({
  round, rounds, onExit, onInfo, onCopied, roomCode,
  otherPlayers, turnPlayerId, lastBuzzerId, totalScores, handCounts, leaderId,
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      onCopied && onCopied();
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <header className={styles.bar}>
      <button onClick={onExit} className={styles.iconBtn} aria-label="Leave game">←</button>
      <div className={styles.round}>
        <span className={styles.label}>Round</span>
        <b>{round} / {rounds}</b>
      </div>

      <div className={styles.players}>
        {otherPlayers.map((p, i) => (
          <PlayerSeat
            key={p.id}
            player={p}
            isActive={p.id === turnPlayerId}
            isBuzzing={p.id === lastBuzzerId}
            score={totalScores?.[p.id]}
            cardCount={handCounts?.[p.id] ?? 0}
            isLeader={p.id === leaderId}
            delay={i * 60}
          />
        ))}
      </div>

      <button onClick={copyCode} className={styles.room} aria-label="Copy room code">
        <span className={styles.label}>{copied ? 'Copied' : 'Room'}</span>{roomCode}
      </button>
      <button onClick={onInfo} className={styles.iconBtn} aria-label="Game rules">?</button>
    </header>
  );
}

export default React.memo(GameHeader);
