import React from 'react';
import { PlayerAvatar, Confetti, ThemeSwitcher } from '../SynapseComponents';

const REWARDS = [
  { label: 'XP', value: '+420', icon: '📈' },
  { label: 'Coins', value: '+1,250', icon: '⭐' },
  { label: 'Streak', value: '×3', icon: '🏆' },
];

function Podium({ place, name, seed, score, winner }) {
  const heights = { 1: 140, 2: 100, 3: 80 };
  const medals = { 1: 'var(--accent)', 2: 'var(--ink-dim)', 3: 'var(--warn)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 96 }}>
      <div style={{ animation: winner ? 'syn-float 3s ease-in-out infinite, syn-pop 500ms cubic-bezier(.2,.8,.2,1) both' : 'syn-pop 500ms cubic-bezier(.2,.8,.2,1) both' }}>
        <PlayerAvatar name={name} seed={seed} size={winner ? 'lg' : 'md'} active={winner} compact />
      </div>
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 92, whiteSpace: 'nowrap' }}>{name}</div>
      <div className="number-tab" style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{typeof score === 'number' ? score.toLocaleString() : score}</div>
      <div style={{ marginTop: 8, width: '100%', height: heights[place], borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8, background: 'linear-gradient(180deg, oklch(from var(--surface-3) l c h / .9), oklch(from var(--surface) l c h / .9))', border: '1px solid var(--border)', borderBottom: 'none', boxShadow: winner ? '0 -12px 30px oklch(from var(--accent) l c h / .35)' : undefined }}>
        <div style={{ width: 28, height: 28, borderRadius: 99, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, background: `oklch(from ${medals[place]} l c h / .2)`, color: medals[place], border: `1px solid ${medals[place]}` }} className="number-tab">{place}</div>
      </div>
    </div>
  );
}

export default function GameEnded({ finalScores, playerId, onPlayAgain }) {
  const sorted = [...(finalScores || [])].sort((a, b) => b.totalScore - a.totalScore);
  const isWinner = sorted[0]?.playerId === playerId;

  return (
    <div className="scene" style={{ minHeight: '100dvh', position: 'relative' }}>
      <ThemeSwitcher />
      <Confetti count={80} />
      <div className="scene-content" style={{ padding: '56px 20px 32px', overflowY: 'auto' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.4em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>MATCH OVER</div>
          <h1 style={{ fontSize: 44, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1, color: 'var(--ink)', marginBottom: 8 }}>
            {isWinner ? 'Victory' : `${sorted[0]?.playerName} wins!`}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-dim)' }}>
            {isWinner ? 'You collected the most sets this match.' : 'Great game everyone!'}
          </p>
        </div>

        {/* Podium */}
        {sorted.length >= 3 && (
          <div style={{ position: 'relative', marginBottom: 32 }}>
            <div style={{ position: 'absolute', inset: '0 32px', top: -24, height: 160, filter: 'blur(40px)', opacity: 0.6, background: 'radial-gradient(circle, var(--accent), transparent 60%)', pointerEvents: 'none' }}/>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, position: 'relative' }}>
              <Podium place={2} name={sorted[1]?.playerName?.split(' ')[0] || '?'} seed={sorted[1]?.playerName} score={sorted[1]?.totalScore} />
              <Podium place={1} name={isWinner ? 'You' : sorted[0]?.playerName?.split(' ')[0] || '?'} seed={sorted[0]?.playerName} score={sorted[0]?.totalScore} winner />
              <Podium place={3} name={sorted[2]?.playerName?.split(' ')[0] || '?'} seed={sorted[2]?.playerName} score={sorted[2]?.totalScore} />
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="panel" style={{ padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>REWARDS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {REWARDS.map((r, i) => (
              <div key={r.label} style={{ borderRadius: 16, padding: 12, textAlign: 'center', background: 'linear-gradient(180deg, oklch(from var(--surface-3) l c h / .7), oklch(from var(--surface) l c h / .7))', border: '1px solid var(--border)', animation: `syn-pop 500ms ${i * 100}ms cubic-bezier(.2,.8,.2,1) both` }}>
                <div style={{ width: 32, height: 32, borderRadius: 99, display: 'grid', placeItems: 'center', margin: '0 auto 4px', background: 'oklch(from var(--accent) l c h / .18)', color: 'var(--accent)', fontSize: 16 }}>{r.icon}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{r.label}</div>
                <div className="number-tab" style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Season progress */}
        <div className="panel" style={{ padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.24em', fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase' }}>SEASON PROGRESS</div>
            <span className="chip chip-accent">LVL {(finalScores?.find(p => p.playerId === playerId)?.totalScore || 0) > 1000 ? '15' : '14'} →</span>
          </div>
          <div style={{ height: 12, borderRadius: 99, overflow: 'hidden', background: 'oklch(from var(--surface-3) l c h / .6)', marginBottom: 8 }}>
            <div style={{ height: '100%', width: '72%', background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', boxShadow: '0 0 12px var(--accent)' }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-mute)' }}>
            <span className="number-tab">2,880 XP</span>
            <span className="number-tab">4,000 XP</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <button onClick={onPlayAgain} className="btn-ghost tap-target">🏠 Home</button>
          <button className="btn-ghost tap-target">↗ Share</button>
          <button onClick={onPlayAgain} className="btn-primary tap-target">↺ Rematch</button>
        </div>
      </div>
    </div>
  );
}
