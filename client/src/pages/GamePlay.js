import React, { useState, useEffect, useRef } from 'react';
import socket from '../utils/socket';
import GameCard from '../components/GameCard';
import PlayerList from '../components/PlayerList';

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

  const isMyTurn = session.turnOrder?.[session.currentTurnIndex] === playerId;
  const isBuzzingPhase = session.phase === 'buzzing';
  const buzzerEnabled = session.firstRoundOver;
  const isFunMode = session?.gameMode === 'fun';
  const difficulty = session?.difficulty || 'medium';
  const starterPlayer = session.players?.find(p => p.id === session.starterPlayerId);
  const currentTurnPlayer = session.players?.find(p => p.id === session.turnOrder?.[session.currentTurnIndex]);
  const medals = ['🥇','🥈','🥉'];

  const canBuzz = !hasBuzzed && (buzzerRaceActive || buzzerWindowOpen || (buzzerEnabled && isMyTurn));

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

  const diffLabel = difficulty==='easy'?'😊 Easy':difficulty==='hard'?'🔥 Hard':'🧠 Medium';

  const buzzerStatus = () => {
    if (hasBuzzed) return '✅ You buzzed!';
    if (buzzerRaceActive) return '🚨 Race! Buzz now!';
    if (buzzerWindowOpen) return `⚡ ${buzzerWindowTime}s window — BUZZ NOW!`;
    if (!buzzerEnabled && isMyTurn) return '⚠️ Round 1 active — buzzing scores 0 pts!';
    if (buzzerEnabled && isMyTurn) return '🟢 Your turn — buzz if you have 3 matching cards!';
    return '⏳ Pass a card to open your 3s buzz window';
  };

  return (
    <div className="page" style={{ paddingTop: 24 }}>
      <div className="container-lg">
        <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 28, lineHeight: 1 }}>Word Harmony</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Round {session.currentRound} of {session.rounds}</p>
          </div>
          <div className="flex gap-8 items-center">
            {buzzerRaceActive ? <span className="badge" style={{ background:'var(--danger)',color:'white' }}>🚨 Buzzer Race!</span>
              : !buzzerEnabled ? <span className="badge badge-gold">⚠️ Round 1 — buzz invalid</span>
              : <span className="badge badge-teal">🔓 Buzzer open</span>}
            <span className="badge badge-muted">{isFunMode?'🎉 Fun':'📚 Edu'} · {diffLabel}</span>
            <span className="badge badge-ink">Round {session.currentRound}/{session.rounds}</span>
          </div>
        </div>

        {buzzerUnlockedMsg && (
          <div style={{ background:'var(--teal)',color:'white',borderRadius:'var(--radius-md)',padding:'14px 20px',marginBottom:16,textAlign:'center',fontWeight:700,fontSize:16 }}>
            🔓 Round 1 complete! Pass a card — then buzz in the 3 second window!
          </div>
        )}

        {buzzerRaceActive && !hasBuzzed && (
          <div style={{ background:'var(--danger)',color:'white',borderRadius:'var(--radius-md)',padding:'14px 20px',marginBottom:16,textAlign:'center',fontWeight:700,fontSize:18 }}>
            🚨 BUZZER RACE — Everyone buzz now!
          </div>
        )}

        {isStarter && !session.firstRoundOver && (
          <div style={{ background:'var(--gold-light)',border:'2px solid var(--gold)',borderRadius:'var(--radius-md)',padding:'14px 20px',marginBottom:16,display:'flex',alignItems:'center',gap:12 }}>
            <span style={{ fontSize:24 }}>⭐</span>
            <div>
              <p style={{ fontWeight:700,color:'#7A5200',fontSize:15 }}>You start this round!</p>
              <p style={{ fontSize:13,color:'#7A5200' }}>You have 4 cards. Pass one — buzzer unlocks after cards travel all the way around back to you.</p>
            </div>
          </div>
        )}

        {justReceived && !isMyTurn && (
          <div style={{ background:'var(--teal-light)',border:'2px solid var(--teal)',borderRadius:'var(--radius-md)',padding:'12px 18px',marginBottom:16,display:'flex',alignItems:'center',gap:10 }}>
            <span style={{ fontSize:20 }}>📨</span>
            <p style={{ fontSize:14,color:'var(--teal)',fontWeight:600 }}>Card received! You now have {hand.length} cards.</p>
          </div>
        )}

        <div className="flex gap-24" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div className={`turn-banner ${isMyTurn?'':'waiting'}`} style={{ marginBottom:8 }}>
              {isBuzzingPhase ? '🚨 Buzzer race — buzz as fast as you can!'
                : isMyTurn ? `🎯 Your turn — ${hand.length} cards, select one to pass`
                : `Waiting for ${currentTurnPlayer?.name||'…'} to pass`}
            </div>

            {timeLeft !== null && !isBuzzingPhase && (
              <div style={{ marginBottom:16 }}>
                <div className="flex justify-between items-center" style={{ marginBottom:6 }}>
                  <span style={{ fontSize:13,color:timeLeft<=5?'var(--danger)':'var(--muted)',fontWeight:600 }}>
                    {isMyTurn?`⏱ ${timeLeft}s to pass`:`⏱ ${timeLeft}s`}
                  </span>
                  <span style={{ fontSize:22,fontWeight:900,color:timeLeft<=5?'var(--danger)':timeLeft<=10?'var(--gold)':'var(--teal)' }}>{timeLeft}</span>
                </div>
                <div style={{ height:10,background:'var(--blush)',borderRadius:5,overflow:'hidden' }}>
                  <div style={{ height:'100%',borderRadius:5,background:timeLeft<=5?'var(--danger)':timeLeft<=10?'var(--gold)':'var(--teal)',width:`${(timeLeft/30)*100}%`,transition:'width 1s linear,background 0.3s ease' }} />
                </div>
              </div>
            )}

            {buzzerWindowOpen && buzzerWindowTime !== null && (
              <div style={{ background:'var(--danger)',borderRadius:'var(--radius-md)',padding:'10px 16px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <span style={{ color:'white',fontWeight:700,fontSize:15 }}>⚡ Buzz window open!</span>
                <span style={{ color:'white',fontWeight:900,fontSize:28 }}>{buzzerWindowTime}s</span>
              </div>
            )}

            <div className="panel" style={{ marginBottom:20 }}>
              <div className="flex justify-between items-center" style={{ marginBottom:16 }}>
                <div>
                  <h3 style={{ fontSize:16,fontFamily:'var(--font-body)',fontWeight:600 }}>
                    Your Hand
                    <span className="badge badge-muted" style={{ marginLeft:10,fontSize:12 }}>{hand.length} card{hand.length!==1?'s':''}</span>
                    {hand.length===4 && <span className="badge badge-gold" style={{ marginLeft:8,fontSize:12 }}>{isMyTurn?'Pick one to pass!':'Card received!'}</span>}
                  </h3>
                  <p style={{ fontSize:12,color:'var(--muted)',marginTop:4 }}>
                    {isBuzzingPhase?'Buzzer race active!':isMyTurn?'Select a card to pass clockwise':isFunMode?'Collect 3 cards from the same topic':'Collect 3 cards with the same meaning'}
                  </p>
                </div>
                {isMyTurn && selectedCard && !isBuzzingPhase && (
                  <button className="btn btn-primary" onClick={handlePassCard}>Pass "{selectedCard}" →</button>
                )}
              </div>

              {hand.length === 0 ? (
                <div style={{ textAlign:'center',padding:'32px 0',color:'var(--muted)' }}>
                  <div className="spinner" style={{ margin:'0 auto 12px' }} /><p>Dealing cards…</p>
                </div>
              ) : (
                <div className="flex gap-16" style={{ flexWrap:'wrap' }}>
                  {hand.map((w,i) => (
                    <GameCard key={`${w}-${i}`} word={w} selected={selectedCard===w}
                      onClick={()=>handleSelectCard(w)} disabled={!isMyTurn||isBuzzingPhase}
                      label={isMyTurn&&!isBuzzingPhase?'tap to select':''} />
                  ))}
                </div>
              )}
              {isMyTurn && !selectedCard && !isBuzzingPhase && hand.length>0 && (
                <p style={{ fontSize:13,color:'var(--muted)',marginTop:12,textAlign:'center' }}>↑ Tap a card to select it, then click Pass</p>
              )}
            </div>

            <div className="panel text-center">
              <p style={{ fontSize:13,fontWeight:600,color:'var(--muted)',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.08em' }}>Buzzer</p>
              <p style={{ fontSize:13,color:hasBuzzed?'var(--success)':buzzerRaceActive||buzzerWindowOpen?'var(--danger)':'var(--muted)',marginBottom:20,fontWeight:600 }}>
                {buzzerStatus()}
              </p>
              <div className="flex justify-center" style={{ marginBottom:16 }}>
                <button className={`buzzer-btn ${canBuzz?'ready':''} ${buzzerEnabled&&!hasBuzzed?'unlocked':''}`} onClick={handleBuzzer} disabled={!canBuzz}>BUZZ!</button>
              </div>
              <p style={{ fontSize:12,color:'var(--muted)' }}>
                {buzzerRaceActive?'Race mode — buzz anytime!':buzzerEnabled?'Pass a card → 3s window → BUZZ!':'Buzzing before Round 1 = 0 points'}
              </p>
              {buzzerLog.length > 0 && (
                <div style={{ marginTop:20,textAlign:'left' }}>
                  <p style={{ fontSize:13,fontWeight:600,color:'var(--muted)',marginBottom:8 }}>Buzzer order:</p>
                  {buzzerLog.map((b,i) => {
                    const p = session.players?.find(pl=>pl.id===b.playerId);
                    return (
                      <div key={b.playerId} className="flex items-center gap-8" style={{ marginBottom:6 }}>
                        <span style={{ fontSize:18 }}>{medals[i]||`#${i+1}`}</span>
                        <span style={{ fontSize:14,fontWeight:b.playerId===playerId?700:400 }}>{p?.name} {b.playerId===playerId?'(you)':''}</span>
                        <span className={`badge ${b.hasCompleteSet?'badge-teal':'badge-muted'}`} style={{ marginLeft:'auto',fontSize:11 }}>
                          {b.invalid?'⚠️ invalid':b.autoBuzzed?'auto':b.hasCompleteSet?'✓ valid':'✗ no match'}
                        </span>
                      </div>
                    );
                  })}
                  {isBuzzingPhase && buzzerLog.length < (session.players?.length||0) && (
                    <p style={{ fontSize:13,color:'var(--danger)',marginTop:8,fontWeight:600 }}>
                      🚨 {(session.players?.length||0)-buzzerLog.length} player{(session.players?.length||0)-buzzerLog.length!==1?'s':''} haven't buzzed!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ width:240,flexShrink:0 }}>
            <div className="panel">
              <h3 style={{ fontSize:13,fontFamily:'var(--font-body)',fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:14 }}>Players & Scores</h3>
              <PlayerList players={session.players||[]} hostId={session.hostId} currentTurnId={session.turnOrder?.[session.currentTurnIndex]} totalScores={session.totalScores} />
            </div>
            <div className="panel" style={{ marginTop:16 }}>
              <h3 style={{ fontSize:13,fontFamily:'var(--font-body)',fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12 }}>How to Win</h3>
              <ol style={{ paddingLeft:18,fontSize:13,color:'var(--muted)',lineHeight:2 }}>
                <li>{isFunMode?'Collect 3 topic cards':'Collect 3 synonym cards'}</li>
                <li>Pass a card on your turn</li>
                <li>Buzz in the 3s window</li>
                <li>Buzz order = points!</li>
              </ol>
            </div>
            <div className="panel" style={{ marginTop:16,background:'var(--blush)' }}>
              <h3 style={{ fontSize:13,fontFamily:'var(--font-body)',fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10 }}>This Round</h3>
              <div style={{ fontSize:13,color:'var(--ink)',lineHeight:1.8 }}>
                <p><strong>Starter:</strong> {starterPlayer?.name||'—'}</p>
                <p><strong>Buzzer:</strong> {buzzerEnabled?'🔓 Open':'⚠️ Invalid'}</p>
                <p><strong>Phase:</strong> {isBuzzingPhase?'🚨 Race!':'🃏 Trading'}</p>
                <p><strong>Mode:</strong> {isFunMode?'🎉 Fun':'📚 Education'}</p>
                <p><strong>Level:</strong> {diffLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
