import React, { useState, useEffect, useRef } from 'react';
import socket from '../utils/socket';
import { AvatarDisplay } from '../components/AvatarPicker';

// ── Card Back SVG (face-down) ──────────────────────────────────────────────
function CardBack({ width = 22, height = 30, rotate = 0, isExtra = false, style = {} }) {
  return (
    <svg width={width} height={height} viewBox="0 0 22 30" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rotate}deg)`, flexShrink: 0, ...style }}>
      <rect x="0.7" y="0.7" width="20.6" height="28.6" rx="4"
        fill={isExtra ? '#FFF8E8' : '#F7F2EA'}
        stroke={isExtra ? '#C8930C' : '#1A1A2E'}
        strokeWidth={isExtra ? 1.8 : 1.3}/>
      <rect x="2.5" y="2.5" width="17" height="25" rx="3"
        fill="none" stroke={isExtra ? '#C8930C' : '#1A1A2E'}
        strokeWidth="0.4" opacity="0.25"/>
      {isExtra && <circle cx="19" cy="3" r="2.5" fill="#C8930C"/>}
    </svg>
  );
}

// ── Landscape Card Back (wider than tall) ──────────────────────────────────
function CardBackLandscape({ width = 32, height = 22, rotate = 0, isExtra = false }) {
  return (
    <svg width={width} height={height} viewBox="0 0 32 22" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rotate}deg)`, flexShrink: 0 }}>
      <rect x="0.7" y="0.7" width="30.6" height="20.6" rx="4"
        fill={isExtra ? '#FFF8E8' : '#F7F2EA'}
        stroke={isExtra ? '#C8930C' : '#1A1A2E'}
        strokeWidth={isExtra ? 1.8 : 1.3}/>
      <rect x="2.5" y="2.5" width="27" height="17" rx="3"
        fill="none" stroke={isExtra ? '#C8930C' : '#1A1A2E'}
        strokeWidth="0.4" opacity="0.25"/>
      {isExtra && <circle cx="29" cy="3" r="2.5" fill="#C8930C"/>}
    </svg>
  );
}

// ── Face-up Word Card ──────────────────────────────────────────────────────
function WordCard({ word, selected, disabled, onClick }) {
  return (
    <div onClick={!disabled ? onClick : undefined} style={{
      cursor: disabled ? 'default' : 'pointer',
      transform: selected ? 'translateY(-8px)' : 'translateY(0)',
      transition: 'transform 0.15s ease',
      flexShrink: 0,
    }}>
      <svg width="80" height="112" viewBox="0 0 80 112" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="77" height="109" rx="10"
          fill={selected ? '#FFF8E8' : '#FFFFFF'}
          stroke={selected ? '#C8930C' : disabled ? '#D6CDB8' : '#1A1A2E'}
          strokeWidth={selected ? 2.5 : 1.5}/>
        <rect x="5" y="5" width="70" height="102" rx="7"
          fill="none"
          stroke={selected ? '#C8930C' : '#1A1A2E'}
          strokeWidth="0.5" opacity={disabled ? 0.1 : 0.2}/>
        <text x="40" y="54" textAnchor="middle" fontFamily="Georgia,serif"
          fontSize={word.length > 8 ? '10' : '12'} fontWeight="700"
          fill={selected ? '#C8930C' : disabled ? '#9B8E7A' : '#1A1A2E'}>{word}</text>
        <text x="40" y="70" textAnchor="middle" fontFamily="sans-serif" fontSize="8"
          fill={selected ? '#C8930C' : '#9B8E7A'}
          opacity={disabled ? 0.4 : 0.8}>
          {selected ? 'selected' : disabled ? '' : 'tap to select'}
        </text>
      </svg>
    </div>
  );
}

// ── Player Label (name + pts) ──────────────────────────────────────────────
function PlayerLabel({ player, isTurn, totalScores, small = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <AvatarDisplay avatar={player.avatar} size={small ? 26 : 30}
        fallbackLetter={player.name.charAt(0).toUpperCase()} />
      <span style={{ fontSize: small ? 8 : 9, fontWeight: 500, color: '#1A1A2E',
        fontFamily: 'Georgia,serif', lineHeight: 1.2 }}>{player.name}</span>
      <span style={{ fontSize: 7, color: '#C8930C' }}>
        {totalScores?.[player.id] || 0} pts
      </span>
      {isTurn && (
        <span style={{ fontSize: 6.5, background: '#1A8C8C', color: '#fff',
          borderRadius: 99, padding: '1px 5px', fontWeight: 600 }}>their turn</span>
      )}
    </div>
  );
}

// ── Main GamePlay Component ────────────────────────────────────────────────
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const timerRef = useRef(null);
  const buzzerTimerRef = useRef(null);

  const players = session.players || [];
  const myIndex = players.findIndex(p => p.id === playerId);
  const myPlayer = players[myIndex];
  const others = players.filter(p => p.id !== playerId);
  const topPlayer = others[0] || null;
  const leftPlayer = others.length >= 2 ? others[1] : null;
  const rightPlayer = others.length >= 3 ? others[2] : null;

  const isMyTurn = session.turnOrder?.[session.currentTurnIndex] === playerId;
  const isBuzzingPhase = session.phase === 'buzzing';
  const buzzerEnabled = session.firstRoundOver;
  const isFunMode = session?.gameMode === 'fun';
  const isStarterLocked = isStarter && !session.firstRoundOver;
  const hasFourCards = hand.length >= 4;
  const canBuzz = !hasBuzzed && !isStarterLocked && (
    buzzerRaceActive || buzzerWindowOpen || (buzzerEnabled && isMyTurn && !hasFourCards)
  );
  const currentTurnPlayer = players.find(p => p.id === session.turnOrder?.[session.currentTurnIndex]);
  const medals = ['🥇','🥈','🥉'];

  function isPlayerTurn(p) {
    return session.turnOrder?.[session.currentTurnIndex] === p?.id;
  }
  function cardCount(p) {
    return isPlayerTurn(p) ? 4 : 3;
  }

  useEffect(() => {
    const fn = ({ hand: h, isStarter: s }) => { setHand(h || []); setIsStarter(!!s); };
    socket.on(`hand_update_${playerId}`, fn);
    return () => socket.off(`hand_update_${playerId}`, fn);
  }, [playerId]);

  useEffect(() => {
    const fn = ({ seconds }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(seconds);
      timerRef.current = setInterval(() => setTimeLeft(p => {
        if (p <= 1) { clearInterval(timerRef.current); return 0; } return p - 1;
      }), 1000);
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
    const fn = ({ playerId: bid, buzzerLog: log }) => {
      setBuzzerLog(log); if (bid === playerId) setHasBuzzed(true);
    };
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
    function handlePop() { setShowExitConfirm(true); window.history.pushState({ gameState: 'playing' }, ''); }
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  function handleSelectCard(w) { if (!isMyTurn || isBuzzingPhase) return; setSelectedCard(p => p === w ? null : w); }

  function handlePassCard(card) {
    const c = card || selectedCard;
    if (!c || !isMyTurn) return;
    socket.emit('pass_card', { sessionId: session.id, playerId, cardToPass: c });
    setSelectedCard(null);
  }

  function handleBuzzer() { if (!canBuzz) return; socket.emit('press_buzzer', { sessionId: session.id, playerId }); }

  // Drag handlers
  function handleDragStart(e, word) { setIsDragging(true); e.dataTransfer.setData('card', word); }
  function handleDragEnd() { setIsDragging(false); setDragOver(false); }
  function handleDropZoneDragOver(e) { e.preventDefault(); setDragOver(true); }
  function handleDropZoneDragLeave() { setDragOver(false); }
  function handleDrop(e) {
    e.preventDefault(); setDragOver(false); setIsDragging(false);
    const card = e.dataTransfer.getData('card');
    if (card && isMyTurn) handlePassCard(card);
  }

  const buzzHint = () => {
    if (hasBuzzed) return 'Buzzed!';
    if (isStarterLocked) return 'Wait for cards to return';
    if (buzzerRaceActive) return 'Race — buzz now!';
    if (buzzerWindowOpen) return `${buzzerWindowTime}s — buzz!`;
    if (hasFourCards && isMyTurn) return 'Pass first, then buzz';
    if (!buzzerEnabled) return 'Round 1 — 0 pts';
    if (isMyTurn) return 'Buzz if 3 match!';
    return 'Pass to open window';
  };

  const buzzColor = hasBuzzed ? '#D6CDB8'
    : buzzerRaceActive || buzzerWindowOpen ? '#C8930C'
    : canBuzz ? '#E94560' : '#E8C4B0';
  const buzzTextColor = hasBuzzed ? '#9B8E7A'
    : buzzerRaceActive || buzzerWindowOpen || canBuzz ? '#fff' : '#8B3A1A';

  // SVG viewBox constants — landscape oval table
  const VW = 560; const VH = 310;
  const CX = 280; const CY = 155;
  const RX = 196; const RY = 118;
  const AVATAR_OFFSET = 14;
  const TOP_AV_Y    = CY - RY - AVATAR_OFFSET;
  const BOTTOM_AV_Y = CY + RY + AVATAR_OFFSET;
  const LEFT_AV_X   = CX - RX - AVATAR_OFFSET;
  const RIGHT_AV_X  = CX + RX + AVATAR_OFFSET;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F2EA', display: 'flex', flexDirection: 'column' }}>

      {/* Exit confirm */}
      {showExitConfirm && (
        <div style={{ position:'fixed',inset:0,background:'rgba(27,42,59,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#F7F2EA',borderRadius:14,padding:28,maxWidth:320,width:'90%',textAlign:'center',border:'0.5px solid #D6CDB8' }}>
            <h2 style={{ fontSize:20,fontFamily:'Georgia,serif',color:'#1A1A2E',marginBottom:10 }}>Exit game?</h2>
            <p style={{ color:'#9B8E7A',fontSize:13,marginBottom:24,lineHeight:1.6 }}>Your spot is held for 1.5 minutes.</p>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={() => setShowExitConfirm(false)} style={{ flex:1,padding:10,borderRadius:8,border:'0.5px solid #D6CDB8',background:'transparent',fontWeight:500,cursor:'pointer',fontSize:13,color:'#1A1A2E',fontFamily:'Georgia,serif' }}>No, stay</button>
              <button onClick={() => { setShowExitConfirm(false); onExit?.(); }} style={{ flex:1,padding:10,borderRadius:8,border:'none',background:'#1A1A2E',color:'#F7F2EA',fontWeight:500,cursor:'pointer',fontSize:13,fontFamily:'Georgia,serif' }}>Yes, exit</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',borderBottom:'0.5px solid #E8E0D0' }}>
        <span style={{ fontSize:15,fontWeight:500,color:'#1A1A2E',fontFamily:'Georgia,serif' }}>Word Harmony</span>
        <div style={{ display:'flex',gap:5 }}>
          <span style={{ fontSize:10,padding:'2px 8px',borderRadius:99,background:'#1A1A2E',color:'#F7F2EA',fontWeight:500 }}>Round {session.currentRound}/{session.rounds}</span>
          <span style={{ fontSize:10,padding:'2px 8px',borderRadius:99,background:'#E8F4F4',color:'#1A8C8C',fontWeight:500 }}>{isFunMode ? 'Fun' : 'Education'}</span>
          {buzzerEnabled && <span style={{ fontSize:10,padding:'2px 8px',borderRadius:99,background:'#FEF3E2',color:'#854F0B',fontWeight:500 }}>Buzzer open</span>}
          {buzzerRaceActive && <span style={{ fontSize:10,padding:'2px 8px',borderRadius:99,background:'#E94560',color:'#fff',fontWeight:700 }}>Race!</span>}
        </div>
      </div>

      {/* Notifications */}
      {buzzerUnlockedMsg && (
        <div style={{ background:'#1A8C8C',color:'#fff',padding:'6px 16px',textAlign:'center',fontSize:12,fontWeight:500 }}>
          Buzzer unlocked — pass a card then buzz in the 3s window
        </div>
      )}

      {/* TABLE — landscape SVG */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'8px 12px' }}>
        <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} fill="none" xmlns="http://www.w3.org/2000/svg"
          style={{ maxWidth: 680, display: 'block' }}>

          {/* Table shadow + surface */}
          <ellipse cx={CX+2} cy={CY+3} rx={RX} ry={RY} fill="#C4A070" opacity="0.18"/>
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="#D4B896" stroke="#B8956A" strokeWidth="2.5"/>
          <ellipse cx={CX} cy={CY} rx={RX-8} ry={RY-8} fill="#DEC4A0" stroke="#C4A070" strokeWidth="1"/>

          {/* Drop zone */}
          <circle cx={CX} cy={CY} r="50"
            fill={dragOver ? 'rgba(200,147,12,0.15)' : 'rgba(184,149,106,0.08)'}
            stroke={dragOver ? '#C8930C' : '#B8956A'}
            strokeWidth={dragOver ? 2 : 1} strokeDasharray={dragOver ? 'none' : '5,4'}
            opacity="0.8"
            onDragOver={handleDropZoneDragOver}
            onDragLeave={handleDropZoneDragLeave}
            onDrop={handleDrop}
            style={{ cursor: isDragging && isMyTurn ? 'copy' : 'default' }}
          />
          {!dragOver && <text x={CX} y={CY+62} textAnchor="middle" fontFamily="sans-serif" fontSize="7" fill="#9B8E7A" opacity="0.8">drag to pass</text>}
          {dragOver && <text x={CX} y={CY+12} textAnchor="middle" fontFamily="Georgia,serif" fontSize="9" fontWeight="700" fill="#C8930C">Drop to pass!</text>}

          {/* BUZZ button */}
          <circle cx={CX} cy={CY} r="32" fill={buzzColor} stroke={canBuzz ? '#A67412' : '#C23152'} strokeWidth="2.5"
            onClick={handleBuzzer} style={{ cursor: canBuzz ? 'pointer' : 'default' }}/>
          <text x={CX} y={CY-4} textAnchor="middle" fontFamily="Georgia,serif" fontSize="12" fontWeight="700"
            fill={buzzTextColor} style={{ pointerEvents:'none' }}>BUZZ!</text>
          <text x={CX} y={CY+9} textAnchor="middle" fontFamily="sans-serif" fontSize="7"
            fill={buzzTextColor} opacity="0.85" style={{ pointerEvents:'none' }}>{buzzHint()}</text>

          {/* Timer bar inside table */}
          {timeLeft !== null && !isBuzzingPhase && (
            <g>
              <rect x={CX-40} y={CY+38} width="80" height="4" rx="2" fill="rgba(184,149,106,0.4)"/>
              <rect x={CX-40} y={CY+38} width={80*(timeLeft/30)} height="4" rx="2"
                fill={timeLeft <= 5 ? '#E94560' : timeLeft <= 10 ? '#C8930C' : '#1A8C8C'}/>
              <text x={CX} y={CY+52} textAnchor="middle" fontFamily="sans-serif" fontSize="7"
                fill={timeLeft <= 5 ? '#E94560' : '#9B8E7A'}>{timeLeft}s</text>
            </g>
          )}

          {/* Turn indicator */}
          <text x={CX} y={VH-8} textAnchor="middle" fontFamily="Georgia,serif" fontSize="9"
            fill={isMyTurn ? '#1A8C8C' : '#9B8E7A'} fontWeight={isMyTurn ? '700' : '400'}>
            {isBuzzingPhase ? 'Buzzer race!'
              : isMyTurn ? 'Your turn'
              : `${currentTurnPlayer?.name || '…'}'s turn`}
          </text>

          {/* ══ PRIYA — top ══ */}
          {topPlayer && (() => {
            const isTurn = isPlayerTurn(topPlayer);
            const cnt = cardCount(topPlayer);
            return (
              <g>
                {/* Avatar */}
                <circle cx={CX} cy={TOP_AV_Y} r="13"
                  fill={topPlayer.avatar ? 'none' : '#8B5CF6'}/>
                <text x={CX} y={TOP_AV_Y+4} textAnchor="middle" fontFamily="sans-serif"
                  fontSize="9" fontWeight="700" fill="white">
                  {topPlayer.name.charAt(0).toUpperCase()}
                </text>
                <text x={CX} y={TOP_AV_Y+20} textAnchor="middle" fontFamily="Georgia,serif" fontSize="8" fill="#1A1A2E">{topPlayer.name}</text>
                <text x={CX} y={TOP_AV_Y+30} textAnchor="middle" fontFamily="sans-serif" fontSize="7" fill="#C8930C">{session.totalScores?.[topPlayer.id]||0} pts</text>
                {isTurn && <text x={CX} y={TOP_AV_Y+40} textAnchor="middle" fontFamily="sans-serif" fontSize="6.5" fill="#1A8C8C" fontWeight="700">their turn</text>}
                {/* Cards on table pointing down toward buzz — rotated 180° */}
                {[...Array(cnt)].map((_, i) => {
                  const totalW = cnt * 22 + (cnt-1) * 4;
                  const startX = CX - totalW/2;
                  const x = startX + i*(22+4);
                  const angle = (i-(cnt-1)/2)*15 + 180;
                  return (
                    <g key={i} transform={`translate(${x+11},${CY-RY+18}) rotate(${angle},0,0)`}>
                      <rect x="-11" y="-15" width="22" height="30" rx="4"
                        fill={isTurn && i===cnt-1 ? '#FFF8E8' : '#F7F2EA'}
                        stroke={isTurn && i===cnt-1 ? '#C8930C' : '#1A1A2E'}
                        strokeWidth={isTurn && i===cnt-1 ? 1.8 : 1.3}/>
                      <rect x="-8.5" y="-12.5" width="17" height="25" rx="3"
                        fill="none" stroke={isTurn && i===cnt-1 ? '#C8930C' : '#1A1A2E'}
                        strokeWidth="0.4" opacity="0.25"/>
                      {isTurn && i===cnt-1 && <circle cx="8" cy="-11" r="2.5" fill="#C8930C"/>}
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* ══ WEI — left ══ */}
          {leftPlayer && (() => {
            const isTurn = isPlayerTurn(leftPlayer);
            const cnt = cardCount(leftPlayer);
            return (
              <g>
                {isTurn && <rect x={LEFT_AV_X-18} y={CY-30} width="36" height="60" rx="8" fill="#E8F4F4" stroke="#1A8C8C" strokeWidth="1.5"/>}
                <circle cx={LEFT_AV_X} cy={CY-14} r="13"
                  fill={leftPlayer.avatar ? 'none' : '#059669'}/>
                <text x={LEFT_AV_X} y={CY-10} textAnchor="middle" fontFamily="sans-serif"
                  fontSize="9" fontWeight="700" fill="white">
                  {leftPlayer.name.charAt(0).toUpperCase()}
                </text>
                <text x={LEFT_AV_X} y={CY+5} textAnchor="middle" fontFamily="Georgia,serif" fontSize="8" fill="#1A1A2E">{leftPlayer.name}</text>
                <text x={LEFT_AV_X} y={CY+15} textAnchor="middle" fontFamily="sans-serif" fontSize="7" fill={isTurn?'#1A8C8C':'#C8930C'}>{isTurn?'their turn':`${session.totalScores?.[leftPlayer.id]||0} pts`}</text>
                {isTurn && <text x={LEFT_AV_X} y={CY+24} textAnchor="middle" fontFamily="sans-serif" fontSize="7" fill="#C8930C">{session.totalScores?.[leftPlayer.id]||0} pts</text>}
                {/* Cards on table fanning rightward → */}
                {[...Array(cnt)].map((_, i) => {
                  const totalH = cnt * 22 + (cnt-1) * 4;
                  const startY = CY - totalH/2;
                  const y = startY + i*(22+4);
                  const angle = (i-(cnt-1)/2)*15;
                  const isEx = isTurn && i===cnt-1;
                  return (
                    <g key={i} transform={`translate(${CX-RX+14},${y+11}) rotate(${angle},0,0)`}>
                      <rect x="-16" y="-11" width="32" height="22" rx="4"
                        fill={isEx ? '#FFF8E8' : '#F7F2EA'}
                        stroke={isEx ? '#C8930C' : '#1A1A2E'}
                        strokeWidth={isEx ? 1.8 : 1.3}/>
                      <rect x="-13.5" y="-8.5" width="27" height="17" rx="3"
                        fill="none" stroke={isEx ? '#C8930C' : '#1A1A2E'}
                        strokeWidth="0.4" opacity="0.25"/>
                      {isEx && <circle cx="14" cy="-8" r="2.5" fill="#C8930C"/>}
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* ══ KOFI — right ══ */}
          {rightPlayer && (() => {
            const isTurn = isPlayerTurn(rightPlayer);
            const cnt = cardCount(rightPlayer);
            return (
              <g>
                {isTurn && <rect x={RIGHT_AV_X-18} y={CY-30} width="36" height="60" rx="8" fill="#E8F4F4" stroke="#1A8C8C" strokeWidth="1.5"/>}
                <circle cx={RIGHT_AV_X} cy={CY-14} r="13"
                  fill={rightPlayer.avatar ? 'none' : '#DC2626'}/>
                <text x={RIGHT_AV_X} y={CY-10} textAnchor="middle" fontFamily="sans-serif"
                  fontSize="9" fontWeight="700" fill="white">
                  {rightPlayer.name.charAt(0).toUpperCase()}
                </text>
                <text x={RIGHT_AV_X} y={CY+5} textAnchor="middle" fontFamily="Georgia,serif" fontSize="8" fill="#1A1A2E">{rightPlayer.name}</text>
                <text x={RIGHT_AV_X} y={CY+15} textAnchor="middle" fontFamily="sans-serif" fontSize="7" fill={isTurn?'#1A8C8C':'#C8930C'}>{isTurn?'their turn':`${session.totalScores?.[rightPlayer.id]||0} pts`}</text>
                {isTurn && <text x={RIGHT_AV_X} y={CY+24} textAnchor="middle" fontFamily="sans-serif" fontSize="7" fill="#C8930C">{session.totalScores?.[rightPlayer.id]||0} pts</text>}
                {/* Cards on table fanning leftward ← */}
                {[...Array(cnt)].map((_, i) => {
                  const totalH = cnt * 22 + (cnt-1) * 4;
                  const startY = CY - totalH/2;
                  const y = startY + i*(22+4);
                  const angle = -(i-(cnt-1)/2)*15;
                  const isEx = isTurn && i===cnt-1;
                  return (
                    <g key={i} transform={`translate(${CX+RX-46},${y+11}) rotate(${angle},0,0)`}>
                      <rect x="-16" y="-11" width="32" height="22" rx="4"
                        fill={isEx ? '#FFF8E8' : '#F7F2EA'}
                        stroke={isEx ? '#C8930C' : '#1A1A2E'}
                        strokeWidth={isEx ? 1.8 : 1.3}/>
                      <rect x="-13.5" y="-8.5" width="27" height="17" rx="3"
                        fill="none" stroke={isEx ? '#C8930C' : '#1A1A2E'}
                        strokeWidth="0.4" opacity="0.25"/>
                      {isEx && <circle cx="14" cy="-8" r="2.5" fill="#C8930C"/>}
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* ══ YOU — bottom ══ */}
          {/* Face-down cards on table fanning upward ↑ */}
          {[...Array(hand.length)].map((_, i) => {
            const cnt = hand.length;
            const totalW = cnt * 22 + (cnt-1) * 4;
            const startX = CX - totalW/2;
            const x = startX + i*(22+4);
            const angle = -(i-(cnt-1)/2)*15;
            return (
              <g key={i} transform={`translate(${x+11},${CY+RY-20}) rotate(${angle},0,0)`}>
                <rect x="-11" y="-15" width="22" height="30" rx="4"
                  fill="#F7F2EA" stroke="#1A1A2E" strokeWidth="1.3"/>
                <rect x="-8.5" y="-12.5" width="17" height="25" rx="3"
                  fill="none" stroke="#1A1A2E" strokeWidth="0.4" opacity="0.25"/>
              </g>
            );
          })}
          {/* Your avatar on bottom table edge */}
          <circle cx={CX} cy={BOTTOM_AV_Y} r="13"
            fill={myPlayer?.avatar ? 'none' : '#0EA5E9'}/>
          <text x={CX} y={BOTTOM_AV_Y+4} textAnchor="middle" fontFamily="sans-serif"
            fontSize="9" fontWeight="700" fill="white">
            {myPlayer?.name?.charAt(0)?.toUpperCase() || 'Y'}
          </text>
          <text x={CX} y={BOTTOM_AV_Y+20} textAnchor="middle" fontFamily="Georgia,serif" fontSize="8" fill="#1A1A2E">{myPlayer?.name || 'You'}</text>
          <text x={CX} y={BOTTOM_AV_Y+30} textAnchor="middle" fontFamily="sans-serif" fontSize="7" fill="#C8930C">{session.totalScores?.[playerId]||0} pts</text>

          {/* Buzzer log */}
          {buzzerLog.length > 0 && buzzerLog.map((b, i) => {
            const p = players.find(pl => pl.id === b.playerId);
            return (
              <text key={b.playerId} x={VW-8} y={20+i*14} textAnchor="end"
                fontFamily="sans-serif" fontSize="8" fill={b.hasCompleteSet?'#1A8C8C':'#9B8E7A'}>
                {medals[i]||`#${i+1}`} {p?.name} {b.invalid?'(invalid)':b.hasCompleteSet?'✓':'✗'}
              </text>
            );
          })}

        </svg>

        {/* YOUR FACE-UP WORD CARDS — outside table, draggable */}
        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginTop:4 }}>
          {hand.length === 0 ? (
            <p style={{ fontSize:13,color:'#9B8E7A',fontFamily:'Georgia,serif',padding:'12px 0' }}>Dealing cards…</p>
          ) : hand.map((w, i) => (
            <div key={`${w}-${i}`}
              draggable={isMyTurn && !isBuzzingPhase}
              onDragStart={e => handleDragStart(e, w)}
              onDragEnd={handleDragEnd}
              style={{ cursor: isMyTurn && !isBuzzingPhase ? 'grab' : 'default' }}
            >
              <WordCard word={w} selected={selectedCard===w}
                disabled={!isMyTurn || isBuzzingPhase}
                onClick={() => handleSelectCard(w)} />
            </div>
          ))}
        </div>

        {isMyTurn && selectedCard && !isBuzzingPhase && (
          <button onClick={() => handlePassCard()} style={{
            marginTop:8, background:'#1A1A2E', border:'none', borderRadius:8,
            padding:'8px 20px', color:'#F7F2EA', fontSize:12, fontWeight:500,
            cursor:'pointer', fontFamily:'Georgia,serif'
          }}>
            Pass "{selectedCard}" →
          </button>
        )}
        {isMyTurn && !selectedCard && !isBuzzingPhase && hand.length > 0 && (
          <p style={{ fontSize:10,color:'#9B8E7A',marginTop:6,textAlign:'center' }}>
            Tap a card to select, or drag it to the centre to pass
          </p>
        )}
      </div>
    </div>
  );
}
