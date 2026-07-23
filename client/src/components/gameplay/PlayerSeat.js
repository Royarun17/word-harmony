import React from 'react';
import { PlayerAvatar } from '../../SynapseComponents';
import styles from './gameplay.module.css';

const SEAT_CLASS = {
  'top': styles.seatTop,
  'right-top': styles.seatRightTop,
  'right-bot': styles.seatRightBot,
  'left-top': styles.seatLeftTop,
  'left-bot': styles.seatLeftBot,
};

function PlayerSeat({ player, position, isActive, isBuzzing, score, cardCount }) {
  const large = position === 'top';
  const connected = player.connected !== false;
  return (
    <div className={`${styles.seat} ${SEAT_CLASS[position] || ''}`}>
      <div className={`${styles.seatInner}${!connected ? ` ${styles.disconnected}` : ''}`}>
        <PlayerAvatar name={player.name} seed={player.name} active={isActive} buzzing={isBuzzing} compact size={large ? 'lg' : 'md'} />
        <div className={styles.seatName}>
          <span>{player.name.split(' ')[0]} · {score || 0}</span>
          {!connected && <span className={styles.reconnectIcon} title="Reconnecting…">🔄</span>}
        </div>
        <div className={`${styles.cardStack} stack-cards`}>
          {Array.from({ length: Math.min(cardCount, 4) }).map((_, ci) => (
            <div
              key={ci}
              className={`${styles.cardBack}${ci === cardCount - 1 && cardCount === 4 ? ` ${styles.overflow}` : ''}`}
              style={{
                width: large ? 20 : 16,
                height: large ? 28 : 22,
                marginLeft: ci > 0 ? -8 : 0,
                transform: `rotate(${(ci - 1) * 8}deg)`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(PlayerSeat);
