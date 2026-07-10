import React, { useState, useEffect, useRef } from 'react';
import socket from '../utils/socket';
import GameCard from '../components/GameCard';
import { AvatarDisplay } from '../components/AvatarPicker';

export default function GamePlay({ session, playerId, onExit }) {
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
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [opponentCards, setOpponentCards] = useState({});
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
  const canBuzz = !hasBuzzed && !isStarterLocked && (
    buzzerRaceActive || buzzerWindowOpen || (buzzerEnabled && isMyTurn && !hasFourCards)
  );

  // Get other players positioned around the table
  const others = players.filter(p => p.id !== playerId);
  const getPosition = (count, index) => {
    if (count === 1) return ['top'];
    if (count === 2) return ['top-left', 'top-right'][index] || 'top';
    if (count === 3) return ['top', 'left', 'right'][index] || 'top';
    if (count === 4) return ['top', 'left', 'right', 'top-right'][index] || 'top';
    return ['top', 'left', 'right', 'top-left', 'top-right'][index] || 'top';
  };

  useEffect(() => {
    const fn = ({ hand: h, isStarter: s }) => { setHand(h||[]); setIsStarter(!!s); };
    socket.on(`hand_update_${playerId}`, fn);
    return () => socket.off(`hand_update_${playerId}`, fn);
  }, [playerId]);

  useEffect(() => {
    const fn = ({ toPlayerId }) => {
      if (toPlayerId === playerId) { setJustReceived(true); setTimeout(()=>setJustReceived(false), 2000); }
      // Track opponent card counts
      setOpponentCards(prev => ({
        ...prev,
        [toPlayerId]: (prev[toPlayerId] || 3) + 1
      }));
    };
    socket.on('card_incoming', fn); return () => socket.off('card_incoming', fn);
  }, [playerId]);

  useEffect(() => {
    // Reset opponent card count when someone passes
    const fn = ({ playerId: pid }) => {
      setOpponentCards(prev => ({ ...prev, [pid]: Math.max(3, (prev[pid] || 3) - 1) }));
    };
    socket.on('auto_passed', fn); return () => socket.off('auto_passed', fn);
  }, []);

  useEffect(() => {
    const fn = ({ seconds }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(seconds);
      timerRef.current = setInterval(() => setTimeLeft(p => { if(p<=1){clearInterval(timerRef.current);return 0;} return p-1; }), 1000);
    };
    socket.on('turn_timer', fn);
    return () => { socket.off('turn_timer', fn); if (timerRef.current) clearInterval(timerRef.current); };
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
    setHasBuzzed(false); setBuzzerLog([]); setSelectedCard(null);
    setTimeLeft(null); setBuzzerWindowOpen(false); setBuzzerWindowTime(null); setBuzzerRaceActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (buzzerTimerRef.current) clearInterval(buzzerTimerRef.current);
  }, [session.currentRound]);

  useEffect(() => {
    window.history.pushState({ gameState: 'playing' }, '');
    function handlePopState() { setShowExitConfirm(true); window.history.pushState({ gameState: 'playing' }, ''); }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function handleSelectCard(w) { if (!isMyTurn || isBuzzingPhase) return; setSelectedCard(p => p===w?null:w); }
  function handlePassCard() {
    if (!selectedCard||!isMyTurn) return;
    socket.emit('pass_card',{sessionId:session.id,playerId,cardToPass:selectedCard});
    setSelectedCard(null);
  }
  function handleBuzzer() { if (!canBuzz) return; socket.emit('press_buzzer',{sessionId:session.id,playerId}); }

  const buzzerStatus = () => {
    if (hasBuzzed) return '✅ Buzzed!';
    if (isStarterLocked) return '🔒 Wait for cards to travel back to you';
    if (buzzerRaceActive) return '🚨 RACE! Buzz now!';
    if (buzzerWindowOpen) return `⚡ ${buzzerWindowTime}s — BUZZ NOW!`;
    if (hasFourCards && isMyTurn) return '⚠️ Pass a card first — then buzz!';
    if (!buzzerEnabled) return '⚠️ Round 1 — buzzing scores 0';
    if (buzzerEnabled && isMyTurn) return '🟢 Buzz if you have 3 matching cards!';
    return '⏳ Wait for your turn';
  };

  // Opponent card component — face down with logo
  const OpponentPanel = ({ player, position }) => {
    const isTurn = session.turnOrder?.[session.currentTurnIndex] === player.id;
    const cardCount = isTurn ? 4 : 3;
    const buzzEntry = buzzerLog.find(b => b.playerId === player.id);
    const isVertical = position === 'top' || position === 'top-left' || position === 'top-right';

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        opacity: player.connected === false ? 0.5 : 1,
      }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ position: 'relative' }}>
            <AvatarDisplay avatar={player.avatar} size={36} fallbackLetter={player.name.charAt(0).toUpperCase()} />
            {isTurn && (
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 12, height: 12, borderRadius: '50%',
                background: '#00D4AA', border: '2px solid white'
              }} />
            )}
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{player.name}</p>
            <p style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>{session.totalScores?.[player.id] || 0} pts</p>
          </div>
        </div>

        {/* Buzz indicator */}
        {buzzEntry && (
          <div style={{
            fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: buzzEntry.hasCompleteSet ? '#D1FAE5' : '#FEE2E2',
            color: buzzEntry.hasCompleteSet ? '#065F46' : '#991B1B'
          }}>
            {buzzEntry.hasCompleteSet ? '✓ BUZZED' : '✗ BUZZED'}
          </div>
        )}

        {/* Face-down cards — bigger size, more gap */}
        <div style={{ display: 'flex', gap: 12, flexDirection: isVertical ? 'row' : 'column' }}>
          {Array.from({ length: cardCount }).map((_, i) => (
            <div key={i} style={{
              width: isVertical ? 56 : 72,
              height: isVertical ? 80 : 56,
              borderRadius: 10,
              background: '#1A1A2E',
              border: `2.5px solid ${isTurn && i === cardCount-1 ? '#F5A623' : '#1D9E75'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isTurn && i === cardCount-1 ? '0 0 12px rgba(245,166,35,0.5)' : 'none',
              position: 'relative', overflow: 'hidden',
              transition: 'transform 0.2s ease',
              transform: isTurn && i === cardCount-1 ? 'scale(1.08)' : 'scale(1)',
            }}>
              {/* Card back logo */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: isVertical ? 28 : 36, height: isVertical ? 38 : 28, borderRadius: 5, border: '1.5px solid rgba(29,158,117,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(29,158,117,0.1)' }}>
                  <div style={{ width: '55%', height: '55%', borderRadius: 3, border: '1px solid rgba(29,158,117,0.5)' }} />
                </div>
              </div>
              {isTurn && i === cardCount-1 && (
                <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#F5A623' }} />
              )}
            </div>
          ))}
        </div>

        {isTurn && (
          <div style={{ fontSize: 9, fontWeight: 700, color: '#00D4AA', letterSpacing: 1 }}>THEIR TURN</div>
        )}
        {!player.connected && (
          <div style={{ fontSize: 9, color: 'var(--muted)' }}>Away</div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0EDE8', display: 'flex', flexDirection: 'column' }}>

      {/* Exit confirm */}
      {showExitConfirm && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'white',borderRadius:16,padding:28,maxWidth:320,width:'90%',textAlign:'center' }}>
            <h2 style={{ fontSize:20,marginBottom:10 }}>Exit Game?</h2>
            <p style={{ color:'var(--muted)',fontSize:13,marginBottom:24,lineHeight:1.6 }}>Your spot is held for 1.5 minutes — you can rejoin with the session code.</p>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={() => setShowExitConfirm(false)} style={{ flex:1,padding:'10px',borderRadius:10,border:'1.5px solid var(--border)',background:'white',fontWeight:600,cursor:'pointer' }}>No, Stay</button>
              <button onClick={() => { setShowExitConfirm(false); onExit?.(); }} style={{ flex:1,padding:'10px',borderRadius:10,border:'none',background:'#E94560',color:'white',fontWeight:700,cursor:'pointer' }}>Yes, Exit</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',background:'white',borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <span style={{ fontSize:14,fontWeight:800,color:'var(--ink)' }}>Word Harmony</span>
          <span style={{ fontSize:11,background:'#1A1A2E',color:'white',borderRadius:99,padding:'2px 10px',fontWeight:700 }}>Round {session.currentRound}/{session.rounds}</span>
        </div>
        <div style={{ display:'flex',gap:6,alignItems:'center' }}>
          {buzzerRaceActive ? <span style={{ fontSize:10,background:'#E94560',color:'white',borderRadius:99,padding:'2px 8px',fontWeight:700 }}>🚨 RACE!</span>
            : !buzzerEnabled ? <span style={{ fontSize:10,background:'#FEF3C7',color:'#92400E',borderRadius:99,padding:'2px 8px',fontWeight:700 }}>⚠️ Round 1</span>
            : <span style={{ fontSize:10,background:'#D1FAE5',color:'#065F46',borderRadius:99,padding:'2px 8px',fontWeight:700 }}>🔓 Buzzer open</span>}
          <span style={{ fontSize:10,background:isFunMode?'#FEF3C7':'#EFF6FF',color:isFunMode?'#92400E':'#1E40AF',borderRadius:99,padding:'2px 8px',fontWeight:700 }}>
            {isFunMode?'🎉 Fun':'📚 Edu'}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {buzzerUnlockedMsg && (
        <div style={{ background:'#1D9E75',color:'white',padding:'8px 16px',textAlign:'center',fontWeight:700,fontSize:13 }}>
          🔓 Buzzer unlocked! Pass a card to open your 3s buzz window
        </div>
      )}
      {buzzerRaceActive && !hasBuzzed && (
        <div style={{ background:'#E94560',color:'white',padding:'8px 16px',textAlign:'center',fontWeight:700,fontSize:14 }}>
          🚨 BUZZER RACE — Buzz now!
        </div>
      )}

      {/* TABLE */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', padding:'16px', gap:8, maxWidth:600, margin:'0 auto', width:'100%' }}>

        {/* TOP opponents — minimum 3 players means always 2+ others */}
        {/* Layout:
            3 players → top: [0], right: [1], left: empty
            4 players → top: [0], left: [1], right: [2]
            5 players → top: [0,1], left: [2], right: [3]
            6 players → top: [0,1,2], left: [3], right: [4]
        */}
        <div style={{ display:'flex', gap:24, justifyContent:'center', flexWrap:'wrap' }}>
          {others.length === 2
            ? [others[0]].map(p => <OpponentPanel key={p.id} player={p} position="top" />)
            : others.slice(0, others.length - 2).map(p => <OpponentPanel key={p.id} player={p} position="top" />)
          }
        </div>

        {/* MIDDLE row — left, buzzer, right */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', gap:8 }}>

          {/* Left opponent — empty for 3 players, filled for 4+ */}
          <div style={{ minWidth:80 }}>
            {others.length >= 4
              ? <OpponentPanel player={others[others.length - 2]} position="left" />
              : <div style={{ minWidth:80 }} />
            }
          </div>

          {/* CENTRE — buzzer */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>

            {/* Timer */}
            {timeLeft !== null && !isBuzzingPhase && (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:timeLeft<=5?'#E94560':'var(--muted)', fontWeight:600, marginBottom:4 }}>
                  {isMyTurn ? `⏱ ${timeLeft}s to pass` : `⏱ ${timeLeft}s`}
                </div>
                <div style={{ width:80, height:6, background:'#E5E7EB', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:3, background:timeLeft<=5?'#E94560':timeLeft<=10?'#F5A623':'#1D9E75', width:`${(timeLeft/30)*100}%`, transition:'width 1s linear' }} />
                </div>
              </div>
            )}

            {/* Buzzer window countdown */}
            {buzzerWindowOpen && (
              <div style={{ background:'#E94560', borderRadius:8, padding:'4px 12px', color:'white', fontWeight:800, fontSize:18 }}>
                ⚡ {buzzerWindowTime}s
              </div>
            )}

            {/* BUZZ button */}
            <div style={{ position:'relative' }}>
              <button
                onClick={handleBuzzer}
                disabled={!canBuzz}
                style={{
                  width: buzzerRaceActive || buzzerWindowOpen ? 100 : 88,
                  height: buzzerRaceActive || buzzerWindowOpen ? 100 : 88,
                  borderRadius: '50%',
                  border: 'none',
                  background: hasBuzzed ? '#9CA3AF'
                    : !buzzerEnabled ? '#E8C4B0'
                    : canBuzz ? '#E94560'
                    : '#F4A4A4',
                  color: hasBuzzed ? 'white' : !buzzerEnabled ? '#8B3A1A' : 'white',
                  fontSize: 14, fontWeight: 900, cursor: canBuzz ? 'pointer' : 'not-allowed',
                  boxShadow: canBuzz ? '0 6px 20px rgba(233,69,96,0.5)' : 'none',
                  transition: 'all 0.2s ease',
                  transform: canBuzz ? 'scale(1.05)' : 'scale(1)',
                  letterSpacing: 1,
                }}
              >
                BUZZ!
              </button>
            </div>

            <p style={{ fontSize:10, color:'var(--muted)', textAlign:'center', maxWidth:120, lineHeight:1.4, fontWeight:500 }}>
              {buzzerStatus()}
            </p>

            {/* Turn indicator */}
            <div style={{
              background: isMyTurn ? '#1A1A2E' : '#F3F4F6',
              color: isMyTurn ? 'white' : 'var(--muted)',
              borderRadius: 8, padding: '6px 14px', fontSize: 11, fontWeight: 700, textAlign: 'center'
            }}>
              {isBuzzingPhase ? '🚨 Race mode!'
                : isMyTurn ? `🎯 Your turn`
                : `${session.players?.find(p=>p.id===session.turnOrder?.[session.currentTurnIndex])?.name || '…'}'s turn`}
            </div>
          </div>

          {/* Right opponent — always shown (min 3 players = min 2 others) */}
          <div style={{ minWidth:80 }}>
            {others.length >= 2 && <OpponentPanel player={others[others.length - 1]} position="right" />}
          </div>
        </div>

        {/* MY AREA — bottom */}
        <div style={{ width:'100%' }}>

          {/* My player strip */}
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'6px 10px',background:'white',borderRadius:10,border:'1px solid var(--border)' }}>
            <AvatarDisplay avatar={myPlayer?.avatar} size={32} fallbackLetter={myPlayer?.name?.charAt(0)?.toUpperCase()||'?'} />
            <span style={{ fontWeight:700,fontSize:13 }}>{myPlayer?.name||'You'}</span>
            <span style={{ fontSize:11,background:'#FEF3C7',color:'#92400E',borderRadius:99,padding:'1px 8px',fontWeight:700 }}>{session.totalScores?.[playerId]||0} pts</span>
            {isMyTurn && <span style={{ fontSize:10,background:'#D1FAE5',color:'#065F46',borderRadius:99,padding:'1px 8px',fontWeight:700,marginLeft:'auto' }}>Your turn</span>}
            {hasBuzzed && <span style={{ fontSize:10,background:'#F3F4F6',color:'var(--muted)',borderRadius:99,padding:'1px 8px',fontWeight:600,marginLeft:'auto' }}>Buzzed ✓</span>}
          </div>

          {/* My hand label */}
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
            <div>
              <span style={{ fontSize:12,fontWeight:700,color:'var(--ink)' }}>Your Hand</span>
              <span style={{ fontSize:10,background:'#F3F4F6',color:'var(--muted)',borderRadius:99,padding:'1px 8px',fontWeight:600,marginLeft:6 }}>{hand.length} cards</span>
              {hand.length===4 && <span style={{ fontSize:10,background:'#FEF3C7',color:'#92400E',borderRadius:99,padding:'1px 8px',fontWeight:700,marginLeft:4 }}>Pass one!</span>}
            </div>
            {isMyTurn && selectedCard && !isBuzzingPhase && (
              <button onClick={handlePassCard} style={{ background:'#1A1A2E',color:'white',border:'none',borderRadius:8,padding:'6px 14px',fontSize:11,fontWeight:700,cursor:'pointer' }}>
                Pass "{selectedCard}" →
              </button>
            )}
          </div>

          {/* Cards */}
          {hand.length === 0 ? (
            <div style={{ textAlign:'center',padding:'20px',color:'var(--muted)',fontSize:12 }}>Dealing cards…</div>
          ) : (
            <div style={{ display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center' }}>
              {hand.map((w,i) => (
                <GameCard key={`${w}-${i}`} word={w} selected={selectedCard===w}
                  onClick={()=>handleSelectCard(w)} disabled={!isMyTurn||isBuzzingPhase}
                  label={isMyTurn&&!isBuzzingPhase?'tap to select':''} />
              ))}
            </div>
          )}
          {isMyTurn && !selectedCard && !isBuzzingPhase && hand.length>0 && (
            <p style={{ fontSize:11,color:'var(--muted)',marginTop:8,textAlign:'center' }}>↑ Tap a card to select it, then click Pass</p>
          )}

          {/* Buzzer log */}
          {buzzerLog.length > 0 && (
            <div style={{ marginTop:10,padding:'8px 12px',background:'white',borderRadius:8,border:'1px solid var(--border)' }}>
              <p style={{ fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:6 }}>Buzzer order:</p>
              <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                {buzzerLog.map((b,i) => {
                  const p = players.find(pl=>pl.id===b.playerId);
                  const medals = ['🥇','🥈','🥉'];
                  return (
                    <div key={b.playerId} style={{ display:'flex',alignItems:'center',gap:4 }}>
                      <span style={{ fontSize:14 }}>{medals[i]||`#${i+1}`}</span>
                      <AvatarDisplay avatar={p?.avatar} size={20} fallbackLetter={p?.name?.charAt(0)?.toUpperCase()||'?'} />
                      <span style={{ fontSize:11,fontWeight:b.playerId===playerId?700:400 }}>{p?.name}</span>
                      <span style={{ fontSize:10,padding:'1px 6px',borderRadius:99,background:b.hasCompleteSet?'#D1FAE5':'#FEE2E2',color:b.hasCompleteSet?'#065F46':'#991B1B',fontWeight:600 }}>
                        {b.invalid?'⚠️':b.hasCompleteSet?'✓':'✗'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
