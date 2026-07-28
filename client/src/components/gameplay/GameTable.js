import React, { forwardRef, useMemo } from 'react';
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

  const ranks = useMemo(() => {
    const all = [...otherPlayers.map(p => p.id), ...(me ? [me.id] : [])];
    const sorted = [...all].sort((a, b) => (totalScores?.[b] || 0) - (totalScores?.[a] || 0));
    const map = {};
    sorted.forEach((id, i) => { map[id] = i + 1; });
    return map;
  }, [otherPlayers, me, totalScores]);

  return (
    <div className={styles.tableWrap}>
      <div ref={ref} className={`${styles.orbit}${dropActive ? ` ${styles.dropActive}` : ''}`}>
        <div className={styles.orbitGrid} aria-hidden />

        <svg className={styles.flowRing} viewBox="0 0 300 220" aria-hidden>
          <ellipse cx="150" cy="110" rx="140" ry="100" className={styles.flowRingTrack} />
          <ellipse cx="150" cy="110" rx="140" ry="100" className={styles.flowRingDash} />
        </svg>

        <div className={styles.centerPlinth}>
          <BuzzButton ready={ready} disabled={!canBuzz} onClick={onBuzz} />
          {isMyTurn && <span className={styles.pfTurnTag} style={{ position: 'static', marginTop: 8 }}>TURN</span>}
          <div className={styles.buzzStatusRow}>
            <span className={`chip${canBuzz ? ' chip-accent' : ''}`} style={{ fontSize: 10 }}>{statusLabel}</span>
            {buzzWindowLeft > 0 && !buzzed && (
              <span className="chip chip-accent" style={{ fontSize: 10 }}>⚡ {buzzWindowLeft}s</span>
            )}
            {dropActive && <span className="chip chip-accent" style={{ fontSize: 10 }}>↓ Release to pass</span>}
          </div>
          <TimerBar percent={buzzerLocked ? 100 : timerPercent} urgency={buzzerLocked ? 'normal' : urgency} />
        </div>

        {otherPlayers.map((p, i) => (
          <PlayerSeat
            key={p.id}
            player={p}
            position={seatPositions[i]}
            isActive={p.id === turnPlayerId}
            isBuzzing={p.id === lastBuzzerId}
            score={totalScores?.[p.id]}
            cardCount={handCounts?.[p.id] ?? 0}
            rank={ranks[p.id]}
          />
        ))}

        {me && (
          <div className={styles.seatYou}>
            <div className={styles.seatInner}>
              <div className={styles.orbitAvatarWrap}>
                <div
                  className={`${styles.orbitAvatar} ${styles.orbitAvatarMe}${isMyTurn ? ` ${styles.orbitAvatarActive}` : ''}`}
                  style={{ animation: me.id === lastBuzzerId ? 'syn-pulse 0.7s ease-in-out infinite' : undefined }}
                >
                  YOU
                </div>
                <span className={styles.rankBadge} style={{ background: 'var(--accent-2)' }}>{ranks[me.id]}</span>
                {isMyTurn && <span className={styles.pfTurnTag}>TURN</span>}
              </div>
              <div className={styles.seatName}><span>You · <span className="num">{(myScore || 0).toLocaleString()}</span></span></div>
              <div className={styles.cardStack}>
                {Array.from({ length: Math.min(myCardCount, 4) }).map((_, ci) => (
                  <div
                    key={ci}
                    className={styles.cardBack}
                    style={{ width: 20, height: 28, marginLeft: ci > 0 ? -8 : 0, transform: `rotate(${(ci - 1) * 8}deg)` }}
                  />
                ))}
                <span className={styles.cardCountChip}>{myCardCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default React.memo(GameTable);
