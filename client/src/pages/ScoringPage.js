import React from 'react';
import socket from '../utils/socket';
import { PlayerAvatar, SectionHeader, Confetti, ThemeSwitcher } from '../SynapseComponents';

const MEDALS = ['🥇','🥈','🥉'];

function Podium({ place, h, player, session, you, big }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {place === 1 && <span style={{ fontSize: 22, animation: 'syn-float 2.4s ease-in-out infinite', display: 'block' }}>🏆</span>}
      <PlayerAvatar name={player?.name || '?'} seed={player?.name} compact size={big ? 'lg' : 'md'} active={place === 1} />
      <div style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{player?.name?.split(' ')[0] || '?'}</div>
      <div style={{
        width: 72, height: h, borderRadius: '10px 10px 0 0', position: 'relative', overflow: 'hidden',
        background: place === 1 ? 'linear-gradient(180deg, var(--accent), var(--accent-2))' : 'linear-gradient(180deg, var(--surface-3), var(--surface))',
        border: `1px solid ${place === 1 ? 'oklch(from var(--accent) l c h / 0.35)' : 'var(--border)'}`,
        boxShadow: place === 1 ? 'var(--glow-accent)' : 'var(--shadow-lift)',
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
    <div className="syn-scene" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 99, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}/>
        <p style={{ color: 'var(--ink-dim)', fontFamily: 'var(--font-display)', fontSize: 16 }}>Tallying scores…</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  const { buzzerLog = [], roundScores = [], definitions = {}, synonymClusters = {} } = scoringData;

  // Top 3 for podium
  const sorted = [...players].sort((a, b) => (session.totalScores?.[b.id] || 0) - (session.totalScores?.[a.id] || 0));
  const top3 = [sorted[1], sorted[0], sorted[2]]; // 2nd, 1st, 3rd for podium layout

  return (
    <div className="syn-scene" style={{ minHeight: '100vh', padding: '0 0 32px' }}>
      <ThemeSwitcher />
      {isLastRound && <Confetti count={60} />}

      <div className="syn-scene-content" style={{ padding: '52px 16px 0' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20, animation: 'syn-pop 600ms cubic-bezier(.2,.8,.2,1) both' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.32em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>
            ROUND {session.currentRound} · RESULTS
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
            {buzzerLog[0]?.playerId === playerId ? 'You buzzed first!' : `${players.find(p => p.id === buzzerLog[0]?.playerId)?.name?.split(' ')[0] || 'Nobody'} buzzed first!`}
          </h1>
        </div>

        {/* Podium */}
        {players.length >= 3 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, height: 200, marginBottom: 20 }}>
            <Podium place={2} h={100} player={sorted[1]} session={session} you={sorted[1]?.id === playerId} />
            <Podium place={1} h={140} player={sorted[0]} session={session} you={sorted[0]?.id === playerId} big />
            <Podium place={3} h={70} player={sorted[2]} session={session} you={sorted[2]?.id === playerId} />
          </div>
        )}

        {/* Word of round */}
        {Object.keys(synonymClusters).length > 0 && (
          <div className="syn-panel" style={{ padding: 16, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.24em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>WORD OF THE ROUND</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 6 }}>{Object.keys(synonymClusters)[0]}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{(synonymClusters[Object.keys(synonymClusters)[0]] || []).join(' · ')}</div>
          </div>
        )}

        {/* Leaderboard */}
        <div style={{ marginBottom: 20 }}>
          <SectionHeader eyebrow="Leaderboard" title="Standings" />
          <div className="syn-panel" style={{ overflow: 'hidden' }}>
            {sorted.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                background: p.id === playerId ? 'oklch(1 0 0 / 0.03)' : undefined,
                animation: `syn-rise 400ms ${i * 80}ms both`,
              }}>
                <div className="num" style={{ width: 22, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--ink-dim)' }}>{i + 1}</div>
                <PlayerAvatar name={p.name} seed={p.name} compact size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name} {p.id === playerId && <span style={{ color: 'var(--accent)' }}>· YOU</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="num" style={{ fontSize: 16, fontWeight: 700 }}>{(session.totalScores?.[p.id] || 0).toLocaleString()}</div>
                  {(roundScores.find(s => s.playerId === p.id)?.points || 0) > 0 && (
                    <div className="num" style={{ fontSize: 11, fontWeight: 600, color: 'var(--win)', animation: 'syn-count 500ms both' }}>
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
              <button onClick={() => {}} className="syn-btn-ghost tap" style={{ flex: 1 }}>🏠 Lobby</button>
              <button onClick={handleNext} className="syn-btn-primary tap" style={{ flex: 2 }}>
                {isLastRound ? '🏆 Final Results' : '↺ Next Round'}
              </button>
            </>
          ) : (
            <div className="syn-panel" style={{ flex: 1, padding: 14, textAlign: 'center' }}>
              <p style={{ color: 'var(--ink-dim)', fontSize: 14 }}>Waiting for host to continue…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
