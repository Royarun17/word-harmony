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

  const isMyTurn = session.turnOrder?.[session.currentTurnIndex] === playerId;
  const isBuzzingPhase = session.phase === 'buzzing';
  const buzzerEnabled = session.firstRoundOver;
  const canBuzz = buzzerEnabled && !hasBuzzed && isMyTurn && (session.phase === 'playing' || session.phase === 'buzzing');
  const currentTurnPlayer = session.players?.find(p => p.id === session.turnOrder?.[session.currentTurnIndex]);
  const starterPlayer = session.players?.find(p => p.id === session.starterPlayerId);

  // Listen for hand updates
  useEffect(() => {
    const fn = ({ hand: h, isStarter: s }) => {
      setHand(h || []);
      setIsStarter(!!s);
    };
    socket.on(`hand_update_${playerId}`, fn);
    return () => socket.off(`hand_update_${playerId}`, fn);
  }, [playerId]);

  // Show flash when card arrives
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

  const medals = ['🥇', '🥈', '🥉'];

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
              ? <span className="badge badge-muted">🔒 Buzzer locked — waiting for {starterPlayer?.name}</span>
              : <span className="badge badge-teal">🔓 Buzzer unlocked</span>}
            <span className="badge badge-ink">Round {session.currentRound}/{session.rounds}</span>
          </div>
        </div>

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
                You have 4 cards. Select one to pass — buzzer unlocks for everyone after your first pass.
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
            <div className={`turn-banner ${isMyTurn ? '' : 'waiting'}`} style={{ marginBottom: 16 }}>
              {isMyTurn
                ? `🎯 Your turn — you have ${hand.length} cards, select one to pass`
                : `Waiting for ${currentTurnPlayer?.name || '…'} to pass a card`}
            </div>

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
                    {isMyTurn ? 'Select a card to pass clockwise' : 'Collect 3 cards with the same meaning'}
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
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  <p>Dealing cards…</p>
                </div>
              ) : (
                <div className="flex gap-16" style={{ flexWrap: 'wrap' }}>
                  {hand.map((word, i) => (
                    <GameCard
                      key={`${word}-${i}`}
                      word={word}
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
                {!buzzerEnabled
                  ? `🔒 Locked until ${starterPlayer?.name} makes their first pass`
                  : hasBuzzed ? '✅ You buzzed!'
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
                No announcement needed — buzz silently on your turn
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
              <PlayerList
                players={session.players || []}
                hostId={session.hostId}
                currentTurnId={session.turnOrder?.[session.currentTurnIndex]}
                totalScores={session.totalScores}
              />
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
                <p><strong>Buzzer:</strong> {buzzerEnabled ? '🔓 Open' : '🔒 Locked'}</p>
                <p><strong>Phase:</strong> {isBuzzingPhase ? '🚨 Buzzing!' : '🃏 Trading'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
