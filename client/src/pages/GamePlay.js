import React, { useState, useEffect, useMemo } from 'react';
import socket from '../utils/socket';
import { WordCard, BuzzButton, PlayerAvatar, TimerRing, Confetti, BackCard, ThemeSwitcher } from './SynapseComponents';

export default function GamePlay({ session, playerId, onExit }) {
  const [selected, setSelected] = useState(null);
  const [showExit, setShowExit] = useState(false);
  const [buzzed, setBuzzed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const players    = session.players || [];
  const myPlayer   = players.find(p => p.id === playerId);
  const myHand     = session.hands?.[playerId] || [];
  const turnPlayer = players.find(p => p.id === session.currentTurn);
  const isMyTurn   = session.currentTurn === playerId;
  const timerPct   = ((session.timer || 30) / 30) * 100;
  const buzzerOpen = session.phase === 'buzzing';
  const buzzerLocked = !session.firstRoundOver;

  const matchCount = useMemo(() => {
    if (!session.synonymClusters) return 0;
    const counts = {};
    for (const word of myHand) {
      for (const [topic, words] of Object.entries(session.synonymClusters)) {
        if (words.includes(word.toLowerCase())) { counts[topic] = (counts[topic] || 0) + 1; }
      }
    }
    return Math.max(0, ...Object.values(counts));
  }, [myHand, session.synonymClusters]);

  const ready = matchCount >= 3 && buzzerOpen && !buzzerLocked;

  function handlePass() {
    if (!selected || !isMyTurn) return;
    socket.emit('pass_card', { sessionId: session.id, playerId, card: selected });
    setSelected(null);
  }

  function handleBuzz() {
    if (!ready || buzzed) return;
    setBuzzed(true);
    setShowConfetti(true);
    socket.emit('press_buzzer', { sessionId: session.id, playerId });
    setTimeout(() => setShowConfetti(false), 3000);
  }

  const myHandTopic = useMemo(() => {
    if (!session.wordSubmissions) return myPlayer?.name || 'Word';
    return session.wordSubmissions[playerId] || 'Word';
  }, [session.wordSubmissions, playerId, myPlayer]);

  // Seat positions for players
  const otherPlayers = players.filter(p => p.id !== playerId);
  const seatPositions = ['top', 'right-top', 'right-bot', 'left-top', 'left-bot'].slice(0, otherPlayers.length);

  function getSeatStyle(pos) {
    switch(pos) {
      case 'top':       return { top: -12, left: '50%', transform: 'translateX(-50%)' };
      case 'right-top': return { top: '18%', right: -12 };
      case 'right-bot': return { bottom: '18%', right: -12 };
      case 'left-top':  return { top: '18%', left: -12 };
      case 'left-bot':  return { bottom: '18%', left: -12 };
      default: return {};
    }
  }

  function getSeatAlign(pos) {
    if (pos.startsWith('right')) return 'right';
    if (pos.startsWith('left')) return 'left';
    return 'center';
  }

  return (
    <div className="syn-scene" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ThemeSwitcher />
      {showConfetti && <Confetti count={60} />}

      <div className="syn-scene-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '48px 16px 12px' }}>
          <button onClick={() => setShowExit(true)} style={{ width: 40, height: 40, borderRadius: 99, background: 'oklch(0 0 0 / 0.3)', border: '1px solid oklch(1 0 0 / 0.1)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink)', fontSize: 18 }}>←</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.24em', fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase' }}>ROUND</div>
              <div className="num" style={{ fontSize: 15, fontWeight: 700 }}>{session.currentRound}/{session.rounds}</div>
            </div>
            <TimerRing progress={timerPct} seconds={session.timer || 30} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.24em', fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase' }}>MODE</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{session.gameMode === 'education' ? 'Syntax' : 'Spark'}</div>
            </div>
          </div>

          <button style={{ width: 40, height: 40, borderRadius: 99, background: 'oklch(0 0 0 / 0.3)', border: '1px solid oklch(1 0 0 / 0.1)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink)', fontSize: 14 }}>ℹ</button>
        </div>

        {/* Prompt banner */}
        <div style={{ padding: '0 16px 12px' }}>
          <div className="syn-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--accent)', fontSize: 16 }}>✦</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.24em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 2 }}>YOUR PROMPT</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Collect 3 {session.gameMode === 'education' ? 'synonyms' : 'associations'} of "{myHandTopic}"
              </div>
            </div>
            <span className="syn-chip num">{matchCount}/3</span>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, position: 'relative', margin: '0 16px', minHeight: 260 }}>
          <div className="syn-table-oval" style={{ position: 'absolute', inset: '8px 8px 8px 8px' }}>
            {/* Neural grid overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(110deg, transparent 0 14px, oklch(from var(--accent) l c h / 0.06) 14px 15px), radial-gradient(circle at 50% 50%, oklch(from var(--accent) l c h / 0.1), transparent 65%)', animation: 'syn-flow 6s linear infinite', pointerEvents: 'none' }}/>

            {/* Centre card / buzz area */}
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <BuzzButton ready={ready} disabled={buzzed || !buzzerOpen || buzzerLocked} onClick={handleBuzz} />
            </div>

            {/* Buzzer status */}
            <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
              <span className={`syn-chip${buzzerOpen && !buzzerLocked ? ' syn-chip-accent' : ''}`} style={{ fontSize: 10 }}>
                {buzzerLocked ? '🔒 Locked' : buzzerOpen ? '🔓 Open' : '⏳ Waiting'}
              </span>
            </div>

            {/* Other players */}
            {otherPlayers.map((p, i) => {
              const pos = seatPositions[i];
              const isActive = p.id === session.currentTurn;
              const cardCount = (session.hands?.[p.id] || []).length;
              return (
                <div key={p.id} style={{ position: 'absolute', ...getSeatStyle(pos) }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <PlayerAvatar name={p.name} seed={p.name} active={isActive} buzzing={p.id === session.lastBuzzer} compact size={pos === 'top' ? 'lg' : 'md'} />
                    <div className="num" style={{ fontSize: 10, color: 'var(--ink-mute)', textAlign: 'center' }}>
                      {p.name.split(' ')[0]} · {session.totalScores?.[p.id] || 0}
                    </div>
                    {/* Face down cards */}
                    <div style={{ display: 'flex', gap: -8 }}>
                      {Array.from({ length: Math.min(cardCount, 4) }).map((_, ci) => (
                        <div key={ci} style={{ width: pos === 'top' ? 20 : 16, height: pos === 'top' ? 28 : 22, borderRadius: 4, background: 'linear-gradient(160deg, var(--surface-2), var(--surface))', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', marginLeft: ci > 0 ? -8 : 0, transform: `rotate(${(ci - 1) * 8}deg)`, ...(ci === cardCount - 1 && cardCount === 4 ? { border: '1px solid var(--warn)' } : {}) }}/>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Your hand */}
        <div style={{ padding: '8px 12px 0' }}>
          {isMyTurn && (
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <span className="syn-chip syn-chip-accent" style={{ fontSize: 11 }}>Your turn — select a card to pass</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: -20, paddingBottom: 4 }}>
            {myHand.map((word, i) => {
              const offset = i - (myHand.length - 1) / 2;
              const rotate = offset * 5;
              const y = Math.abs(offset) * 4;
              const isSelected = selected === word;
              const isMatch = matchCount >= 3 && session.synonymClusters && Object.entries(session.synonymClusters).some(([, words]) => words.includes(word.toLowerCase()) && myHand.filter(w => words.includes(w.toLowerCase())).length >= 3);
              return (
                <div key={word} style={{ transform: `translateY(${y}px) rotate(${rotate}deg)`, transformOrigin: '50% 100%', transition: 'transform 220ms cubic-bezier(.2,.8,.2,1)', zIndex: isSelected ? 10 : 1 + i, marginLeft: i > 0 ? -28 : 0, animation: `syn-deal 600ms ${i * 80}ms cubic-bezier(.2,.8,.2,1) both` }}>
                  <WordCard word={word.charAt(0).toUpperCase() + word.slice(1)} kind={isMatch ? 'match' : 'normal'} selected={isSelected} onClick={() => setSelected(isSelected ? null : word)} small />
                </div>
              );
            })}
          </div>

          {/* Pass / Buzz row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px' }}>
            <button onClick={() => setSelected(null)} className="syn-btn-ghost tap" style={{ flex: 1, minHeight: 52, fontSize: 14 }}>Pass</button>
            {selected && isMyTurn && (
              <button onClick={handlePass} className="syn-btn-primary tap" style={{ flex: 2, minHeight: 52, fontSize: 14 }}>
                Pass "{selected.charAt(0).toUpperCase() + selected.slice(1)}" →
              </button>
            )}
            <button className="syn-btn-ghost tap" style={{ flex: 1, minHeight: 52, fontSize: 14 }}>Keep</button>
          </div>
        </div>
      </div>

      {/* Exit dialog */}
      {showExit && (
        <div style={{ position: 'fixed', inset: 0, background: 'oklch(0 0 0 / 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div className="syn-panel" style={{ padding: 24, width: '100%', maxWidth: 380, textAlign: 'center', animation: 'syn-pop 300ms cubic-bezier(.2,.8,.2,1)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚪</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Leave game?</h2>
            <p style={{ fontSize: 14, color: 'var(--ink-dim)', marginBottom: 20 }}>Your spot will be held for 90 seconds.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowExit(false)} className="syn-btn-ghost tap" style={{ flex: 1 }}>Stay</button>
              <button onClick={onExit} className="syn-btn-primary tap" style={{ flex: 1 }}>Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
