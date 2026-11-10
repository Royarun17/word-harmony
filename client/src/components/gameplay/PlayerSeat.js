import React from 'react';
import { avatarHue } from '../../SynapseComponents';
import styles from './gameplay.module.css';

// Fixed lightness/chroma so player colours read the same on the light gameplay ground
// whichever app theme is active; the hue matches the player's avatar elsewhere.
export function playerColor(name = '') {
  return `oklch(0.62 0.16 ${avatarHue(name)})`;
}

// One opponent in the top bar: avatar, card count, name and score.
function PlayerSeat({ player, isActive, isBuzzing, score, cardCount, isLeader, delay = 0 }) {
  const connected = player.connected !== false;
  const initials = player.name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const pts = (score || 0).toLocaleString();
  const cls = [
    styles.player,
    isActive && styles.turn,
    isBuzzing && styles.buzzing,
    !connected && styles.offline,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      style={{ '--c': playerColor(player.name), animationDelay: `${delay}ms` }}
      title={`${player.name} · ${pts} pts · ${cardCount} cards${connected ? '' : ' · reconnecting'}`}
    >
      <div className={styles.avatar}>
        {initials}
        <span className={styles.count} aria-label={`${cardCount} cards`}>{cardCount}</span>
        {isActive && <span className={styles.turnTag}>TURN</span>}
      </div>
      <div className={styles.meta}>
        <span className={styles.name}>
          {player.name.split(' ')[0]}
          {isLeader && <span className={styles.crown} aria-label="Leader">👑</span>}
        </span>
        <span className={styles.score}>{connected ? pts : 'Reconnecting…'}</span>
      </div>
    </div>
  );
}

export default React.memo(PlayerSeat);
