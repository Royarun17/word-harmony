import React from 'react';
import { PlayerAvatar, Confetti, ThemeSwitcher } from '../SynapseComponents';

export default function GameEnded({ finalScores, playerId, onPlayAgain }) {
  const sorted = [...(finalScores || [])].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sorted[0];
  const isWinner = winner?.playerId === playerId;

  return (
    <div className="syn-scene" style={{ minHeight: '100vh', padding: '0 16px 32px' }}>
      <ThemeSwitcher />
      <Confetti count={80} />

      <div className="syn-scene-content" style={{ paddingTop: 52 }}>

        {/* Winner hero */}
        <div style={{ textAlign: 'center', marginBottom: 24, animation: 'syn-pop 400ms cubic-bezier(.2,.8,.2,1) both' }}>
          <div style={{ fontSize: 80, lineHeight: 1, marginBottom: 12, animation: 'syn-float 3s ease-in-out infinite' }}>🏆</div>
          <h1 style={{ fontSize: isWinner ? 48 : 36, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.1, color: 'var(--accent)', marginBottom: 8 }}>
            {isWinner ? 'You won!' : `${winner?.playerName} wins!`}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-dim)' }}>
            {isWinner ? 'Congratulations!' : 'Great game everyone!'}
          </p>
        </div>

        {/* Podium */}
        {sorted.length >= 3 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, height: 220, marginBottom: 24 }}>
            {[sorted[1], sorted[0], sorted[2]].map((p, idx) => {
              const place = idx === 1 ? 1 : idx === 0 ? 2 : 3;
              const h = place === 1 ? 150 : place === 2 ? 110 : 80;
              const big = place === 1;
              const you = p?.playerId === playerId;
              return (
                <div key={p?.playerId || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  {place === 1 && <span style={{ fontSize: 22, animation: 'syn-float 2.4s ease-in-out infinite' }}>🏆</span>}
                  <PlayerAvatar name={p?.playerName || '?'} seed={p?.playerName} compact size={big ? 'lg' : 'md'} active={place === 1} />
                  <div style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{p?.playerName?.split(' ')[0]}</div>
                  <div style={{ width: 72, height: h, borderRadius: '10px 10px 0 0', background: place === 1 ? 'linear-gradient(180deg, var(--accent), var(--accent-2))' : 'linear-gradient(180deg, var(--surface-3), var(--surface))', border: `1px solid ${place === 1 ? 'oklch(from var(--accent) l c h / 0.35)' : 'var(--border)'}`, boxShadow: place === 1 ? 'var(--glow-accent)' : 'var(--shadow-lift)', display: 'grid', placeItems: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-display)', color: place === 1 ? 'var(--accent-ink)' : 'var(--ink)' }}>{place}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Final leaderboard */}
        <div className="syn-panel" style={{ overflow: 'hidden', marginBottom: 20 }}>
          {sorted.map((p, i) => (
            <div key={p.playerId} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
              background: p.playerId === playerId ? 'oklch(from var(--accent) l c h / 0.05)' : undefined,
              animation: `syn-rise 400ms ${i * 80}ms both`,
            }}>
              <span style={{ fontSize: 18, width: 28 }}>{['🥇','🥈','🥉'][i] || `${i+1}`}</span>
              <PlayerAvatar name={p.playerName || '?'} seed={p.playerName} compact size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {p.playerName} {p.playerId === playerId && <span style={{ color: 'var(--accent)' }}>· YOU</span>}
                </div>
              </div>
              <div className="num" style={{ fontSize: 18, fontWeight: 700, color: i === 0 ? 'var(--accent)' : 'var(--ink-dim)' }}>
                {p.totalScore.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onPlayAgain} className="syn-btn-primary tap" style={{ width: '100%' }}>Play again</button>
          <button onClick={onPlayAgain} className="syn-btn-ghost tap" style={{ width: '100%' }}>Back to lobby</button>
        </div>
      </div>
    </div>
  );
}
