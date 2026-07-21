import React from 'react';
import socket from '../utils/socket';
import { PlayerAvatar, SectionHeader, Confetti, ThemeSwitcher } from '../SynapseComponents';

function Podium({ place, h, player, session, big }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {place === 1 && <span style={{ fontSize: 24, animation: 'syn-float 2.4s ease-in-out infinite', display: 'block' }}>🏆</span>}
      <PlayerAvatar name={player?.name || '?'} seed={player?.name} compact size={big ? 'lg' : 'md'} active={place === 1} />
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-dim)' }}>{player?.name?.split(' ')[0] || '?'}</div>
      <div style={{
        width: 80, height: h, borderRadius: '10px 10px 0 0', position: 'relative', overflow: 'hidden',
        background: place === 1 ? 'linear-gradient(180deg, var(--accent), var(--accent-2))' : 'linear-gradient(180deg, var(--surface-3), var(--surface))',
        border: '1px solid var(--border-strong)',
        boxShadow: place === 1 ? 'var(--glow-accent), var(--shadow-lift)' : 'var(--shadow-lift)',
        display: 'grid', placeItems: 'center',
      }}>
        <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-display)', color: place === 1 ? 'var(--accent-ink)' : 'var(--ink)' }}>{place}</div>
      </div>
    </div>
  );
}

export default function ScoringPage({ session, playerId, isHost, scoringData }) {
  const players = session.players || [];
  const isLastRound = session.currentRound >= session.rounds;
  function handleNext() { socket.emit('next_round', { sessionId: session.id }); }

  if (!scoringData) return (
    <div className="scene" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 99, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}/>
        <p style={{ color: 'var(--ink-dim)', fontFamily: 'var(--font-display)', fontSize: 16 }}>Tallying scores…</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  const { buzzerLog = [], roundScores = [], synonymClusters = {} } = scoringData;
  const sorted = [...players].sort((a, b) => (session.totalScores?.[b.id] || 0) - (session.totalScores?.[a.id] || 0));
  const winner = buzzerLog[0]?.playerId === playerId;

  return (
    <div className="scene" style={{ minHeight: '100dvh', position: 'relative' }}>
      <ThemeSwitcher />
      {isLastRound && <Confetti count={70} />}
      <div className="scene-content" style={{ padding: '56px 20px 32px', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24, animation: 'syn-pop 600ms cubic-bezier(.2,.8,.2,1) both' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.32em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>
            ROUND {session.currentRound} · RESULTS
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.1, color: 'var(--ink)' }}>
            {winner ? 'You buzzed first!' : `${players.find(p => p.id === buzzerLog[0]?.playerId)?.name?.split(' ')[0] || 'Nobody'} buzzed first!`}
          </h1>
        </div>

        {/* Podium */}
        {sorted.length >= 3 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, height: 210, marginBottom: 24 }}>
            <Podium place={2} h={110} player={sorted[1]} session={session} />
            <Podium place={1} h={150} player={sorted[0]} session={session} big />
            <Podium place={3} h={80} player={sorted[2]} session={session} />
          </div>
        )}

        {/* Word of round */}
        {Object.keys(synonymClusters).length > 0 && (
          <div className="panel" style={{ padding: 16, textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>WORD OF THE ROUND</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)', marginBottom: 6 }}>{Object.keys(synonymClusters)[0]}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{(synonymClusters[Object.keys(synonymClusters)[0]] || []).join(' · ')}</div>
          </div>
        )}

        {/* Leaderboard */}
        <div style={{ marginBottom: 24 }}>
          <SectionHeader eyebrow="Leaderboard" title="Standings" />
          <div className="panel" style={{ overflow: 'hidden' }}>
            {sorted.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                background: p.id === playerId ? 'rgba(255,255,255,.03)' : undefined,
                animation: `syn-rise 400ms ${i * 80}ms both`,
              }}>
                <div className="number-tab" style={{ width: 22, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--ink-dim)' }}>{i + 1}</div>
                <PlayerAvatar name={p.name} seed={p.name} compact size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name} {p.id === playerId && <span style={{ color: 'var(--accent)' }}>· YOU</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="number-tab" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{(session.totalScores?.[p.id] || 0).toLocaleString()}</div>
                  {(roundScores.find(s => s.playerId === p.id)?.points || 0) > 0 && (
                    <div className="number-tab" style={{ fontSize: 10, fontWeight: 600, color: 'var(--win)', animation: 'syn-count 500ms both' }}>
                      +{roundScores.find(s => s.playerId === p.id)?.points}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {isHost ? (
            <>
              <button onClick={() => {}} className="btn-ghost tap-target" style={{ flex: 1 }}>🏠 Lobby</button>
              <button onClick={handleNext} className="btn-primary tap-target" style={{ flex: 2 }}>
                {isLastRound ? '🏆 Final Results' : '↺ Next Round'}
              </button>
            </>
          ) : (
            <div className="panel" style={{ flex: 1, padding: 14, textAlign: 'center' }}>
              <p style={{ color: 'var(--ink-dim)', fontSize: 14 }}>Waiting for host to continue…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
