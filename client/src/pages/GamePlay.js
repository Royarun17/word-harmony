import React, { useState, useEffect, useRef } from 'react';
import socket from '../utils/socket';
import { AvatarDisplay } from '../components/AvatarPicker';

// Face-down card back SVG
function CardBack({ width = 52, height = 74, isExtra = false }) {
  return (
    <svg width={width} height={height} viewBox="0 0 52 74" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect x="1" y="1" width="50" height="72" rx="8"
        fill={isExtra ? '#FFF8E8' : '#EDE8DF'}
        stroke={isExtra ? '#C8930C' : '#1A1A2E'}
        strokeWidth={isExtra ? 2 : 1.2}
      />
      <rect x="4" y="4" width="44" height="66" rx="6" fill="none" stroke={isExtra ? '#C8930C' : '#1A1A2E'} strokeWidth="0.5" opacity="0.25"/>
      {isExtra && <circle cx="44" cy="7" r="4" fill="#C8930C"/>}
    </svg>
  );
}

// Face-up card with word
function WordCard({ word, selected, disabled, onClick }) {
  return (
    <svg
      width="88" height="124" viewBox="0 0 88 124" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={!disabled ? onClick : undefined}
      style={{ cursor: disabled ? 'default' : 'pointer', flexShrink: 0, transition: 'transform 0.15s ease', transform: selected ? 'translateY(-6px)' : 'translateY(0)' }}
    >
      <rect x="1.5" y="1.5" width="85" height="121" rx="11"
        fill={selected ? '#FFF8E8' : '#FFFFFF'}
        stroke={selected ? '#C8930C' : disabled ? '#D6CDB8' : '#1A1A2E'}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      <rect x="5" y="5" width="78" height="114" rx="8" fill="none"
        stroke={selected ? '#C8930C' : '#1A1A2E'}
        strokeWidth="0.5" opacity={disabled ? 0.1 : 0.2}
      />
      <text x="44" y="58" textAnchor="middle" fontFamily="Georgia,serif" fontSize="13" fontWeight="700"
        fill={selected ? '#C8930C' : disabled ? '#9B8E7A' : '#1A1A2E'}
      >{word}</text>
      <text x="44" y="76" textAnchor="middle" fontFamily="Georgia,serif" fontSize="9"
        fill={selected ? '#C8930C' : '#9B8E7A'} opacity={disabled ? 0.5 : 0.8}
      >{selected ? 'selected' : disabled ? '' : 'tap to select'}</text>
    </svg>
  );
}

// Opponent panel — transparent bg, just border
function OpponentPanel({ player, isTurn, totalScores, buzzed, hasCompleteSet, cardOrientation = 'top' }) {
  const cardCount = isTurn ? 4 : 3;
  const buzzEntry = buzzed;

  return (
    <div style={{
      background: 'transparent',
      borderRadius: 10,
      padding: '10px 12px',
      border: isTurn ? '1.5px solid #1A8C8C' : '0.5px solid #D6CDB8',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      transition: 'border-color 0.2s ease',
      position: 'relative',
    }}>
      {isTurn && (
        <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#1A8C8C', color: '#fff', fontSize: 9, fontWeight: 500, padding: '1px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>
          their turn
        </div>
      )}
      {buzzEntry && (
        <div style={{ position: 'absolute', top: -10, right: 8, background: hasCompleteSet ? '#1A8C5A' : '#C0392B', color: '#fff', fontSize: 9, fontWeight: 500, padding: '1px 6px', borderRadius: 99 }}>
          {hasCompleteSet ? 'buzzed ✓' : 'buzzed ✗'}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <AvatarDisplay avatar={player.avatar} size={28} fallbackLetter={player.name.charAt(0).toUpperCase()} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#1A1A2E', fontFamily: 'Georgia,serif' }}>{player.name}</div>
          <div style={{ fontSize: 10, color: '#C8930C' }}>{totalScores?.[player.id] || 0} pts</div>
        </div>
      </div>

      {/* Face-down cards */}
      {cardOrientation === 'top' ? (
        <div style={{ position: 'relative', width: 108, height: 82 }}>
          <svg width="108" height="82" viewBox="0 0 108 82" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(0,6) rotate(-12, 27, 38)">
              <rect x="1" y="1" width="52" height="74" rx="8" fill="#EDE8DF" stroke="#1A1A2E" strokeWidth="1.2"/>
            </g>
            {cardCount >= 3 && (
              <g transform="translate(56,6) rotate(12, 27, 38)">
                <rect x="1" y="1" width="52" height="74" rx="8" fill="#EDE8DF" stroke="#1A1A2E" strokeWidth="1.2"/>
              </g>
            )}
            <g transform="translate(28,0)">
              <rect x="1" y="1" width="52" height="74" rx="8" fill={isTurn ? '#FFF8E8' : '#F7F2EA'} stroke={isTurn ? '#C8930C' : '#1A1A2E'} strokeWidth={isTurn ? 2 : 1.5}/>
              <rect x="4" y="4" width="46" height="68" rx="6" fill="none" stroke={isTurn ? '#C8930C' : '#1A1A2E'} strokeWidth="0.5" opacity="0.25"/>
              {isTurn && <circle cx="48" cy="7" r="4" fill="#C8930C"/>}
            </g>
          </svg>
        </div>
      ) : (
        /* Side orientation — stacked vertically */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', width: 58, height: cardCount === 4 ? 94 : 78 }}>
          {Array.from({ length: cardCount }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', top: i * 18, left: 0 }}>
              <CardBack width={52} height={60} isExtra={isTurn && i === cardCount - 1} />
            </div>
          ))}
        </div>
      )}

      {!player.connected && <span style={{ fontSize: 9, color: '#9B8E7A' }}>away</span>}
    </div>
  );
}

export default function GamePlay({ session, playerId, onExit }) {
  const [hand, setHand] = useState([]);
  const [isStarter, setIsStarter] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [buzzerLog, setBuzzerLog] = useState([]);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [buzzerWindowOpen, setBuzzerWindowOpen] = useState(false);
  const [buzzerWindowTime, setBuzzerWindowTime] = useState(null);
  const [buzzerRaceActive, setBuzzerRaceActive] = useState(false);
  const [buzzerUnlockedMsg, setBuzzerUnlockedMsg] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const timerRef = useRef(null);
  const buzzerTimerRef = useRef(null);

  const players = session.players || [];
  const myIndex = players.findIndex(p => p.id === playerId);
  const myPlayer = players[myIndex];
  const isMyTurn = session.turnOrder?.[session.currentTurnIndex] === playerId;
  const isBuzzingPhase = session.phase === 'buzzing';
  const buzzerEnabled = session.firstRoundOver;
  const isFunMode = session?.gameMode === 'fun';
  const isStarterLocked = isStarter && !session.firstRoundOver;
  const hasFourCards = hand.length >= 4;
  const canBuzz = !hasBuzzed && !isStarterLocked && (buzzerRaceActive || buzzerWindowOpen || (buzzerEnabled && isMyTurn && !hasFourCards));

  // Layout: others around the table
  const others = players.filter(p => p.id !== playerId);
  const topPlayers = others.length <= 2 ? others.slice(0, 1) : others.slice(0, others.length - 2);
  const leftPlayer = others.length >= 3 ? others[others.length - 2] : null;
  const rightPlayer = others.length >= 2 ? others[others.length - 1] : null;

  const currentTurnPlayer = players.find(p => p.id === session.turnOrder?.[session.currentTurnIndex]);
  const starterPlayer = players.find(p => p.id === session.starterPlayerId);
  const medals = ['🥇', '🥈', '🥉'];

  useEffect(() => {
    const fn = ({ hand: h, isStarter: s }) => { setHand(h || []); setIsStarter(!!s); };
    socket.on(`hand_update_${playerId}`, fn);
    return () => socket.off(`hand_update_${playerId}`, fn);
  }, [playerId]);

  useEffect(() => {
    const fn = ({ seconds }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(seconds);
      timerRef.current = setInterval(() => setTimeLeft(p => { if (p <= 1) { clearInterval(timerRef.current); return 0; } return p - 1; }), 1000);
    };
    socket.on('turn_timer', fn);
    return () => { socket.off('turn_timer', fn); if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    const fn = () => { setTimeLeft(null); if (timerRef.current) clearInterval(timerRef.current); };
    socket.on('auto_passed', fn); return () => socket.off('auto_passed', fn);
  }, []);

  useEffect(() => {
    const fn = ({ playerId: pid, seconds }) => {
      if (pid !== playerId) return;
      setBuzzerWindowOpen(true); setBuzzerWindowTime(seconds);
      if (buzzerTimerRef.current) clearInterval(buzzerTimerRef.current);
      buzzerTimerRef.current = setInterval(() => setBuzzerWindowTime(p => {
        if (p <= 1) { clearInterval(buzzerTimerRef.current); setBuzzerWindowOpen(false); return 0; } return p - 1;
      }), 1000);
    };
    socket.on('buzzer_window_open', fn);
    return () => { socket.off('buzzer_window_open', fn); if (buzzerTimerRef.current) clearInterval(buzzerTimerRef.current); };
  }, [playerId]);

  useEffect(() => {
    const fn = ({ playerId: pid }) => { if (pid === playerId) { setBuzzerWindowOpen(false); setBuzzerWindowTime(null); } };
    socket.on('buzzer_window_closed', fn); return () => socket.off('buzzer_window_closed', fn);
  }, [playerId]);

  useEffect(() => {
    const fn = () => setBuzzerRaceActive(true);
    socket.on('buzzer_race_started', fn); return () => socket.off('buzzer_race_started', fn);
  }, []);

  useEffect(() => {
    const fn = () => { setBuzzerUnlockedMsg(true); setTimeout(() => setBuzzerUnlockedMsg(false), 4000); };
    socket.on('buzzer_unlocked', fn); return () => socket.off('buzzer_unlocked', fn);
  }, []);

  useEffect(() => {
    const fn = ({ playerId: bid, buzzerLog: log }) => { setBuzzerLog(log); if (bid === playerId) setHasBuzzed(true); };
    socket.on('buzzer_pressed', fn); return () => socket.off('buzzer_pressed', fn);
  }, [playerId]);

  useEffect(() => {
    setHasBuzzed(false); setBuzzerLog([]); setSelectedCard(null);
    setTimeLeft(null); setBuzzerWindowOpen(false); setBuzzerWindowTime(null); setBuzzerRaceActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (buzzerTimerRef.current) clearInterval(buzzerTimerRef.current);
  }, [session.currentRound]);

  useEffect(() => {
    const fn = ({ toPlayerId }) => {
      if (toPlayerId === playerId && hand.length === 0) {
        socket.emit('request_hand', { sessionId: session.id, playerId });
      }
    };
    socket.on('card_incoming', fn); return () => socket.off('card_incoming', fn);
  }, [playerId, hand.length, session.id]);

  useEffect(() => {
    window.history.pushState({ gameState: 'playing' }, '');
    function handlePopState() { setShowExitConfirm(true); window.history.pushState({ gameState: 'playing' }, ''); }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function handleSelectCard(w) { if (!isMyTurn || isBuzzingPhase) return; setSelectedCard(p => p === w ? null : w); }
  function handlePassCard() {
    if (!selectedCard || !isMyTurn) return;
    socket.emit('pass_card', { sessionId: session.id, playerId, cardToPass: selectedCard });
    setSelectedCard(null);
  }
  function handleBuzzer() { if (!canBuzz) return; socket.emit('press_buzzer', { sessionId: session.id, playerId }); }

  const buzzerHint = () => {
    if (hasBuzzed) return 'Buzzed!';
    if (isStarterLocked) return 'Buzzer unlocks when cards return to you';
    if (buzzerRaceActive) return 'Race — buzz now!';
    if (buzzerWindowOpen) return `${buzzerWindowTime}s — buzz now!`;
    if (hasFourCards && isMyTurn) return 'Pass a card first, then buzz';
    if (!buzzerEnabled) return 'Round 1 — buzzing scores 0';
    if (buzzerEnabled && isMyTurn) return 'Buzz if you have 3 matching cards';
    return 'Pass a card to open your 3s window';
  };

  const buzzBg = hasBuzzed ? '#D6CDB8' : buzzerRaceActive || buzzerWindowOpen ? '#C8930C' : canBuzz ? '#C8930C' : '#E8C4B0';
  const buzzColor = hasBuzzed ? '#9B8E7A' : buzzerRaceActive || buzzerWindowOpen || canBuzz ? '#fff' : '#8B3A1A';

  return (
    <div style={{ minHeight: '100vh', background: '#F7F2EA', display: 'flex', flexDirection: 'column' }}>

      {/* Exit confirm */}
      {showExitConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(27,42,59,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#F7F2EA', borderRadius: 14, padding: 28, maxWidth: 320, width: '90%', textAlign: 'center', border: '0.5px solid #D6CDB8' }}>
            <h2 style={{ fontSize: 20, fontFamily: 'Georgia,serif', color: '#1A1A2E', marginBottom: 10 }}>Exit game?</h2>
            <p style={{ color: '#9B8E7A', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>Your spot is held for 1.5 minutes — rejoin with the session code.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowExitConfirm(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '0.5px solid #D6CDB8', background: 'transparent', fontWeight: 500, cursor: 'pointer', fontSize: 13, color: '#1A1A2E', fontFamily: 'Georgia,serif' }}>No, stay</button>
              <button onClick={() => { setShowExitConfirm(false); onExit?.(); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#1A1A2E', color: '#F7F2EA', fontWeight: 500, cursor: 'pointer', fontSize: 13, fontFamily: 'Georgia,serif' }}>Yes, exit</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid #E8E0D0' }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: '#1A1A2E', fontFamily: 'Georgia,serif' }}>Word Harmony</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 99, background: '#1A1A2E', color: '#F7F2EA', fontWeight: 500 }}>Round {session.currentRound}/{session.rounds}</span>
          <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 99, background: '#E8F4F4', color: '#1A8C8C', fontWeight: 500 }}>{isFunMode ? 'Fun' : 'Education'}</span>
          {buzzerEnabled && <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 99, background: '#FEF3E2', color: '#854F0B', fontWeight: 500 }}>Buzzer open</span>}
        </div>
      </div>

      {/* Notifications */}
      {buzzerUnlockedMsg && (
        <div style={{ background: '#1A8C8C', color: '#fff', padding: '8px 16px', textAlign: 'center', fontWeight: 500, fontSize: 13 }}>
          Buzzer unlocked — pass a card, then buzz in the 3s window
        </div>
      )}
      {buzzerRaceActive && !hasBuzzed && (
        <div style={{ background: '#C8930C', color: '#fff', padding: '8px 16px', textAlign: 'center', fontWeight: 500, fontSize: 13 }}>
          Buzzer race — buzz now!
        </div>
      )}

      {/* Table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '16px', gap: 10, maxWidth: 640, margin: '0 auto', width: '100%' }}>

        {/* TOP opponents */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {topPlayers.map(p => {
            const buzzEntry = buzzerLog.find(b => b.playerId === p.id);
            return <OpponentPanel key={p.id} player={p} isTurn={session.turnOrder?.[session.currentTurnIndex] === p.id} totalScores={session.totalScores} buzzed={!!buzzEntry} hasCompleteSet={buzzEntry?.hasCompleteSet} cardOrientation="top" />;
          })}
        </div>

        {/* MIDDLE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>

          {/* Left */}
          <div style={{ minWidth: 90 }}>
            {leftPlayer && (() => {
              const buzzEntry = buzzerLog.find(b => b.playerId === leftPlayer.id);
              return <OpponentPanel player={leftPlayer} isTurn={session.turnOrder?.[session.currentTurnIndex] === leftPlayer.id} totalScores={session.totalScores} buzzed={!!buzzEntry} hasCompleteSet={buzzEntry?.hasCompleteSet} cardOrientation="side" />;
            })()}
          </div>

          {/* Centre — timer + buzzer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ background: '#1A8C8C', borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 500, color: '#fff', textAlign: 'center', width: '100%' }}>
              {isBuzzingPhase ? 'Buzzer race!' : isMyTurn ? `Your turn — ${hand.length} cards` : `${currentTurnPlayer?.name || '…'}'s turn`}
            </div>

            {timeLeft !== null && !isBuzzingPhase && (
              <div style={{ width: '100%', maxWidth: 160 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: timeLeft <= 5 ? '#C0392B' : '#9B8E7A' }}>{timeLeft}s</span>
                  <span style={{ fontSize: 10, fontWeight: 500, color: timeLeft <= 5 ? '#C0392B' : '#1A8C8C' }}>{timeLeft}</span>
                </div>
                <div style={{ height: 4, background: '#E8E0D0', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: timeLeft <= 5 ? '#C0392B' : timeLeft <= 10 ? '#C8930C' : '#1A8C8C', width: `${(timeLeft / 30) * 100}%`, transition: 'width 1s linear' }} />
                </div>
              </div>
            )}

            {buzzerWindowOpen && (
              <div style={{ background: '#C8930C', borderRadius: 8, padding: '4px 14px', color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'Georgia,serif' }}>
                {buzzerWindowTime}s
              </div>
            )}

            <button
              onClick={handleBuzzer}
              disabled={!canBuzz}
              style={{ width: 76, height: 76, borderRadius: '50%', background: buzzBg, border: `1.5px solid ${canBuzz ? '#A67412' : '#D6CDB8'}`, color: buzzColor, fontSize: 13, fontWeight: 500, cursor: canBuzz ? 'pointer' : 'not-allowed', fontFamily: 'Georgia,serif', transition: 'all 0.2s ease', transform: canBuzz ? 'scale(1.05)' : 'scale(1)' }}
            >
              BUZZ!
            </button>
            <span style={{ fontSize: 10, color: '#9B8E7A', textAlign: 'center', maxWidth: 120, lineHeight: 1.5 }}>{buzzerHint()}</span>

            {/* Buzzer log */}
            {buzzerLog.length > 0 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {buzzerLog.map((b, i) => {
                  const p = players.find(pl => pl.id === b.playerId);
                  return (
                    <div key={b.playerId} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{medals[i] || `#${i + 1}`}</span>
                      <AvatarDisplay avatar={p?.avatar} size={18} fallbackLetter={p?.name?.charAt(0)?.toUpperCase() || '?'} />
                      <span style={{ fontSize: 11, fontWeight: b.playerId === playerId ? 500 : 400, color: '#1A1A2E', fontFamily: 'Georgia,serif' }}>{p?.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px', borderRadius: 99, background: b.hasCompleteSet ? '#E8F4F4' : '#FBE8E8', color: b.hasCompleteSet ? '#1A8C8C' : '#C0392B' }}>
                        {b.invalid ? 'invalid' : b.hasCompleteSet ? 'match' : 'no match'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right */}
          <div style={{ minWidth: 90 }}>
            {rightPlayer && (() => {
              const buzzEntry = buzzerLog.find(b => b.playerId === rightPlayer.id);
              return <OpponentPanel player={rightPlayer} isTurn={session.turnOrder?.[session.currentTurnIndex] === rightPlayer.id} totalScores={session.totalScores} buzzed={!!buzzEntry} hasCompleteSet={buzzEntry?.hasCompleteSet} cardOrientation="side" />;
            })()}
          </div>
        </div>

        {/* MY AREA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>

          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AvatarDisplay avatar={myPlayer?.avatar} size={36} fallbackLetter={myPlayer?.name?.charAt(0)?.toUpperCase() || '?'} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A2E', fontFamily: 'Georgia,serif' }}>{myPlayer?.name || 'You'}</div>
              <div style={{ fontSize: 10, color: '#C8930C' }}>{session.totalScores?.[playerId] || 0} pts</div>
            </div>
            {isMyTurn && !isBuzzingPhase && (
              <span style={{ fontSize: 9, background: '#E8F4F4', color: '#1A8C8C', borderRadius: 99, padding: '1px 8px', fontWeight: 500, marginLeft: 4 }}>your turn</span>
            )}
            {hasBuzzed && (
              <span style={{ fontSize: 9, background: '#F0E6D3', color: '#9B8E7A', borderRadius: 99, padding: '1px 8px', fontWeight: 500, marginLeft: 4 }}>buzzed</span>
            )}
          </div>

          <span style={{ fontSize: 10, fontWeight: 500, color: '#9B8E7A', letterSpacing: '.06em' }}>your hand</span>

          {/* Face-up cards */}
          {hand.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9B8E7A', fontSize: 13, fontFamily: 'Georgia,serif' }}>Dealing cards…</div>
          ) : (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {hand.map((w, i) => (
                <WordCard key={`${w}-${i}`} word={w} selected={selectedCard === w} disabled={!isMyTurn || isBuzzingPhase} onClick={() => handleSelectCard(w)} />
              ))}
            </div>
          )}

          {isMyTurn && selectedCard && !isBuzzingPhase && (
            <button onClick={handlePassCard} style={{ background: '#1A1A2E', border: 'none', borderRadius: 8, padding: '8px 20px', color: '#F7F2EA', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>
              Pass "{selectedCard}" →
            </button>
          )}
          {isMyTurn && !selectedCard && !isBuzzingPhase && hand.length > 0 && (
            <span style={{ fontSize: 10, color: '#9B8E7A' }}>Tap a card to select it</span>
          )}
        </div>

      </div>
    </div>
  );
}
