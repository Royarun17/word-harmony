import React from 'react';
import socket from '../utils/socket';

export default function ScoringPage({ session, playerId, isHost, scoringData }) {
  const isFunMode = session?.gameMode === 'fun';

  function nextRound() {
    socket.emit('next_round', { sessionId: session.id });
  }

  // Still loading
  if (!scoringData) {
    return (
      <div className="page-center">
        <div className="spinner" style={{ marginBottom: 16 }} />
        <p style={{ color: 'var(--muted)' }}>Tallying scores…</p>
      </div>
    );
  }

  const isLastRound = session.currentRound >= session.rounds;
  const medals = ['🥇', '🥈', '🥉'];

  // Sort by buzzer order
  const sortedScores = [...scoringData.roundScores].sort((a, b) => a.buzzerOrder - b.buzzerOrder);

  return (
    <div className="page">
      <div className="container-sm" style={{ paddingTop: 40 }}>
        <div className="text-center" style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 42, marginBottom: 8 }}>Round {scoringData.round} Results</h1>
          <p style={{ color: 'var(--muted)' }}>
            {isLastRound
              ? 'Final round!'
              : `${session.rounds - scoringData.round} round${session.rounds - scoringData.round !== 1 ? 's' : ''} remaining`}
          </p>
        </div>

        {/* Round scores */}
        <div className="panel" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 16, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            This Round
          </h3>
          <div className="flex-col gap-8">
            {sortedScores.map((r, i) => (
              <div key={r.playerId} className={`score-row ${r.points > 0 ? 'winner' : ''}`}>
                <span style={{ fontSize: 22, minWidth: 28 }}>
                  {r.points > 0 ? (medals[i] || '⭐') : r.invalid ? '⚠️' : '❌'}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>
                    {r.playerName} {r.playerId === playerId ? '(you)' : ''}
                  </p>
                  <div className="flex gap-8 items-center" style={{ marginTop: 4, flexWrap: 'wrap' }}>
                    {r.hand?.map(w => (
                      <span key={w} className={`badge ${r.hasCompleteSet ? 'badge-teal' : 'badge-muted'}`} style={{ fontSize: 11 }}>
                        {w}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {r.invalid ? '⚠️ Buzzed before Round 1 — invalid'
                      : r.hasCompleteSet ? '✓ Complete set!'
                      : '✗ No matching set'}
                  </p>
                </div>
                <span style={{
                  fontWeight: 800, fontSize: 20,
                  color: r.points > 0 ? 'var(--gold)' : 'var(--muted)',
                  minWidth: 48, textAlign: 'right'
                }}>
                  +{r.points}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Word clusters revealed */}
        <div className="panel" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 16, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {isFunMode ? '🎉 Topic Clusters This Round' : '📚 Synonym Clusters This Round'}
          </h3>
          <div className="flex-col gap-12">
            {Object.entries(scoringData.synonymClusters).map(([word, synonyms]) => (
              <div key={word} style={{ background: 'var(--blush)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
                  {isFunMode ? 'Topic:' : 'Based on:'} <strong style={{ color: 'var(--ink)' }}>{word}</strong>
                </p>
                <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                  {synonyms.map(s => (
                    <span key={s} className="badge badge-ink" style={{ fontSize: 13 }}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="panel" style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 16, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Leaderboard
          </h3>
          <div className="flex-col gap-8">
            {[...scoringData.totalScores]
              .sort((a, b) => b.total - a.total)
              .map((p, i) => (
                <div key={p.playerId} className="flex items-center gap-12" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, fontSize: 16, minWidth: 20, color: 'var(--muted)' }}>#{i + 1}</span>
                  <span style={{ flex: 1, fontWeight: p.playerId === playerId ? 700 : 400, fontSize: 15 }}>
                    {p.playerName} {p.playerId === playerId ? '(you)' : ''}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>{p.total}</span>
                </div>
              ))}
          </div>
        </div>

        {isHost ? (
          <button className="btn btn-gold btn-lg w-full" onClick={nextRound}>
            {isLastRound ? 'See Final Results →' : 'Next Round →'}
          </button>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14, padding: '16px 0' }}>
            Waiting for the host to continue…
          </div>
        )}
      </div>
    </div>
  );
}
