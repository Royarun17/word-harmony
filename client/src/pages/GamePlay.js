import React, { useState, useEffect, useRef } from 'react';
import socket from '../utils/socket';
import GameCard from '../components/GameCard';
import { AvatarDisplay } from '../components/AvatarPicker';

// Position other players around the table based on count and my index
function getTablePositions(myIndex, totalPlayers) {
  const others = [];
  for (let i = 1; i < totalPlayers; i++) {
    const idx = (myIndex + i) % totalPlayers;
    others.push(idx);
  }
  return others;
}

// Render a single opponent's panel positioned around the table
function OpponentPanel({ player, isTurn, totalScores, buzzed, hasCompleteSet }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '12px 16px', borderRadius: 'var(--radius-lg)',
      background: isTurn ? 'var(--teal-light)' : 'var(--white)',
      border: `2px solid ${isTurn ? 'var(--teal)' : 'var(--border)'}`,
      minWidth: 100, maxWidth: 140,
      boxShadow: isTurn ? '0 4px 16px rgba(26,140,140,0.2)' : 'var(--shadow-card)',
      transition: 'all 0.3s ease',
      position: 'relative',
    }}>
      {isTurn && (
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--teal)', color: 'white', fontSize: 10, fontWeight: 700,
          padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap'
        }}>THEIR TURN</div>
      )}
      {buzzed && (
        <div style={{
          position: 'absolute', top: -10, right: 8,
          background: hasCompleteSet ? 'var(--success)' : 'var(--danger)',
          color: 'white', fontSize: 10, fontWeight: 700,
          padding: '2px 6px', borderRadius: 99
        }}>
          {hasCompleteSet ? '✓ BUZZED' : '✗ BUZZED'}
        </div>
      )}
      <AvatarDisplay avatar={player.avatar} size={48} fallbackLetter={player.name.charAt(0).toUpperCase()} />
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.2 }}>
        {player.name}
      </span>
      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)' }}>
        {totalScores?.[player.id] || 0}
      </span>
      {/* Face-down cards to show how many cards they hold */}
      <div className="flex gap-4" style={{ marginTop: 2 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 18, height: 26, borderRadius: 3,
            background: 'var(--ink)', border: '1px solid var(--muted)',
            opacity: 0.7
          }} />
        ))}
      </div>
      {!player.connected && (
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Away</span>
      )}
    </div>
  );
}

export default function GamePlay({ session, playerId }) {
  const [hand, setHand] = useState([]);
  const [isStarter, setIsStarter] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [buzzerLog, setBuzzerLog] = useState([]);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [justReceived, setJustReceived] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [buzzerWindowOpen, setBuzzerWindowOpen] = useState(false);
  const [buzzerWindowTime, setBuzzerWindowTime] = useState(null);
  const [buzzerRaceActive, setBuzzerRaceActive] = useState(false);
  const [buzzerUnlockedMsg, setBuzzerUnlockedMsg] = useState(false);
  const timerRef = useRef(null);
  const buzzerTimerRef = useRef(null);

  const players = session.players || [];
  const myIndex = players.findIndex(p => p.id === playerId);
  const myPlayer = players[myIndex];
  const isMyTurn = session.turnOrder?.[session.currentTurnIndex] === playerId;
  const isBuzzingPhase = session.phase === 'buzzing';
  const buzzerEnabled = session.firstRoundOver;
  const isFunMode = session?.gameMode === 'fun';
  const difficulty = session?.difficulty || 'medium';
  const starterPlayer = players.find(p => p.id === session.starterPlayerId);
  const currentTurnPlayer = players.find(p => p.id === session.turnOrder?.[session.currentTurnIndex]);
  const isStarterLockedThisRound = isStarter && session.currentRound === 1;
  const canBuzz = !hasBuzzed && !isStarterLockedThisRound && (buzzerRaceActive || buzzerWindowOpen || (buzzerEnabled && isMyTurn));
  const diffLabel = difficulty==='easy'?'😊 Easy':difficulty==='hard'?'🔥 Hard':'🧠 Medium';
  const medals = ['🥇','🥈','🥉'];

  // Other players arranged around the table (everyone except me)
  const otherPlayerIds = getTablePositions(myIndex, players.length);
  const otherPlayers = otherPlayerIds.map(i => players[i]).filter(Boolean);

  useEffect(() => {
    const fn = ({ hand: h, isStarter: s }) => { setHand(h||[]); setIsStarter(!!s); };
    socket.on(`hand_update_${playerId}`, fn);
    return () => socket.off(`hand_update_${playerId}`, fn);
  }, [playerId]);

  useEffect(() => {
    const fn = ({ toPlayerId }) => { if (toPlayerId===playerId) { setJustReceived(true); setTimeout(()=>setJustReceived(false),2000); } };
    socket.on('card_incoming', fn); return () => socket.off('card_incoming', fn);
  }, [playerId]);

  useEffect(() => {
    const fn = ({ seconds }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(seconds);
      timerRef.current = setInterval(() => setTimeLeft(p => { if (p<=1){clearInterval(timerRef.current);return 0;} return p-1; }), 1000);
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
        if (p<=1){clearInterval(buzzerTimerRef.current);setBuzzerWindowOpen(false);return 0;} return p-1;
      }), 1000);
    };
    socket.on('buzzer_window_open', fn);
    return () => { socket.off('buzzer_window_open', fn); if (buzzerTimerRef.current) clearInterval(buzzerTimerRef.current); };
  }, [playerId]);

  useEffect(() => {
    const fn = ({ playerId: pid }) => { if (pid===playerId){setBuzzerWindowOpen(false);setBuzzerWindowTime(null);} };
    socket.on('buzzer_window_closed', fn); return () => socket.off('buzzer_window_closed', fn);
  }, [playerId]);

  useEffect(() => {
    const fn = () => setBuzzerRaceActive(true);
    socket.on('buzzer_race_started', fn); return () => socket.off('buzzer_race_started', fn);
  }, []);

  useEffect(() => {
    const fn = () => { setBuzzerUnlockedMsg(true); setTimeout(()=>setBuzzerUnlockedMsg(false),4000); };
    socket.on('buzzer_unlocked', fn); return () => socket.off('buzzer_unlocked', fn);
  }, []);

  useEffect(() => {
    const fn = ({ playerId: bid, buzzerLog: log }) => { setBuzzerLog(log); if (bid===playerId) setHasBuzzed(true); };
    socket.on('buzzer_pressed', fn); return () => socket.off('buzzer_pressed', fn);
  }, [playerId]);

  useEffect(() => {
    setHasBuzzed(false); setBuzzerLog([]); setSelectedCard(null); setJustReceived(false);
    setTimeLeft(null); setBuzzerWindowOpen(false); setBuzzerWindowTime(null); setBuzzerRaceActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (buzzerTimerRef.current) clearInterval(buzzerTimerRef.current);
  }, [session.currentRound]);

  function handleSelectCard(w) { if (!isMyTurn || isBuzzingPhase) return; setSelectedCard(p => p===w?null:w); }
  function handlePassCard() { if (!selectedCard||!isMyTurn) return; socket.emit('pass_card',{sessionId:session.id,playerId,cardToPass:selectedCard}); setSelectedCard(null); }
  function handleBuzzer() { if (!canBuzz) return; socket.emit('press_buzzer',{sessionId:session.id,playerId}); }

  const buzzerStatus = () => {
    if (hasBuzzed) return '✅ You buzzed!';
    if (isStarterLockedThisRound) return '🔒 As starter, your buzzer activates from Round 2!';
    if (buzzerRaceActive) return '🚨 Race! Buzz now!';
    if (buzzerWindowOpen) return `⚡ ${buzzerWindowTime}s — BUZZ NOW!`;
    if (!buzzerEnabled && isMyTurn) return '⚠️ Round 1 — buzzing scores 0 pts!';
    if (buzzerEnabled && isMyTurn) return '🟢 Your turn — buzz if you have 3 matching cards!';
    return '⏳ Pass a card to open your 3s buzz window';
  };

  // Layout: top row = opponents, bottom = my area
  // For 2 opponents: side by side at top
  // For 3+ opponents: spread across top and sides
  const getOpponentLayout = () => {
    const count = otherPlayers.length;
    if (count === 0) return { top: [], left: [], right: [] };
    if (count === 1) return { top: [otherPlayers[0]], left: [], right: [] };
    if (count === 2) return { top: otherPlayers, left: [], right: [] };
    if (count === 3) return { top: [otherPlayers[1]], left: [otherPlayers[0]], right: [otherPlayers[2]] };
    if (count === 4) return { top: [otherPlayers[1], otherPlayers[2]], left: [otherPlayers[0]], right: [otherPlayers[3]] };
    return { top: otherPlayers.slice(1, count-1), left: [otherPlayers[0]], right: [otherPlayers[count-1]] };
  };

  const layout = getOpponentLayout();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--parchment)', padding: '16px' }}>

      {/* Header */}
      <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, lineHeight: 1 }}>Word Harmony</h2>
          <p style={{ color: 'var(--muted)', fontSize: 12 }}>Round {session.currentRound}/{session.rounds}</p>
        </div>
        <div className="flex gap-6 items-center" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {buzzerRaceActive ? <span className="badge" style={{ background:'var(--danger)',color:'white' }}>🚨 Race!</span>
            : !buzzerEnabled ? <span className="badge badge-gold">⚠️ Round 1</span>
            : <span className="badge badge-teal">🔓 Buzzer open</span>}
          <span className="badge badge-muted">{isFunMode?'🎉 Fun':'📚 Edu'} · {diffLabel}</span>
        </div>
      </div>

      {/* Notifications */}
      {buzzerUnlockedMsg && (
        <div style={{ background:'var(--teal)',color:'white',borderRadius:'var(--radius-md)',padding:'10px 16px',marginBottom:10,textAlign:'center',fontWeight:700,fontSize:14 }}>
          🔓 Round 1 complete! Buzzer is now open!
        </div>
      )}
      {buzzerRaceActive && !hasBuzzed && (
        <div style={{ background:'var(--danger)',color:'white',borderRadius:'var(--radius-md)',padding:'10px 16px',marginBottom:10,textAlign:'center',fontWeight:700,fontSize:15 }}>
          🚨 BUZZER RACE — Everyone buzz now!
        </div>
      )}
      {isStarter && !session.firstRoundOver && (
        <div style={{ background:'var(--gold-light)',border:'2px solid var(--gold)',borderRadius:'var(--radius-md)',padding:'10px 16px',marginBottom:10,display:'flex',alignItems:'center',gap:10 }}>
          <span style={{ fontSize:20 }}>⭐</span>
          <p style={{ fontSize:13,color:'#7A5200',fontWeight:600 }}>You start! Pass one of your 4 cards — buzzer unlocks after cards travel all the way around.</p>
        </div>
      )}

      {/* ── TABLE LAYOUT ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>

        {/* TOP ROW — opponents at the top */}
        {layout.top.length > 0 && (
          <div className="flex gap-12 justify-center" style={{ flexWrap: 'wrap' }}>
            {layout.top.map(p => {
              const buzzEntry = buzzerLog.find(b => b.playerId === p.id);
              return (
                <OpponentPanel
                  key={p.id} player={p}
                  isTurn={session.turnOrder?.[session.currentTurnIndex] === p.id}
                  totalScores={session.totalScores}
                  buzzed={!!buzzEntry}
                  hasCompleteSet={buzzEntry?.hasCompleteSet}
                />
              );
            })}
          </div>
        )}

        {/* MIDDLE ROW — left opponent, table center, right opponent */}
        <div className="flex gap-12 items-center" style={{ width: '100%', maxWidth: 800 }}>

          {/* Left opponent */}
          <div style={{ flexShrink: 0 }}>
            {layout.left.map(p => {
              const buzzEntry = buzzerLog.find(b => b.playerId === p.id);
              return (
                <OpponentPanel
                  key={p.id} player={p}
                  isTurn={session.turnOrder?.[session.currentTurnIndex] === p.id}
                  totalScores={session.totalScores}
                  buzzed={!!buzzEntry}
                  hasCompleteSet={buzzEntry?.hasCompleteSet}
                />
              );
            })}
          </div>

          {/* CENTER TABLE — turn indicator + timer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className={`turn-banner ${isMyTurn?'':'waiting'}`} style={{ textAlign: 'center', fontSize: 14 }}>
              {isBuzzingPhase ? '🚨 Buzzer race!'
                : isMyTurn ? `🎯 Your turn — ${hand.length} cards`
                : `${currentTurnPlayer?.name || '…'}'s turn`}
            </div>

            {timeLeft !== null && !isBuzzingPhase && (
              <div>
                <div className="flex justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: timeLeft<=5?'var(--danger)':'var(--muted)', fontWeight: 600 }}>
                    ⏱ {timeLeft}s
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: timeLeft<=5?'var(--danger)':timeLeft<=10?'var(--gold)':'var(--teal)' }}>{timeLeft}</span>
                </div>
                <div style={{ height: 8, background: 'var(--blush)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: timeLeft<=5?'var(--danger)':timeLeft<=10?'var(--gold)':'var(--teal)', width:`${(timeLeft/30)*100}%`, transition: 'width 1s linear' }} />
                </div>
              </div>
            )}

            {buzzerWindowOpen && (
              <div style={{ background:'var(--danger)',borderRadius:'var(--radius-md)',padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <span style={{ color:'white',fontWeight:700,fontSize:13 }}>⚡ Buzz window!</span>
                <span style={{ color:'white',fontWeight:900,fontSize:22 }}>{buzzerWindowTime}s</span>
              </div>
            )}

            {justReceived && (
              <div style={{ background:'var(--teal-light)',border:'1px solid var(--teal)',borderRadius:'var(--radius-md)',padding:'8px 12px',fontSize:13,color:'var(--teal)',fontWeight:600,textAlign:'center' }}>
                📨 Card received! {hand.length} cards in hand.
              </div>
            )}

            {/* Round info */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.8 }}>
              <p><strong>Starter:</strong> {starterPlayer?.name||'—'}</p>
              <p><strong>Buzzer:</strong> {buzzerEnabled?'🔓 Open':'⚠️ Invalid'}</p>
              <p><strong>Phase:</strong> {isBuzzingPhase?'🚨 Race!':'🃏 Trading'}</p>
            </div>
          </div>

          {/* Right opponent */}
          <div style={{ flexShrink: 0 }}>
            {layout.right.map(p => {
              const buzzEntry = buzzerLog.find(b => b.playerId === p.id);
              return (
                <OpponentPanel
                  key={p.id} player={p}
                  isTurn={session.turnOrder?.[session.currentTurnIndex] === p.id}
                  totalScores={session.totalScores}
                  buzzed={!!buzzEntry}
                  hasCompleteSet={buzzEntry?.hasCompleteSet}
                />
              );
            })}
          </div>
        </div>

        {/* MY AREA — hand + buzzer at the bottom */}
        <div style={{ width: '100%', maxWidth: 800 }}>
          {/* My player info strip */}
          <div className="flex items-center gap-10" style={{ marginBottom: 10, padding: '8px 12px', background: 'var(--white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <AvatarDisplay avatar={myPlayer?.avatar} size={36} fallbackLetter={myPlayer?.name?.charAt(0)?.toUpperCase() || '?'} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>{myPlayer?.name || 'You'}</span>
            <span className="badge badge-gold" style={{ marginLeft: 4 }}>{session.totalScores?.[playerId] || 0} pts</span>
            {isMyTurn && <span className="badge badge-teal" style={{ marginLeft: 4 }}>Your turn</span>}
            {hasBuzzed && <span className="badge badge-muted" style={{ marginLeft: 4 }}>Buzzed</span>}
          </div>

          {/* Cards */}
          <div className="panel" style={{ marginBottom: 10 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 15, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                  Your Hand
                  <span className="badge badge-muted" style={{ marginLeft: 8, fontSize: 11 }}>{hand.length} cards</span>
                  {hand.length===4 && <span className="badge badge-gold" style={{ marginLeft: 6, fontSize: 11 }}>{isMyTurn?'Pick one!':'Received!'}</span>}
                </h3>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {isMyTurn ? 'Select a card to pass clockwise' : isFunMode ? 'Collect 3 from same topic' : 'Collect 3 synonyms'}
                </p>
              </div>
              {isMyTurn && selectedCard && !isBuzzingPhase && (
                <button className="btn btn-primary btn-sm" onClick={handlePassCard}>Pass "{selectedCard}" →</button>
              )}
            </div>

            {hand.length === 0 ? (
              <div style={{ textAlign:'center',padding:'24px 0',color:'var(--muted)' }}>
                <div className="spinner" style={{ margin:'0 auto 10px' }} /><p>Dealing cards…</p>
              </div>
            ) : (
              <div className="flex gap-12" style={{ flexWrap:'wrap' }}>
                {hand.map((w,i) => (
                  <GameCard key={`${w}-${i}`} word={w} selected={selectedCard===w}
                    onClick={()=>handleSelectCard(w)} disabled={!isMyTurn||isBuzzingPhase}
                    label={isMyTurn&&!isBuzzingPhase?'tap to select':''} />
                ))}
              </div>
            )}
            {isMyTurn && !selectedCard && !isBuzzingPhase && hand.length>0 && (
              <p style={{ fontSize:12,color:'var(--muted)',marginTop:10,textAlign:'center' }}>↑ Tap a card, then click Pass</p>
            )}
          </div>

          {/* Buzzer */}
          <div className="panel text-center">
            <p style={{ fontSize:12,fontWeight:600,color:'var(--muted)',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.08em' }}>Buzzer</p>
            <p style={{ fontSize:13,color:hasBuzzed?'var(--success)':buzzerRaceActive||buzzerWindowOpen?'var(--danger)':'var(--muted)',marginBottom:14,fontWeight:600 }}>
              {buzzerStatus()}
            </p>
            <div className="flex justify-center" style={{ marginBottom:12 }}>
              <button className={`buzzer-btn ${canBuzz?'ready':''} ${buzzerEnabled&&!hasBuzzed?'unlocked':''}`} onClick={handleBuzzer} disabled={!canBuzz}>BUZZ!</button>
            </div>
            <p style={{ fontSize:11,color:'var(--muted)' }}>
              {buzzerRaceActive?'Race mode — buzz anytime!':buzzerEnabled?'Pass a card → 3s window → BUZZ!':'Buzzing before Round 1 = 0 pts'}
            </p>

            {buzzerLog.length > 0 && (
              <div style={{ marginTop:14,textAlign:'left' }}>
                <p style={{ fontSize:12,fontWeight:600,color:'var(--muted)',marginBottom:6 }}>Buzzer order:</p>
                {buzzerLog.map((b,i) => {
                  const p = players.find(pl=>pl.id===b.playerId);
                  return (
                    <div key={b.playerId} className="flex items-center gap-8" style={{ marginBottom:5 }}>
                      <span style={{ fontSize:16 }}>{medals[i]||`#${i+1}`}</span>
                      <AvatarDisplay avatar={p?.avatar} size={22} fallbackLetter={p?.name?.charAt(0)?.toUpperCase()||'?'} />
                      <span style={{ fontSize:13,fontWeight:b.playerId===playerId?700:400 }}>{p?.name} {b.playerId===playerId?'(you)':''}</span>
                      <span className={`badge ${b.hasCompleteSet?'badge-teal':'badge-muted'}`} style={{ marginLeft:'auto',fontSize:10 }}>
                        {b.invalid?'⚠️':b.hasCompleteSet?'✓':'✗'}
                      </span>
                    </div>
                  );
                })}
                {isBuzzingPhase && buzzerLog.length < players.length && (
                  <p style={{ fontSize:12,color:'var(--danger)',marginTop:6,fontWeight:600 }}>
                    🚨 {players.length - buzzerLog.length} player{players.length - buzzerLog.length!==1?'s':''} haven't buzzed!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
