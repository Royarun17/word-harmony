import React, { useState, useEffect, useRef } from 'react';
import socket from '../utils/socket';
import { AvatarDisplay } from '../components/AvatarPicker';

// ── Design Tokens ──────────────────────────────────────────────────────────
const T = {
  cream:   '#F7F2EA',
  navy:    '#1A1A2E',
  gold:    '#C8930C',
  goldL:   '#FFD166',
  teal:    '#1A8C8C',
  tealL:   '#E0F5F5',
  red:     '#E94560',
  redD:    '#B5293F',
  muted:   '#9B8E7A',
  border:  '#E8E0D0',
  tableTop:'#D4B896',
  tableIn: '#DEC4A0',
  tableSh: '#C4A070',
  white:   '#FFFFFF',
  cardBack:'#F7F2EA',
  success: '#1A8C5A',
};

// ── Utility: shadow filter ────────────────────────────────────────────────
const DROP = 'drop-shadow(0px 4px 8px rgba(26,26,46,0.25))';
const CARD_DROP = 'drop-shadow(0px 3px 6px rgba(26,26,46,0.18))';

// ── WordCard (face-up, draggable) ─────────────────────────────────────────
function WordCard({ word, selected, disabled, onClick, onDragStart, onDragEnd, draggable }) {
  const fs = word.length > 9 ? 9 : word.length > 6 ? 11 : 13;
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        cursor: disabled ? 'default' : draggable ? 'grab' : 'pointer',
        transform: selected ? 'translateY(-10px) scale(1.04)' : 'translateY(0) scale(1)',
        transition: 'transform 0.18s cubic-bezier(.34,1.56,.64,1)',
        flexShrink: 0,
        filter: selected ? `drop-shadow(0 6px 16px rgba(200,147,12,0.5))` : CARD_DROP,
        userSelect: 'none',
      }}>
      <svg width="76" height="108" viewBox="0 0 76 108" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Card shadow */}
        <rect x="3" y="5" width="70" height="100" rx="12" fill="rgba(26,26,46,0.12)"/>
        {/* Card body */}
        <rect x="1" y="1" width="74" height="104" rx="12"
          fill={selected ? '#FFF8E8' : disabled ? '#F0EDE8' : T.white}
          stroke={selected ? T.gold : disabled ? '#D6CDB8' : T.navy}
          strokeWidth={selected ? 2.5 : 1.5}/>
        {/* Inner border detail */}
        <rect x="5" y="5" width="66" height="96" rx="9"
          fill="none"
          stroke={selected ? T.gold : T.navy}
          strokeWidth="0.6" opacity={disabled ? 0.08 : 0.15}/>
        {/* Word */}
        <text x="38" y="52" textAnchor="middle" fontFamily="Georgia,serif"
          fontSize={fs} fontWeight="700" letterSpacing="0.3"
          fill={selected ? T.gold : disabled ? T.muted : T.navy}>{word}</text>
        {/* Hint */}
        {!disabled && (
          <text x="38" y="68" textAnchor="middle" fontFamily="sans-serif"
            fontSize="8" fill={selected ? T.gold : T.muted} opacity="0.8">
            {selected ? '✓ selected' : 'tap to select'}
          </text>
        )}
        {/* Gold corner pip when selected */}
        {selected && (
          <>
            <circle cx="10" cy="10" r="4" fill={T.gold} opacity="0.6"/>
            <circle cx="66" cy="98" r="4" fill={T.gold} opacity="0.6"/>
          </>
        )}
      </svg>
    </div>
  );
}

// ── FaceDownCard (SVG inline, for use inside SVG) ─────────────────────────
// Returns props for a <g> element — call as JSX inside SVG
function FaceDownCardGroup({ x, y, rotate = 0, isExtra = false, isLandscape = false }) {
  const W = isLandscape ? 32 : 22;
  const H = isLandscape ? 22 : 30;
  const fill  = isExtra ? '#FFF8E8' : T.cardBack;
  const stroke= isExtra ? T.gold : T.navy;
  const sw    = isExtra ? 1.8 : 1.3;
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`}>
      {/* Card shadow */}
      <rect x={-W/2+1} y={-H/2+2} width={W} height={H} rx="4" fill="rgba(26,26,46,0.15)"/>
      {/* Card body */}
      <rect x={-W/2} y={-H/2} width={W} height={H} rx="4" fill={fill} stroke={stroke} strokeWidth={sw}/>
      {/* Inner border */}
      <rect x={-W/2+2.5} y={-H/2+2.5} width={W-5} height={H-5} rx="3"
        fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.25"/>
      {/* Extra card gold dot */}
      {isExtra && <circle cx={W/2-3} cy={-H/2+3} r="3" fill={T.gold}/>}
    </g>
  );
}

// ── Avatar circle (inline SVG) ─────────────────────────────────────────────
function AvatarCircle({ cx, cy, r = 14, letter, color, isTurn }) {
  return (
    <g>
      {/* Glow ring when active */}
      {isTurn && <circle cx={cx} cy={cy} r={r+5} fill="none" stroke={T.teal} strokeWidth="2" opacity="0.4"/>}
      {/* Shadow */}
      <circle cx={cx+1} cy={cy+2} r={r} fill="rgba(26,26,46,0.2)"/>
      {/* Avatar bg */}
      <circle cx={cx} cy={cy} r={r} fill={color} stroke={isTurn ? T.teal : T.white} strokeWidth={isTurn ? 2 : 1.5}/>
      {/* Initial */}
      <text x={cx} y={cy+4} textAnchor="middle" fontFamily="sans-serif"
        fontSize={r*0.75} fontWeight="700" fill={T.white}>{letter}</text>
    </g>
  );
}

// ── PlayerChip (name + pts label under avatar) ────────────────────────────
function PlayerChip({ cx, cy, name, pts, isTurn }) {
  return (
    <g>
      {/* Pill bg */}
      <rect x={cx-28} y={cy-8} width="56" height="16" rx="8"
        fill={isTurn ? T.teal : 'rgba(26,26,46,0.55)'}
        stroke={isTurn ? T.tealL : 'none'} strokeWidth="1"/>
      <text x={cx} y={cy+1} textAnchor="middle" fontFamily="Georgia,serif"
        fontSize="7.5" fontWeight="500" fill={T.white}>{name}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontFamily="sans-serif"
        fontSize="7" fill={isTurn ? T.goldL : T.goldL} opacity="0.9">{pts} pts</text>
    </g>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function GamePlay({ session, playerId, onExit }) {
  const [hand, setHand]                     = useState([]);
  const [isStarter, setIsStarter]           = useState(false);
  const [selectedCard, setSelectedCard]     = useState(null);
  const [buzzerLog, setBuzzerLog]           = useState([]);
  const [hasBuzzed, setHasBuzzed]           = useState(false);
  const [timeLeft, setTimeLeft]             = useState(null);
  const [buzzerWindowOpen, setBuzzerWindowOpen]   = useState(false);
  const [buzzerWindowTime, setBuzzerWindowTime]   = useState(null);
  const [buzzerRaceActive, setBuzzerRaceActive]   = useState(false);
  const [buzzerUnlockedMsg, setBuzzerUnlockedMsg] = useState(false);
  const [showExitConfirm, setShowExitConfirm]     = useState(false);
  const [isDragging, setIsDragging]         = useState(false);
  const [dragOver, setDragOver]             = useState(false);
  const [buzzPulse, setBuzzPulse]           = useState(false);
  const timerRef     = useRef(null);
  const buzzerTimerRef = useRef(null);

  const players  = session.players || [];
  const myIndex  = players.findIndex(p => p.id === playerId);
  const myPlayer = players[myIndex];
  const others   = players.filter(p => p.id !== playerId);
  const topPlayer   = others[0] || null;
  const leftPlayer  = others.length >= 2 ? others[1] : null;
  const rightPlayer = others.length >= 3 ? others[2] : null;

  const isMyTurn        = session.turnOrder?.[session.currentTurnIndex] === playerId;
  const isBuzzingPhase  = session.phase === 'buzzing';
  const buzzerEnabled   = session.firstRoundOver;
  const isFunMode       = session?.gameMode === 'fun';
  const isStarterLocked = isStarter && !session.firstRoundOver;
  const hasFourCards    = hand.length >= 4;
  const canBuzz = !hasBuzzed && !isStarterLocked && (
    buzzerRaceActive || buzzerWindowOpen || (buzzerEnabled && isMyTurn && !hasFourCards)
  );
  const currentTurnPlayer = players.find(p => p.id === session.turnOrder?.[session.currentTurnIndex]);
  const medals = ['🥇','🥈','🥉'];

  const AVATAR_COLORS = ['#8B5CF6','#059669','#DC2626','#D97706','#2563EB','#DB2777'];
  function avatarColor(idx) { return AVATAR_COLORS[idx % AVATAR_COLORS.length]; }

  function isPlayerTurn(p) { return session.turnOrder?.[session.currentTurnIndex] === p?.id; }
  function cardCount(p)    { return isPlayerTurn(p) ? 4 : 3; }
  function pts(id)         { return session.totalScores?.[id] || 0; }

  // Socket listeners
  useEffect(() => {
    const fn = ({ hand: h, isStarter: s }) => { setHand(h||[]); setIsStarter(!!s); };
    socket.on(`hand_update_${playerId}`, fn);
    return () => socket.off(`hand_update_${playerId}`, fn);
  }, [playerId]);

  useEffect(() => {
    const fn = ({ seconds }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(seconds);
      timerRef.current = setInterval(() => setTimeLeft(p => {
        if (p<=1){clearInterval(timerRef.current);return 0;} return p-1;
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
    const fn = () => { setBuzzerRaceActive(true); setBuzzPulse(true); };
    socket.on('buzzer_race_started', fn); return () => socket.off('buzzer_race_started', fn);
  }, []);

  useEffect(() => {
    const fn = () => { setBuzzerUnlockedMsg(true); setTimeout(()=>setBuzzerUnlockedMsg(false),3500); };
    socket.on('buzzer_unlocked', fn); return () => socket.off('buzzer_unlocked', fn);
  }, []);

  useEffect(() => {
    const fn = ({ playerId: bid, buzzerLog: log }) => {
      setBuzzerLog(log); if (bid===playerId) setHasBuzzed(true);
    };
    socket.on('buzzer_pressed', fn); return () => socket.off('buzzer_pressed', fn);
  }, [playerId]);

  useEffect(() => {
    setHasBuzzed(false); setBuzzerLog([]); setSelectedCard(null);
    setTimeLeft(null); setBuzzerWindowOpen(false); setBuzzerWindowTime(null);
    setBuzzerRaceActive(false); setBuzzPulse(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (buzzerTimerRef.current) clearInterval(buzzerTimerRef.current);
  }, [session.currentRound]);

  useEffect(() => {
    window.history.pushState({ gameState:'playing' }, '');
    function handlePop() { setShowExitConfirm(true); window.history.pushState({ gameState:'playing' },''); }
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  function handleSelectCard(w) { if (!isMyTurn||isBuzzingPhase) return; setSelectedCard(p=>p===w?null:w); }
  function handlePassCard(card) {
    const c = card||selectedCard; if (!c||!isMyTurn) return;
    socket.emit('pass_card',{sessionId:session.id,playerId,cardToPass:c});
    setSelectedCard(null);
  }
  function handleBuzzer() { if (!canBuzz) return; socket.emit('press_buzzer',{sessionId:session.id,playerId}); }

  function handleDragStart(e,word) { setIsDragging(true); e.dataTransfer.setData('card',word); }
  function handleDragEnd()         { setIsDragging(false); setDragOver(false); }
  function handleDZOver(e)         { e.preventDefault(); setDragOver(true); }
  function handleDZLeave()         { setDragOver(false); }
  function handleDrop(e)           { e.preventDefault(); setDragOver(false); setIsDragging(false); const c=e.dataTransfer.getData('card'); if(c&&isMyTurn) handlePassCard(c); }

  // Buzz button state
  const buzzBg    = hasBuzzed ? '#9CA3AF' : buzzerRaceActive||buzzerWindowOpen ? T.gold : canBuzz ? T.red : 'rgba(233,69,96,0.35)';
  const buzzLabel = hasBuzzed ? 'BUZZED' : buzzerRaceActive ? 'RACE!' : buzzerWindowOpen ? `${buzzerWindowTime}s` : 'BUZZ!';
  const buzzSub   = hasBuzzed ? '✓ done' : isStarterLocked ? 'wait for cards back' : hasFourCards&&isMyTurn ? 'pass first' : !buzzerEnabled ? 'round 1 — 0pts' : isMyTurn&&!hasFourCards ? '3 match = buzz!' : 'pass → 3s window';

  // Table SVG constants
  const VW=560, VH=310, CX=280, CY=155, RX=196, RY=118, AO=16;
  const TOP_Y    = CY-RY-AO;
  const BOT_Y    = CY+RY+AO;
  const LEFT_X   = CX-RX-AO;
  const RIGHT_X  = CX+RX+AO;

  // Turn banner
  const turnText = isBuzzingPhase ? '🚨 Buzzer race — buzz now!'
    : isMyTurn ? `🎯 Your turn — ${hand.length} cards`
    : `⏳ ${currentTurnPlayer?.name||'…'}'s turn`;
  const turnBg = isBuzzingPhase ? T.red : isMyTurn ? T.teal : 'rgba(26,26,46,0.7)';

  return (
    <div style={{
      minHeight:'100vh', background:`linear-gradient(160deg, #1A1A2E 0%, #0D1B2A 100%)`,
      display:'flex', flexDirection:'column', fontFamily:'sans-serif',
    }}>

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes wh-pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.08);} }
        @keyframes wh-glow  { 0%,100%{box-shadow:0 0 0 0 rgba(233,69,96,0);}  50%{box-shadow:0 0 0 12px rgba(233,69,96,0.3);} }
        @keyframes wh-slide { from{opacity:0;transform:translateY(-10px);} to{opacity:1;transform:translateY(0);} }
        @keyframes wh-pop   { 0%{transform:scale(0.8);opacity:0;} 70%{transform:scale(1.05);} 100%{transform:scale(1);opacity:1;} }
        @keyframes wh-shimmer { 0%{opacity:0.6;} 50%{opacity:1;} 100%{opacity:0.6;} }
        .wh-pulse { animation: wh-pulse 0.9s ease-in-out infinite; }
        .wh-glow  { animation: wh-glow  1.2s ease-in-out infinite; }
        .wh-slide { animation: wh-slide 0.3s ease forwards; }
        .wh-pop   { animation: wh-pop   0.35s cubic-bezier(.34,1.56,.64,1) forwards; }
        .wh-shimmer { animation: wh-shimmer 2s ease infinite; }
      `}</style>

      {/* ── EXIT CONFIRM ── */}
      {showExitConfirm && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)' }}>
          <div className="wh-pop" style={{ background:'linear-gradient(145deg,#1E2A3A,#162030)',borderRadius:20,padding:28,maxWidth:320,width:'90%',textAlign:'center',border:'1px solid rgba(255,255,255,0.1)',boxShadow:'0 24px 48px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize:40,marginBottom:10 }}>🚪</div>
            <h2 style={{ fontSize:20,fontFamily:'Georgia,serif',color:T.white,marginBottom:8 }}>Leave the game?</h2>
            <p style={{ color:'rgba(255,255,255,0.55)',fontSize:13,marginBottom:24,lineHeight:1.6 }}>Your spot is held for 1.5 minutes. You can rejoin with the session code.</p>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={()=>setShowExitConfirm(false)} style={{ flex:1,padding:'12px',borderRadius:12,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.08)',color:T.white,fontWeight:600,cursor:'pointer',fontSize:13,transition:'background 0.15s ease' }}>Stay</button>
              <button onClick={()=>{setShowExitConfirm(false);onExit?.();}} style={{ flex:1,padding:'12px',borderRadius:12,border:'none',background:`linear-gradient(135deg,${T.red},${T.redD})`,color:T.white,fontWeight:700,cursor:'pointer',fontSize:13,boxShadow:`0 4px 12px rgba(233,69,96,0.4)` }}>Exit</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER HUD ── */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'rgba(0,0,0,0.3)',backdropFilter:'blur(8px)',borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <span style={{ fontSize:14,fontWeight:700,color:T.white,fontFamily:'Georgia,serif',letterSpacing:0.5 }}>Synapse</span>
        </div>
        <div style={{ display:'flex',gap:6,alignItems:'center' }}>
          {/* Round pill */}
          <div style={{ background:'rgba(255,255,255,0.1)',borderRadius:20,padding:'3px 10px',border:'1px solid rgba(255,255,255,0.15)' }}>
            <span style={{ fontSize:11,color:T.white,fontWeight:600 }}>Round {session.currentRound}/{session.rounds}</span>
          </div>
          {/* Mode pill */}
          <div style={{ background: isFunMode?'rgba(200,147,12,0.2)':'rgba(26,140,140,0.2)',borderRadius:20,padding:'3px 10px',border:`1px solid ${isFunMode?'rgba(200,147,12,0.4)':'rgba(26,140,140,0.4)'}` }}>
            <span style={{ fontSize:11,color:isFunMode?T.goldL:T.tealL,fontWeight:600 }}>{isFunMode?'🎉 Fun':'📚 Edu'}</span>
          </div>
          {/* Buzzer state */}
          {buzzerEnabled && !buzzerRaceActive && (
            <div style={{ background:'rgba(26,140,58,0.2)',borderRadius:20,padding:'3px 10px',border:'1px solid rgba(26,140,58,0.4)' }}>
              <span style={{ fontSize:11,color:'#6EE7B7',fontWeight:600 }}>🔓 Open</span>
            </div>
          )}
          {buzzerRaceActive && (
            <div className="wh-shimmer" style={{ background:'rgba(233,69,96,0.3)',borderRadius:20,padding:'3px 10px',border:'1px solid rgba(233,69,96,0.6)' }}>
              <span style={{ fontSize:11,color:'#FCA5A5',fontWeight:700 }}>🚨 Race!</span>
            </div>
          )}
        </div>
      </div>

      {/* ── TURN BANNER ── */}
      <div className="wh-slide" key={`${session.currentTurnIndex}-${isBuzzingPhase}`} style={{ background:turnBg,padding:'8px 16px',textAlign:'center',fontSize:12,fontWeight:700,color:T.white,letterSpacing:0.3,boxShadow:`0 2px 8px rgba(0,0,0,0.3)` }}>
        {turnText}
      </div>

      {/* ── BUZZER UNLOCKED TOAST ── */}
      {buzzerUnlockedMsg && (
        <div className="wh-slide" style={{ background:`linear-gradient(135deg,${T.teal},#115E59)`,padding:'8px 16px',textAlign:'center',fontSize:12,fontWeight:600,color:T.white,boxShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>
          🔓 Buzzer unlocked! Pass a card → buzz in the 3s window
        </div>
      )}

      {/* ── MAIN TABLE AREA ── */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'6px 10px',gap:0 }}>

        {/* ── TABLE SVG ── */}
        <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} fill="none"
          xmlns="http://www.w3.org/2000/svg" style={{ maxWidth:700,display:'block' }}>

          {/* Table glow */}
          <ellipse cx={CX} cy={CY} rx={RX+12} ry={RY+12}
            fill="none" stroke="rgba(200,147,12,0.12)" strokeWidth="8"/>

          {/* Table shadow */}
          <ellipse cx={CX+3} cy={CY+5} rx={RX} ry={RY} fill="rgba(0,0,0,0.4)"/>
          {/* Table surface outer */}
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
            fill={T.tableTop} stroke="#A07840" strokeWidth="3"/>
          {/* Table surface inner */}
          <ellipse cx={CX} cy={CY} rx={RX-10} ry={RY-10}
            fill={T.tableIn} stroke="#B8956A" strokeWidth="1.5"/>
          {/* Table felt texture ring */}
          <ellipse cx={CX} cy={CY} rx={RX-22} ry={RY-22}
            fill="none" stroke="rgba(184,149,106,0.3)" strokeWidth="1" strokeDasharray="3,6"/>

          {/* ── DROP ZONE ── */}
          <circle cx={CX} cy={CY} r="56"
            fill={dragOver ? 'rgba(200,147,12,0.2)' : 'rgba(200,147,12,0.06)'}
            stroke={dragOver ? T.gold : 'rgba(200,147,12,0.3)'}
            strokeWidth={dragOver ? 2.5 : 1.5}
            strokeDasharray={dragOver ? '0' : '6,4'}
            onDragOver={handleDZOver}
            onDragLeave={handleDZLeave}
            onDrop={handleDrop}
            style={{ cursor: isDragging&&isMyTurn ? 'copy' : 'default', transition:'all 0.2s ease' }}/>
          {dragOver && (
            <text x={CX} y={CY+70} textAnchor="middle" fontFamily="Georgia,serif"
              fontSize="10" fontWeight="700" fill={T.gold}>Drop to pass!</text>
          )}
          {!dragOver && (
            <text x={CX} y={CY+68} textAnchor="middle" fontFamily="sans-serif"
              fontSize="7.5" fill="rgba(200,147,12,0.6)">drag card here to pass</text>
          )}

          {/* ── BUZZ BUTTON ── */}
          {/* Outer glow ring — pulses when active */}
          {canBuzz && (
            <circle cx={CX} cy={CY} r="40"
              fill="none" stroke={buzzBg} strokeWidth="4" opacity="0.3"
              style={{ animation:'wh-pulse 1s ease-in-out infinite' }}/>
          )}
          {/* Button shadow */}
          <circle cx={CX+2} cy={CY+4} r="31" fill="rgba(0,0,0,0.35)"/>
          {/* Button body */}
          <circle cx={CX} cy={CY} r="31"
            fill={buzzBg}
            stroke={hasBuzzed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)'}
            strokeWidth="2"
            onClick={handleBuzzer}
            style={{ cursor:canBuzz?'pointer':'default', filter: canBuzz?DROP:'none', transition:'all 0.2s ease' }}/>
          {/* Highlight gloss */}
          <ellipse cx={CX-6} cy={CY-12} rx="14" ry="8" fill="rgba(255,255,255,0.15)"/>
          {/* Label */}
          <text x={CX} y={CY+1} textAnchor="middle" fontFamily="Georgia,serif"
            fontSize="13" fontWeight="700" letterSpacing="0.5"
            fill={T.white} style={{ pointerEvents:'none' }}>{buzzLabel}</text>
          <text x={CX} y={CY+13} textAnchor="middle" fontFamily="sans-serif"
            fontSize="7" fill="rgba(255,255,255,0.75)" style={{ pointerEvents:'none' }}>{buzzSub}</text>

          {/* ── TIMER BAR ── */}
          {timeLeft!==null && !isBuzzingPhase && (
            <g>
              <rect x={CX-44} y={CY+42} width="88" height="5" rx="2.5" fill="rgba(0,0,0,0.3)"/>
              <rect x={CX-44} y={CY+42}
                width={88*Math.max(0,timeLeft/30)} height="5" rx="2.5"
                fill={timeLeft<=5?T.red:timeLeft<=10?T.gold:T.teal}
                style={{ transition:'width 1s linear,fill 0.3s ease' }}/>
              <text x={CX} y={CY+58} textAnchor="middle" fontFamily="sans-serif"
                fontSize="8" fontWeight="700"
                fill={timeLeft<=5?T.red:T.muted}>{timeLeft}s</text>
            </g>
          )}
          {buzzerWindowOpen && (
            <g>
              <rect x={CX-22} y={CY+42} width="44" height="16" rx="8" fill={T.gold}/>
              <text x={CX} y={CY+54} textAnchor="middle" fontFamily="Georgia,serif"
                fontSize="10" fontWeight="700" fill={T.white}>⚡ {buzzerWindowTime}s</text>
            </g>
          )}

          {/* ══ TOP PLAYER ══ */}
          {topPlayer && (()=>{
            const isTurn=isPlayerTurn(topPlayer), cnt=cardCount(topPlayer);
            const col=avatarColor(0);
            return (
              <g>
                <AvatarCircle cx={CX} cy={TOP_Y} r={14} letter={topPlayer.name[0].toUpperCase()} color={col} isTurn={isTurn}/>
                <PlayerChip cx={CX} cy={TOP_Y+22} name={topPlayer.name} pts={pts(topPlayer.id)} isTurn={isTurn}/>
                {/* Face-down cards on table — rotated 180° pointing toward buzz */}
                {[...Array(cnt)].map((_,i)=>{
                  const total=cnt*24+(cnt-1)*4;
                  const x=CX-total/2+i*28+12;
                  const baseAngle=(i-(cnt-1)/2)*14;
                  const isEx=isTurn&&i===cnt-1;
                  return <FaceDownCardGroup key={i} x={x} y={CY-RY+22} rotate={baseAngle+180} isExtra={isEx}/>;
                })}
              </g>
            );
          })()}

          {/* ══ LEFT PLAYER ══ */}
          {leftPlayer && (()=>{
            const isTurn=isPlayerTurn(leftPlayer), cnt=cardCount(leftPlayer);
            const col=avatarColor(1);
            return (
              <g>
                {isTurn && <rect x={LEFT_X-20} y={CY-34} width="40" height="68" rx="12" fill="rgba(26,140,140,0.15)" stroke={T.teal} strokeWidth="1.5"/>}
                <AvatarCircle cx={LEFT_X} cy={CY-18} r={13} letter={leftPlayer.name[0].toUpperCase()} color={col} isTurn={isTurn}/>
                <PlayerChip cx={LEFT_X} cy={CY+6} name={leftPlayer.name} pts={pts(leftPlayer.id)} isTurn={isTurn}/>
                {/* Landscape cards fanning rightward → */}
                {[...Array(cnt)].map((_,i)=>{
                  const total=cnt*24+(cnt-1)*4;
                  const y=CY-total/2+i*28+11;
                  const angle=(i-(cnt-1)/2)*14;
                  const isEx=isTurn&&i===cnt-1;
                  return <FaceDownCardGroup key={i} x={CX-RX+18} y={y} rotate={angle} isExtra={isEx} isLandscape/>;
                })}
              </g>
            );
          })()}

          {/* ══ RIGHT PLAYER ══ */}
          {rightPlayer && (()=>{
            const isTurn=isPlayerTurn(rightPlayer), cnt=cardCount(rightPlayer);
            const col=avatarColor(2);
            return (
              <g>
                {isTurn && <rect x={RIGHT_X-20} y={CY-34} width="40" height="68" rx="12" fill="rgba(26,140,140,0.15)" stroke={T.teal} strokeWidth="1.5"/>}
                <AvatarCircle cx={RIGHT_X} cy={CY-18} r={13} letter={rightPlayer.name[0].toUpperCase()} color={col} isTurn={isTurn}/>
                <PlayerChip cx={RIGHT_X} cy={CY+6} name={rightPlayer.name} pts={pts(rightPlayer.id)} isTurn={isTurn}/>
                {/* Landscape cards fanning leftward ← */}
                {[...Array(cnt)].map((_,i)=>{
                  const total=cnt*24+(cnt-1)*4;
                  const y=CY-total/2+i*28+11;
                  const angle=-(i-(cnt-1)/2)*14;
                  const isEx=isTurn&&i===cnt-1;
                  return <FaceDownCardGroup key={i} x={CX+RX-50} y={y} rotate={angle} isExtra={isEx} isLandscape/>;
                })}
              </g>
            );
          })()}

          {/* ══ YOU — bottom ══ */}
          {/* Face-down cards on table ↑ */}
          {hand.length>0 && [...Array(hand.length)].map((_,i)=>{
            const cnt=hand.length;
            const total=cnt*24+(cnt-1)*4;
            const x=CX-total/2+i*28+12;
            const angle=-(i-(cnt-1)/2)*14;
            return <FaceDownCardGroup key={i} x={x} y={CY+RY-22} rotate={angle}/>;
          })}
          {/* My avatar */}
          <AvatarCircle cx={CX} cy={BOT_Y} r={14} letter={myPlayer?.name?.[0]?.toUpperCase()||'Y'} color="#0EA5E9" isTurn={isMyTurn}/>
          <PlayerChip cx={CX} cy={BOT_Y+22} name={myPlayer?.name||'You'} pts={pts(playerId)} isTurn={isMyTurn}/>

          {/* ── BUZZER LOG ── */}
          {buzzerLog.length>0 && (
            <g>
              {buzzerLog.map((b,i)=>{
                const p=players.find(pl=>pl.id===b.playerId);
                const col=b.hasCompleteSet?'#6EE7B7':b.invalid?'#FCD34D':'#FCA5A5';
                return (
                  <g key={b.playerId}>
                    <rect x="8" y={8+i*18} width="110" height="15" rx="7" fill="rgba(0,0,0,0.5)"/>
                    <text x="14" y={19+i*18} fontFamily="sans-serif" fontSize="8.5" fill={col}>
                      {medals[i]||`#${i+1}`} {p?.name} {b.invalid?'(0pts)':b.hasCompleteSet?'✓ match':'✗ no match'}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

        </svg>

        {/* ── YOUR FACE-UP WORD CARDS ── */}
        <div style={{ display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginTop:2,padding:'0 8px' }}>
          {hand.length===0 ? (
            <p style={{ fontSize:13,color:'rgba(255,255,255,0.5)',fontFamily:'Georgia,serif',padding:'8px 0' }}>Dealing cards…</p>
          ) : hand.map((w,i)=>(
            <WordCard key={`${w}-${i}`}
              word={w} selected={selectedCard===w}
              disabled={!isMyTurn||isBuzzingPhase}
              onClick={()=>handleSelectCard(w)}
              draggable={isMyTurn&&!isBuzzingPhase}
              onDragStart={e=>handleDragStart(e,w)}
              onDragEnd={handleDragEnd}/>
          ))}
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div style={{ display:'flex',gap:10,alignItems:'center',marginTop:8,minHeight:40 }}>
          {isMyTurn && selectedCard && !isBuzzingPhase && (
            <button className="wh-pop" onClick={()=>handlePassCard()} style={{
              background:`linear-gradient(135deg,${T.navy},#0F2040)`,
              border:`2px solid ${T.gold}`,
              borderRadius:14,padding:'10px 24px',
              color:T.white,fontSize:13,fontWeight:700,cursor:'pointer',
              fontFamily:'Georgia,serif',letterSpacing:0.5,
              boxShadow:`0 4px 16px rgba(200,147,12,0.3)`,
              filter: DROP,
            }}>
              Pass "{selectedCard}" →
            </button>
          )}
          {isMyTurn && !selectedCard && !isBuzzingPhase && hand.length>0 && (
            <p style={{ fontSize:10,color:'rgba(255,255,255,0.4)',textAlign:'center',letterSpacing:0.3 }}>
              Tap a card to select · drag to centre to pass
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
