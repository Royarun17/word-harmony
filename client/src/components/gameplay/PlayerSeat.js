import React from 'react';
import styles from './gameplay.module.css';

const SEAT_CLASS = {
  'top': styles.seatTop,
  'right-top': styles.seatRightTop,
  'right-bot': styles.seatRightBot,
  'left-top': styles.seatLeftTop,
  'left-bot': styles.seatLeftBot,
};

// A stable per-player ring color, independent from the avatar's own gradient —
// gives each seat around the orbit a recognizable "identity color" at a glance.
function hashHue(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function PlayerSeat({ player, position, isActive, isBuzzing, score, cardCount, rank }) {
  const large = position === 'top';
  const connected = player.connected !== false;
  const hue = hashHue(player.name);
  const initials = player.name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <div className={`${styles.seat} ${SEAT_CLASS[position] || ''}`}>
      <div className={`${styles.seatInner}${!connected ? ` ${styles.disconnected}` : ''}`}>
        <div className={styles.orbitAvatarWrap}>
          <div
            className={`${styles.orbitAvatar}${isActive ? ` ${styles.orbitAvatarActive}` : ''}`}
            style={{
              width: large ? 52 : 44, height: large ? 52 : 44,
              background: `linear-gradient(140deg, hsl(${hue} 70% 58%), hsl(${(hue + 40) % 360} 70% 42%))`,
              borderColor: `hsl(${hue} 80% 62%)`,
              animation: isBuzzing ? 'syn-pulse 0.7s ease-in-out infinite' : undefined,
            }}
          >
            {initials}
          </div>
          <span className={styles.rankBadge} style={{ background: `hsl(${hue} 70% 45%)` }}>{rank}</span>
          {isActive && <span className={styles.pfTurnTag}>TURN</span>}
        </div>
        <div className={styles.seatName}>
          <span>{player.name.split(' ')[0]} · <span className="num">{(score || 0).toLocaleString()}</span></span>
          {!connected && <span className={styles.reconnectIcon} title="Reconnecting…">🔄</span>}
        </div>
        <div className={styles.cardStack}>
          {Array.from({ length: Math.min(cardCount, 4) }).map((_, ci) => (
            <div
              key={ci}
              className={`${styles.cardBack}${ci === cardCount - 1 && cardCount === 4 ? ` ${styles.overflow}` : ''}`}
              style={{
                width: large ? 20 : 16, height: large ? 28 : 22,
                marginLeft: ci > 0 ? -8 : 0,
                transform: `rotate(${(ci - 1) * 8}deg)`,
              }}
            />
          ))}
          <span className={styles.cardCountChip}>{cardCount}</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(PlayerSeat);
