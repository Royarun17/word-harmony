import React from 'react';

export default function GameEnded({ finalScores, playerId, onPlayAgain }) {
  const medals = ['🥇', '🥈', '🥉'];
  const myRank = finalScores.findIndex(p => p.playerId === playerId);
  const winner = finalScores[0];

  return (
    <div className="page-center" style={{ background: 'var(--ink)', minHeight: '100vh' }}>
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.04,
        backgroundImage: 'radial-gradient(circle, var(--parchment) 1px, transparent 1px)',
        backgroundSize: '32px 32px', pointerEvents: 'none'
      }} />

      <div className="container-sm" style={{ position: 'relative' }}>
        <div className="text-center" style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 46, color: 'var(--gold)', marginBottom: 8 }}>
            Game Over
          </h1>
          <p style={{ color: 'rgba(247,242,232,0.7)', fontSize: 16 }}>
            {winner?.playerName} wins with {winner?.total} points!
          </p>
        </div>

        <div className="panel" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Final Standings
          </h3>
          <div className="flex-col gap-8">
            {finalScores.map((p, i) => (
              <div key={p.playerId}
                className="flex items-center gap-12"
                style={{
                  padding: '14px 16px', borderRadius: 'var(--radius-md)',
                  background: p.playerId === playerId ? 'var(--gold-light)' : i === 0 ? 'var(--blush)' : 'var(--white)',
                  border: `1px solid ${p.playerId === playerId ? 'var(--gold)' : 'var(--border)'}`,
                }}>
                <span style={{ fontSize: 24, minWidth: 32 }}>{medals[i] || `#${i + 1}`}</span>
                <span style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>
                  {p.playerName}
                  {p.playerId === playerId && <span className="badge badge-gold" style={{ marginLeft: 8, fontSize: 11 }}>You</span>}
                </span>
                <span style={{ fontWeight: 900, fontSize: 22, color: i === 0 ? 'var(--gold)' : 'var(--ink)' }}>
                  {p.total}
                </span>
              </div>
            ))}
          </div>
        </div>

        {myRank === 0 && (
          <div style={{ textAlign: 'center', marginBottom: 20, color: 'rgba(247,242,232,0.7)', fontSize: 15 }}>
            🎉 Congratulations! You're the Word Harmony champion!
          </div>
        )}

        <button className="btn btn-gold btn-lg w-full" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
