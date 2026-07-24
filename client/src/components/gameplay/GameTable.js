import React from 'react';
import { BuzzButton, PlayerAvatar } from '../../SynapseComponents';
import PlayerSeat from './PlayerSeat';
import TimerBar from './TimerBar';
import styles from './gameplay.module.css';

const SEAT_POSITIONS = ['top', 'right-top', 'right-bot', 'left-top', 'left-bot'];

function GameTable({
  otherPlayers, turnPlayerId, lastBuzzerId, totalScores, handCounts,
  ready, canBuzz, buzzed, buzzerLocked, onBuzz, timerPercent, urgency,
  buzzWindowLeft, me, myScore, myCardCount, isMyTurn,
}) {
  const seatPositions = SEAT_POSITIONS.slice(0, otherPlayers.length);
  const statusLabel = buzzerLocked ? '🔒 Locked' : buzzed ? '✓ Buzzed' : canBuzz ? '🔓 Open' : '⏳ Waiting';

  return (
    <div className={styles.tableWrap}>
      <div className={`table-oval ${styles.table}`}>
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
              <PlayerAvatar name="You" seed={me.name} active={isMyTurn} buzzing={me.id === lastBuzzerId} compact size="lg" />
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
}

export default React.memo(GameTable);
