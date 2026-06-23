import React from 'react';
import socket from '../utils/socket';
import PlayerList from '../components/PlayerList';

export default function WaitingRoom({ session, playerId, isHost }) {
  const minPlayers = 3;
  const canStart = session.players.length >= minPlayers;

  function startGame() {
    socket.emit('start_submission', { sessionId: session.id });
  }

  return (
    <div className="page-center">
      <div className="container-sm">
        <div className="text-center" style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 38, marginBottom: 6 }}>Waiting Room</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>
            Share the code so your friends can join
          </p>
        </div>

        {/* Session code */}
        <div style={{
          background: 'var(--ink)', color: 'var(--gold)',
          borderRadius: 'var(--radius-lg)', padding: '24px 32px',
          textAlign: 'center', marginBottom: 28
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(245,223,160,0.6)', marginBottom: 8 }}>SESSION CODE</p>
          <span style={{ fontFamily: 'monospace', fontSize: 44, fontWeight: 900, letterSpacing: '0.18em' }}>{session.id}</span>
        </div>

        {/* Info row */}
        <div className="flex gap-12 justify-center" style={{ marginBottom: 28 }}>
          <span className="badge badge-teal">{session.rounds} Rounds</span>
          <span className="badge badge-gold">{session.players.length} / 8 Players</span>
          {!canStart && (
            <span className="badge badge-muted">Need {minPlayers - session.players.length} more</span>
          )}
        </div>

        {/* Players */}
        <div className="panel" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Players Joined
          </h3>
          <PlayerList players={session.players} hostId={session.hostId} />
        </div>

        {isHost ? (
          <button
            className="btn btn-gold btn-lg w-full"
            onClick={startGame}
            disabled={!canStart}
          >
            {canStart ? 'Start Game →' : `Waiting for ${minPlayers - session.players.length} more player${minPlayers - session.players.length !== 1 ? 's' : ''}…`}
          </button>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14, padding: '16px 0' }}>
            Waiting for the host to start…
          </div>
        )}
      </div>
    </div>
  );
}
