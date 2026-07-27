import React from 'react';
import { PlayerAvatar } from '../../SynapseComponents';
import styles from './gameplay.module.css';

function ProfileCard({ player }) {
  const { name, score, cardCount, isActive, isBuzzing, isMe, connected } = player;

  return (
    <div
      className={`panel ${styles.profileCard}${isMe ? ` ${styles.profileCardMe}` : ''}${isActive ? ` ${styles.profileCardActive}` : ''}${connected === false ? ` ${styles.profileCardOffline}` : ''}`}
    >
      {isActive && <span className={styles.pfTurnTag}>TURN</span>}

      {isMe ? (
        <div
          className={`${styles.pfAvatar} ${styles.pfAvatarMe}`}
          style={{ animation: isBuzzing ? 'syn-pulse 0.7s ease-in-out infinite' : undefined }}
        >
          YOU
        </div>
      ) : (
        <PlayerAvatar name={name} seed={name} buzzing={isBuzzing} compact size="sm" />
      )}

      <div className={styles.pfName} style={isMe ? { color: 'var(--accent)' } : undefined}>
        {isMe ? 'You' : name.split(' ')[0]}
      </div>
      <div className={`num ${styles.pfScore}`}>{(score || 0).toLocaleString()}</div>

      <div className={styles.pfCards}>
        {Array.from({ length: Math.min(cardCount, 4) }).map((_, i) => (
          <div
            key={i}
            className={`${styles.pfCardDot}${i === cardCount - 1 && cardCount === 4 ? ` ${styles.pfCardDotOverflow}` : ''}`}
          />
        ))}
      </div>

      {connected === false && <span className={styles.pfReconnect} title="Reconnecting…">🔄</span>}
    </div>
  );
}

export default React.memo(ProfileCard);
