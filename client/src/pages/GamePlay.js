import React, { useState, useEffect } from 'react';
import socket from '../utils/socket';
import GameCard from '../components/GameCard';
import PlayerList from '../components/PlayerList';

export default function GamePlay({ session, playerId }) {
  const [hand, setHand] = useState([]);
  const [isStarter, setIsStarter] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [buzzerLog, setBuzzerLog] = useState([]);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [justReceivedCard, setJustReceivedCard] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [buzzerUnlockedMsg, setBuzzerUnlockedMsg] = useState(false);
  const timerRef = React.useRef(null);

  const isMyTurn = session.turnOrder?.[session.currentTurnIndex] === playerId;
  const isBuzzingPhase = session.phase === 'buzzing';
  const buzzerEnabled = session.firstRoundOver;
  const canBuzz = !hasBuzzed && isMyTurn;
  const currentTurnPlayer = session.players?.find(p => p.id === session.turnOrder?.[session.currentTurnIndex]);
  const starterPlayer = session.players?.find(p => p.id === session.starterPlayerId);
  const medals = ['🥇', '🥈', '🥉'];

  // Hand updates
  useEffect(() => {
    const fn = ({ hand: h, isStarter: s }) => { setHand(h || []); setIsStarter(!!s); };
    socket.on(`hand_update_${playerId}`, fn);
    return () => socket.off(`hand_update_${playerId}`, fn);
  }, [playerId]);

  // Card received flash
  useEffect(() => {
    const fn = ({ toPlayerId }) => {
      if (toPlayerId === playerId) {
        setJustReceivedCard(true);
        setTimeout(() => setJustReceivedCard(false), 2000);
      }
    };
    socket.on('card_incoming', fn);
    return () => socket.off('card_incoming', fn);
  }, [playerId]);

  // Turn timer countdown
  useEffect(() => {
    const fn = ({ seconds }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(seconds);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
    };
    socket.on('turn_timer', fn);
    return () => { socket.off('turn_timer', fn); if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Auto-passed notification
  useEffect(() => {
    const fn = () => { setTimeLeft(null); if (timerRef.current) clearInterval(timerRef.current); };
    socket.on('auto_passed', fn);
    return () => socket.off('auto_passed', fn);
  }, []);

  // Buzzer unlocked notification
  useEffect(() => {
    const fn = () => {
      setBuzzerUnlockedMsg(true);
      setTimeout(() => setBuzzerUnlockedMsg(false), 4000);
    };
    socket.on('buzzer_unlocked', fn);
    return () => socket.off('buzzer_unlocked', fn);
  }, []);

  // Buzzer events
  useEffect(() => {
    const fn = ({ playerId: bid, buzzerLog: log }) => {
      setBuzzerLog(log);
      if (bid === playerId) setHasBuzzed(true);
    };
    socket.on('buzzer_pressed', fn);
    return () => socket.off('buzzer_pressed', fn);
  }, [playerId]);

  // Reset on new round
  useEffect(() => {
    setHasBuzzed(false);
    setBuzzerLog([]);
    setSelectedCard(null);
    setJustReceivedCard(false);
    setTimeLeft(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [session.currentRound]);

  function handleSelectCard(word) {
    if (!isMyTurn || isBuzzingPhase) return;
    setSelectedCard(prev => prev === word ? null : word);
  }

  function handlePassCard() {
    if (!selectedCard || !isMyTurn) return;
    socket.emit('pass_card', { sessionId: session.id, playerId, cardToPass: selectedCard });
    setSelectedCard(null);
  }

  function handleBuzzer() {
    if (!canBuzz) return;
    socket.emit('press_buzzer', { sessionId: session.id, playerId });
  }

  return (
    <div className="page" style={{ paddingTop: 24 }}>
      <div className="container-lg">

        {/* Header */}
        <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 28, lineHeight: 1 }}>Word Harmony</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Round {session.currentRound} of {session.rounds}</p>
          </div>
          <div className="flex gap-8 items-center">
            {!buzzerEnabled
              ? <span className="badge badge-gold">⚠️ Round 1 active — buzzer invalid</span>
              : <span className="badge badge-teal">🔓 Buzzer open</span>}
            <span className="badge badge-ink">Round {session.currentRound}/{session.rounds}</span>
          </div>
        </div>

        {/* Buzzer unlocked flash */}
        {buzzerUnlockedMsg && (
          <div style={{
            background: 'var(--teal)', color: 'white',
            borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 16,
            textAlign: 'center', fontWeight: 700, fontSize: 16,
            animation: 'slideDown 0.3s ease'
          }}>
            🔓 Round 1 complete! Buzzer is now unlocked — buzz on your turn!
          </div>
        )}

        {/* Starter banner */}
        {isStarter && !session.firstRoundOver && (
          <div style={{
            background: 'var(--gold-light)', border: '2px solid var(--gold)',
            borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <span style={{ fontSize: 24 }}>⭐</span>
            <div>
              <p style={{ fontWeight: 700, color: '#7A5200', fontSize: 15 }}>You start this round!</p>
              <p style={{ fontSize: 13, color: '#7A5200' }}>
                You have 4 cards. Pass one to begin — buzzing before cards go all the way around counts as invalid!
              </p>
            </div>
          </div>
        )}

        {/* Card received flash */}
        {justReceivedCard && !isMyTurn && (
          <div style={{
            background: 'var(--teal-light)', border: '2px solid var(--teal)',
            borderRadius: 'var(--radius-md)', padding: '12px 18px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 20 }}>📨</span>
            <p style={{ fontSize: 14, color: 'var(--teal)', fontWeight: 600 }}>
              A card was added to your hand! You now have {hand.length} cards.
            </p>
          </div>
        )}

        <div className="flex gap-24" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>

            {/* Turn banner */}
            <div className={`turn-banner ${isMyTurn ? '' : 'waiting'}`} style={{ marginBottom: 8 }}>
              {isBuzzingPhase
                ? isMyTurn ? '🚨 Your turn to buzz!' : `Waiting for ${currentTurnPlayer?.name} to buzz…`
                : isMyTurn
                  ? `🎯 Your turn — ${hand.length} cards, select one to pass`
                  : `Waiting for ${currentTurnPlayer?.name || '…'} to pass a card`}
            </div>

            {/* Timer bar */}
            {timeLeft !== null && (
              <div style={{ marginBottom: 16 }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: timeLeft <= 3 ? 'var(--danger)' : 'var(--muted)', fontWeight: 600 }}>
                    {isMyTurn
                      ? isBuzzingPhase ? `⏱ ${timeLeft}s to buzz or auto-buzzed!` : `⏱ ${timeLeft}s to pass or auto-passes!`
                      : `⏱ ${timeLeft}s remaining`}
                  </span>
                  <span style={{
                    fontSize: 22, fontWeight: 900,
                    color: timeLeft <= 3 ? 'var(--danger)' : timeLeft <= 6 ? 'var(--gold)' : 'var(--teal)'
                  }}>{timeLeft}</span>
                </div>
                <div style={{ height: 10, background: 'var(--blush)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 5,
                    background: timeLeft <= 3 ? 'var(--danger)' : timeLeft <= 6 ? 'var(--gold)' : 'var(--teal)',
                    width: `${(timeLeft / 30) * 100}%`,
                    transition: 'width 1s linear, background 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            {/* Hand */}
            <div className="panel" style={{ marginBottom: 20 }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                    Your Hand
                    <span className="badge badge-muted" style={{ marginLeft: 10, fontSize: 12 }}>
                      {hand.length} card{hand.length !== 1 ? 's' : ''}
                    </span>
                    {hand.length === 4 && (
                      <span className="badge badge-gold" style={{ marginLeft: 8, fontSize: 12 }}>
                        {isMyTurn ? 'Pick one to pass!' : 'Card received!'}
                      </span>
                    )}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {isBuzzingPhase ? 'Buzzing phase — wait for your turn to buzz' : isMyTurn ? 'Select a card to pass clockwise' : 'Collect 3 cards with the same meaning'}
                  </p>
                </div>
                {isMyTurn && selectedCard && !isBuzzingPhase && (
                  <button className="btn btn-primary" onClick={handlePassCard}>
                    Pass "{selectedCard}" →
                  </button>
                )}
              </div>

              {hand.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} /><p>Dealing cards…</p>
                </div>
              ) : (
                <div className="flex gap-16" style={{ flexWrap: 'wrap' }}>
                  {hand.map((word, i) => (
                    <GameCard
                      key={`${word}-${i}`} word={word}
                      selected={selectedCard === word}
                      onClick={() => handleSelectCard(word)}
                      disabled={!isMyTurn || isBuzzingPhase}
                      label={isMyTurn && !isBuzzingPhase ? 'tap to select' : ''}
                    />
                  ))}
                </div>
              )}

              {isMyTurn && !selectedCard && !isBuzzingPhase && hand.length > 0 && (
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12, textAlign: 'center' }}>
                  ↑ Tap a card to select it, then click Pass
                </p>
              )}
            </div>

            {/* Buzzer */}
            <div className="panel text-center">
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Buzzer
              </p>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
                {hasBuzzed ? '✅ You buzzed!'
                  : !buzzerEnabled && isMyTurn ? '⚠️ Round 1 still active — buzzing now scores 0 points!'
                  : isBuzzingPhase && isMyTurn ? '🚨 Someone buzzed — now it\'s your turn to buzz!'
                  : isMyTurn ? '🟢 Your turn — buzz if you have 3 synonyms!'
                  : '⏳ Wait for your turn to buzz'}
              </p>

              <div className="flex justify-center" style={{ marginBottom: 16 }}>
                <button
                  className={`buzzer-btn ${canBuzz ? 'ready' : ''}`}
                  onClick={handleBuzzer}
                  disabled={!canBuzz}
                  aria-label="Press buzzer"
                >
                  BUZZ!
                </button>
              </div>

              <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                {buzzerEnabled ? 'Buzz on your turn — system checks your cards automatically' : '⚠️ Buzzing now counts as invalid — wait for Round 1 to complete'}
              </p>

              {buzzerLog.length > 0 && (
                <div style={{ marginTop: 20, textAlign: 'left' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Buzzer order:</p>
                  {buzzerLog.map((b, i) => {
                    const p = session.players?.find(pl => pl.id === b.playerId);
                    return (
                      <div key={b.playerId} className="flex items-center gap-8" style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 18 }}>{medals[i] || `#${i + 1}`}</span>
                        <span style={{ fontSize: 14, fontWeight: b.playerId === playerId ? 700 : 400 }}>
                          {p?.name} {b.playerId === playerId ? '(you)' : ''}
                        </span>
                        <span className={`badge ${b.hasCompleteSet ? 'badge-teal' : 'badge-muted'}`} style={{ marginLeft: 'auto', fontSize: 11 }}>
                          {b.autoBuzzed ? 'auto' : b.hasCompleteSet ? '✓ valid' : '✗ invalid'}
                        </span>
                      </div>
                    );
                  })}
                  {isBuzzingPhase && buzzerLog.length < (session.players?.length || 0) && (
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
                      Waiting for {(session.players?.length || 0) - buzzerLog.length} more to buzz…
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ width: 240, flexShrink: 0 }}>
            <div className="panel">
              <h3 style={{ fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                Players & Scores
              </h3>
              <PlayerList players={session.players || []} hostId={session.hostId}
                currentTurnId={session.turnOrder?.[session.currentTurnIndex]} totalScores={session.totalScores} />
            </div>

            <div className="panel" style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                How to Win
              </h3>
              <ol style={{ paddingLeft: 18, fontSize: 13, color: 'var(--muted)', lineHeight: 2 }}>
                <li>Collect 3 synonym cards</li>
                <li>Wait for your turn</li>
                <li>Press buzzer silently</li>
                <li>Buzz first = most points</li>
              </ol>
            </div>

            <div className="panel" style={{ marginTop: 16, background: 'var(--blush)' }}>
              <h3 style={{ fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                This Round
              </h3>
              <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.8 }}>
                <p><strong>Starter:</strong> {starterPlayer?.name || '—'}</p>
                <p><strong>Buzzer:</strong> {buzzerEnabled ? '🔓 Open' : '⚠️ Invalid'}</p>
                <p><strong>Phase:</strong> {isBuzzingPhase ? '🚨 Buzzing!' : '🃏 Trading'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
