import React from 'react';
import { BuzzButton } from '../../SynapseComponents';
import PlayerSeat from './PlayerSeat';
import TimerBar from './TimerBar';
import styles from './gameplay.module.css';

const SEAT_POSITIONS = ['top', 'right-top', 'right-bot', 'left-top', 'left-bot'];

function GameTable({
  otherPlayers, turnPlayerId, lastBuzzerId, totalScores, handCounts,
  ready, canBuzz, buzzed, buzzerLocked, onBuzz, timerPercent, urgency,
  buzzWindowLeft,
}) {
  const seatPositions = SEAT_POSITIONS.slice(0, otherPlayers.length);
  const statusLabel = buzzerLocked ? '🔒 Locked' : buzzed ? '✓ Buzzed' : canBuzz ? '🔓 Open' : '⏳ Waiting';

  return (
    <div className={styles.tableWrap}>
      <div className={`table-oval ${styles.table}`}>
        <div className={styles.tableGrid} aria-hidden />

        <div className={styles.buzzArea}>
          <BuzzButton ready={ready} disabled={!canBuzz} onClick={onBuzz} />
        </div>

        <div className={styles.buzzStatusRow}>
          <span className={`chip${canBuzz ? ' chip-accent' : ''}`} style={{ fontSize: 10 }}>{statusLabel}</span>
          {buzzWindowLeft > 0 && !buzzed && (
            <span className="chip chip-accent" style={{ fontSize: 10 }}>⚡ {buzzWindowLeft}s</span>
          )}
        </div>

        {!buzzerLocked && <TimerBar percent={timerPercent} urgency={urgency} />}

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
      </div>
    </div>
  );
}

export default React.memo(GameTable);
