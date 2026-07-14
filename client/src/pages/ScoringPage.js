import React from 'react';
import socket from '../utils/socket';

const T = {
  navy:'#1A1A2E', dark:'#0D1B2A', gold:'#C8930C', goldL:'#FFD166',
  teal:'#1A8C8C', tealL:'#99F6E4', red:'#E94560', white:'#FFFFFF',
  muted:'rgba(255,255,255,0.45)', border:'rgba(255,255,255,0.1)',
};

const MEDALS = ['🥇','🥈','🥉'];

export default function ScoringPage({ session, playerId, isHost, scoringData }) {
  const isFun = session.gameMode === 'fun';
  const players = session.players || [];

  if (!scoringData) {
    return (
      <div style={{ minHeight:'100vh', background:`linear-gradient(160deg,${T.navy} 0%,${T.dark} 100%)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <style>{`@keyframes wh-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}.wh-spin{animation:wh-spin 1s linear infinite;}`}</style>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:50, height:50, borderRadius:'50%', border:`4px solid rgba(200,147,12,0.2)`, borderTopColor:T.gold, margin:'0 auto 16px' }} className="wh-spin"/>
          <p style={{ color:T.muted, fontSize:14, fontFamily:'Georgia,serif' }}>Tallying scores…</p>
        </div>
      </div>
    );
  }

  const { buzzerLog=[], roundScores=[], definitions={}, synonymClusters={} } = scoringData;
  const isLastRound = session.currentRound >= session.rounds;

  function handleNext() { socket.emit('next_round', { sessionId: session.id }); }

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg,${T.navy} 0%,${T.dark} 100%)`, padding:'16px 16px 32px', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <style>{`@keyframes wh-pop{0%{transform:scale(0.95);opacity:0;}100%{transform:scale(1);opacity:1;}}.wh-pop{animation:wh-pop 0.3s cubic-bezier(.34,1.56,.64,1) forwards;}`}</style>

      <div style={{ width:'100%', maxWidth:500 }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <p style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'0.12em', textTransform:'uppercase', margin:0 }}>Round {session.currentRound} complete</p>
          <h2 style={{ fontSize:26, fontWeight:700, color:T.white, fontFamily:'Georgia,serif', margin:'6px 0' }}>Results</h2>
          <p style={{ fontSize:12, color:T.muted, margin:0 }}>{session.rounds - session.currentRound} round{session.rounds - session.currentRound !== 1 ? 's' : ''} remaining</p>
        </div>

        {/* Buzzer order */}
        <div className="wh-pop" style={{ marginBottom:16 }}>
          {buzzerLog.length > 0 ? buzzerLog.map((b, i) => {
            const p = players.find(pl => pl.id === b.playerId);
            const score = roundScores.find(s => s.playerId === b.playerId);
            const pts = score?.points || 0;
            const isMe = b.playerId === playerId;
            return (
              <div key={b.playerId} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', marginBottom:6, borderRadius:14, background: i===0 ? 'rgba(200,147,12,0.15)' : 'rgba(255,255,255,0.05)', border:`1px solid ${i===0 ? 'rgba(200,147,12,0.4)' : T.border}`, transition:'all 0.2s' }}>
                <span style={{ fontSize:22 }}>{MEDALS[i] || `#${i+1}`}</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:T.white, margin:0 }}>{p?.name}{isMe?' (you)':''}</p>
                  <p style={{ fontSize:11, color: b.hasCompleteSet ? T.tealL : '#FCA5A5', margin:0 }}>
                    {b.invalid ? '⚠️ Invalid — Round 1' : b.hasCompleteSet ? '✓ Matching set' : '✗ No match'}
                  </p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:20, fontWeight:800, color: pts > 0 ? T.goldL : T.muted, margin:0 }}>+{pts}</p>
                  <p style={{ fontSize:10, color:T.muted, margin:0 }}>pts</p>
                </div>
              </div>
            );
          }) : (
            <div style={{ textAlign:'center', padding:'20px', background:'rgba(255,255,255,0.04)', borderRadius:14, border:`1px solid ${T.border}` }}>
              <p style={{ color:T.muted, fontSize:13, margin:0 }}>Nobody buzzed this round.</p>
            </div>
          )}
        </div>

        {/* Word clusters + definitions */}
        {Object.entries(synonymClusters).map(([topic, words]) => (
          <div key={topic} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:14, padding:'14px', marginBottom:12 }}>
            <p style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
              {isFun ? `Topic: ${topic}` : `Based on: ${topic}`}
            </p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
              {words.map(w => (
                <span key={w} style={{ padding:'3px 10px', borderRadius:99, background:'rgba(26,140,140,0.2)', border:`1px solid rgba(26,140,140,0.4)`, color:T.tealL, fontSize:11, fontWeight:600 }}>{w}</span>
              ))}
            </div>
            {words.map(w => definitions[w] && (
              <div key={w} style={{ marginBottom:8, padding:'8px 10px', background:'rgba(0,0,0,0.2)', borderRadius:8, borderLeft:`2px solid ${T.teal}` }}>
                <p style={{ fontSize:10, fontWeight:700, color:T.tealL, marginBottom:3 }}>{w}</p>
                <p style={{ fontSize:11, color:T.muted, margin:0, lineHeight:1.5 }}>{definitions[w]}</p>
              </div>
            ))}
          </div>
        ))}

        {/* Running totals */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:14, padding:'14px', marginBottom:20 }}>
          <p style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Total scores</p>
          {[...players].sort((a,b)=>(session.totalScores?.[b.id]||0)-(session.totalScores?.[a.id]||0)).map((p,i) => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <span style={{ fontSize:14, width:20 }}>{MEDALS[i]||`${i+1}.`}</span>
              <p style={{ flex:1, fontSize:13, color: p.id===playerId ? T.tealL : T.white, fontWeight: p.id===playerId ? 700 : 400, margin:0, fontFamily:'Georgia,serif' }}>{p.name}</p>
              <p style={{ fontSize:16, fontWeight:800, color:T.goldL, margin:0 }}>{session.totalScores?.[p.id]||0}</p>
            </div>
          ))}
        </div>

        {isHost && (
          <button onClick={handleNext} style={{
            width:'100%', padding:'14px', borderRadius:14, border:'none', cursor:'pointer',
            background: isLastRound ? `linear-gradient(135deg,${T.gold},#A07010)` : `linear-gradient(135deg,${T.teal},#115E59)`,
            color: T.white, fontSize:15, fontWeight:800, fontFamily:'Georgia,serif', letterSpacing:0.5,
            boxShadow: `0 4px 20px ${isLastRound ? 'rgba(200,147,12,0.4)' : 'rgba(26,140,140,0.4)'}`,
          }}>
            {isLastRound ? 'See final results →' : 'Next round →'}
          </button>
        )}
        {!isHost && (
          <div style={{ textAlign:'center', padding:'14px', background:'rgba(255,255,255,0.04)', borderRadius:12, border:`1px solid ${T.border}` }}>
            <p style={{ fontSize:13, color:T.muted, margin:0 }}>Waiting for host to continue…</p>
          </div>
        )}
      </div>
    </div>
  );
}
