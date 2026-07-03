import React from 'react';
import { AvatarDisplay } from './AvatarPicker';

export default function PlayerList({ players, hostId, currentTurnId, totalScores }) {
  return (
    <div className="flex-col gap-8">
      {players.map(p => (
        <div
          key={p.id}
          className={`player-chip ${p.id === hostId ? 'host' : ''} ${p.id === currentTurnId ? 'active' : ''} ${!p.connected ? 'disconnected' : ''}`}
        >
          <AvatarDisplay avatar={p.avatar} size={40} fallbackLetter={p.name.charAt(0).toUpperCase()} />
          <div className="flex-col" style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {p.name}
              {p.id === hostId && <span className="badge badge-gold" style={{ marginLeft: 8, fontSize: 10 }}>Host</span>}
              {p.isBot && <span className="badge badge-muted" style={{ marginLeft: 8, fontSize: 10 }}>🤖 Bot</span>}
              {!p.connected && !p.isBot && <span className="badge badge-muted" style={{ marginLeft: 8, fontSize: 10 }}>Away</span>}
            </span>
            {currentTurnId === p.id && (
              <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 500 }}>● Taking turn</span>
            )}
          </div>
          {totalScores && (
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', minWidth: 32, textAlign: 'right' }}>
              {totalScores[p.id] || 0}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
