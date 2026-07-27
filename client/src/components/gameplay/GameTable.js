import React, { forwardRef } from 'react';
import { BuzzButton } from '../../SynapseComponents';
import PlayerSeat from './PlayerSeat';
import TimerBar from './TimerBar';
import styles from './gameplay.module.css';

const SEAT_POSITIONS = ['top', 'right-top', 'right-bot', 'left-top', 'left-bot'];

const GameTable = forwardRef(function GameTable({
  otherPlayers, turnPlayerId, lastBuzzerId, totalScores, handCounts,
  ready, canBuzz, buzzed, buzzerLocked, onBuzz, timerPercent, urgency,
  buzzWindowLeft, me, myScore, myCardCount, isMyTurn, dropActive,
}, ref) {
  const seatPositions = SEAT_POSITIONS.slice(0, otherPlayers.length);
  const statusLabel = buzzerLocked ? '🔒 Locked' : buzzed ? '✓ Buzzed' : canBuzz ? '🔓 Open' : '⏳ Waiting';

  return (
    <div className={styles.tableWrap}>
      <div ref={ref} className={`table-oval ${styles.table}${dropActive ? ` ${styles.dropActive}` : ''}`}>
        <div className={styles.tableGrid} aria-hidden />
        <div className={styles.trackRing} aria-hidden />

        <div className={styles.buzzArea}>
          <BuzzButton ready={ready} disabled={!canBuzz} onClick={onBuzz} />
        </div>

        <div className={styles.buzzStatusRow}>
          <span className={`chip${canBuzz ? ' chip-accent' : ''}`} style={{ fontSize: 10 }}>{statusLabel}</span>
          {buzzWindowLeft > 0 && !buzzed && (
            <span className="chip chip-accent" style={{ fontSize: 10 }}>⚡ {buzzWindowLeft}s</span>
          )}
          {dropActive && <span className="chip chip-accent" style={{ fontSize: 10 }}>↓ Release to pass</span>}
        </div>

        <TimerBar percent={buzzerLocked ? 100 : timerPercent} urgency={buzzerLocked ? 'normal' : urgency} />

        {otherPlayers.map((p, i) => (
          <PlayerSeat
            key={p.id}
            player={p}
            position={seatPositions[i]}
            isActive={p.id === turnPlayerId}
            isBuzzing={p.id === lastBuzzerId}
            score={totalScores?.[p.id]}
            cardCount={handCounts?.[p.id] ?? 0}
          />
        ))}

        {me && (
          <div className={styles.seatYou}>
            <div className={styles.seatInner}>
              <div className={isMyTurn ? 'avatar-active' : ''} style={{ position: 'relative' }}>
                <div className="avatar-ring">
                  <div
                    className={styles.youAvatar}
                    style={{ animation: me.id === lastBuzzerId ? 'syn-pulse 0.7s ease-in-out infinite' : undefined }}
                  >
                    YOU
                  </div>
                  {isMyTurn && (
                    <span className="chip chip-accent" style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', letterSpacing: '0.14em', padding: '2px 8px', fontSize: 9, whiteSpace: 'nowrap' }}>TURN</span>
                  )}
                </div>
              </div>
              <div className={styles.seatName}><span>You · {myScore || 0}</span></div>
              <div className={`${styles.cardStack} stack-cards`} style={{ order: -1, marginBottom: 4 }}>
                {Array.from({ length: Math.min(myCardCount, 4) }).map((_, ci) => (
                  <div
                    key={ci}
                    className={styles.cardBack}
                    style={{ width: 20, height: 28, marginLeft: ci > 0 ? -8 : 0, transform: `rotate(${(ci - 1) * 8}deg)` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default React.memo(GameTable);
