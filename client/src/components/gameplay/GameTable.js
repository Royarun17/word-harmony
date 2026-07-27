import React, { forwardRef, useMemo } from 'react';
import { BuzzButton } from '../../SynapseComponents';
import ProfileCard from './ProfileCard';
import TimerBar from './TimerBar';
import styles from './gameplay.module.css';

const GameTable = forwardRef(function GameTable({
  otherPlayers, turnPlayerId, lastBuzzerId, totalScores, handCounts,
  ready, canBuzz, buzzed, buzzerLocked, onBuzz, timerPercent, urgency,
  buzzWindowLeft, me, myScore, myCardCount, isMyTurn, dropActive,
}, ref) {
  const statusLabel = buzzerLocked ? '🔒 Locked' : buzzed ? '✓ Buzzed' : canBuzz ? '🔓 Open' : '⏳ Waiting';

  const profiles = useMemo(() => {
    const others = otherPlayers.map(p => ({
      id: p.id,
      name: p.name,
      score: totalScores?.[p.id],
      cardCount: handCounts?.[p.id] ?? 0,
      isActive: p.id === turnPlayerId,
      isBuzzing: p.id === lastBuzzerId,
      isMe: false,
      connected: p.connected,
    }));
    if (!me) return others;
    return [...others, {
      id: me.id,
      name: 'You',
      score: myScore,
      cardCount: myCardCount,
      isActive: isMyTurn,
      isBuzzing: me.id === lastBuzzerId,
      isMe: true,
      connected: true,
    }];
  }, [otherPlayers, totalScores, handCounts, turnPlayerId, lastBuzzerId, me, myScore, myCardCount, isMyTurn]);

  return (
    <div ref={ref} className={`${styles.tableArea}${dropActive ? ` ${styles.dropActive}` : ''}`}>
      <div className={styles.playerGrid}>
        {profiles.map(p => <ProfileCard key={p.id} player={p} />)}
      </div>

      <div className={styles.buzzStandalone}>
        <BuzzButton ready={ready} disabled={!canBuzz} onClick={onBuzz} />
        <div className={styles.buzzStatusRow}>
          <span className={`chip${canBuzz ? ' chip-accent' : ''}`} style={{ fontSize: 10 }}>{statusLabel}</span>
          {buzzWindowLeft > 0 && !buzzed && (
            <span className="chip chip-accent" style={{ fontSize: 10 }}>⚡ {buzzWindowLeft}s</span>
          )}
          {dropActive && <span className="chip chip-accent" style={{ fontSize: 10 }}>↓ Release to pass</span>}
        </div>
        <TimerBar percent={buzzerLocked ? 100 : timerPercent} urgency={buzzerLocked ? 'normal' : urgency} />
      </div>
    </div>
  );
});

export default React.memo(GameTable);
