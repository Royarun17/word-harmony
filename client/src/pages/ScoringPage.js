import React from 'react';
import socket from '../utils/socket';

const T = {
  pageBg:'#F7F2EA', cardBg:'#FFFFFF', border:'#E8E0D0',
  textPrimary:'#1A1A2E', textSecondary:'#9B8E7A', textMuted:'#C4B9A8',
  gold:'#C8930C', goldBg:'#FEF3E2', teal:'#1A8C8C', tealBg:'#E8F4F4',
  red:'#E94560', navy:'#1A1A2E', white:'#FFFFFF', tabBg:'#F0EDE8',
};
const MEDALS = ['🥇','🥈','🥉'];

export default function ScoringPage({ session, playerId, isHost, scoringData }) {
  const isFun   = session.gameMode === 'fun';
  const players = session.players || [];

  if (!scoringData) return (
    <div style={{ minHeight:'100vh', background:T.pageBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{`@keyframes wh-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}.wh-spin{animation:wh-spin 1s linear infinite;}`}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, borderRadius:'50%', border:`4px solid ${T.border}`, borderTopColor:T.gold, margin:'0 auto 16px' }} className="wh-spin"/>
        <p style={{ color:T.textSecondary, fontSize:14, fontFamily:'Georgia,serif' }}>Tallying scores…</p>
      </div>
    </div>
  );

  const { buzzerLog=[], roundScores=[], definitions={}, synonymClusters={} } = scoringData;
  const isLastRound = session.currentRound >= session.rounds;
  function handleNext() { socket.emit('next_round', { sessionId: session.id }); }

  return (
    <div style={{ minHeight:'100vh', background:T.pageBg, padding:'16px 16px 32px', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <style>{`@keyframes wh-pop{0%{transform:scale(0.96);opacity:0;}100%{transform:scale(1);opacity:1;}}.wh-pop{animation:wh-pop 0.3s cubic-bezier(.34,1.56,.64,1) forwards;}`}</style>

      <div style={{ width:'100%', maxWidth:500 }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.12em', textTransform:'uppercase', margin:0 }}>Round {session.currentRound} complete</p>
          <h2 style={{ fontSize:26, fontWeight:700, color:T.navy, fontFamily:'Georgia,serif', margin:'6px 0' }}>Results</h2>
          <p style={{ fontSize:12, color:T.textSecondary, margin:0 }}>{session.rounds-session.currentRound} round{session.rounds-session.currentRound!==1?'s':''} remaining</p>
        </div>

        {/* Buzzer order */}
        <div style={{ marginBottom:14 }}>
          {buzzerLog.length > 0 ? buzzerLog.map((b,i) => {
            const p = players.find(pl=>pl.id===b.playerId);
            const pts = roundScores.find(s=>s.playerId===b.playerId)?.points || 0;
            const isMe = b.playerId===playerId;
            return (
              <div key={b.playerId} className="wh-pop" style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', marginBottom:6, borderRadius:14, background: i===0 ? T.goldBg : isMe ? T.tealBg : T.cardBg, border:`1px solid ${i===0?'rgba(200,147,12,0.3)':isMe?'rgba(26,140,140,0.2)':T.border}`, boxShadow:'0 1px 4px rgba(26,26,46,0.06)' }}>
                <span style={{ fontSize:24 }}>{MEDALS[i]||`#${i+1}`}</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:T.textPrimary, margin:0 }}>{p?.name}{isMe?' (you)':''}</p>
                  <p style={{ fontSize:11, color: b.hasCompleteSet ? T.teal : T.red, margin:0 }}>
                    {b.invalid?'⚠️ Invalid — Round 1':b.hasCompleteSet?'✓ Matching set':'✗ No match'}
                  </p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:20, fontWeight:800, color: pts>0 ? T.gold : T.textMuted, margin:0 }}>+{pts}</p>
                  <p style={{ fontSize:10, color:T.textMuted, margin:0 }}>pts</p>
                </div>
              </div>
            );
          }) : (
            <div style={{ textAlign:'center', padding:'18px', background:T.cardBg, borderRadius:14, border:`1px solid ${T.border}` }}>
              <p style={{ color:T.textSecondary, fontSize:13, margin:0 }}>Nobody buzzed this round.</p>
            </div>
          )}
        </div>

        {/* Word clusters */}
        {Object.entries(synonymClusters).map(([topic, words]) => (
          <div key={topic} style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:14, padding:'14px', marginBottom:12, boxShadow:'0 1px 4px rgba(26,26,46,0.06)' }}>
            <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
              {isFun ? `Topic: ${topic}` : `Based on: ${topic}`}
            </p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
              {words.map(w => (
                <span key={w} style={{ padding:'3px 10px', borderRadius:99, background:T.tealBg, border:'1px solid rgba(26,140,140,0.3)', color:T.teal, fontSize:11, fontWeight:600 }}>{w}</span>
              ))}
            </div>
            {words.map(w => definitions[w] && (
              <div key={w} style={{ marginBottom:6, padding:'8px 10px', background:T.tabBg, borderRadius:8, borderLeft:`2.5px solid ${T.teal}` }}>
                <p style={{ fontSize:10, fontWeight:700, color:T.teal, marginBottom:3 }}>{w}</p>
                <p style={{ fontSize:11, color:T.textSecondary, margin:0, lineHeight:1.5 }}>{definitions[w]}</p>
              </div>
            ))}
          </div>
        ))}

        {/* Running totals */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:14, padding:'14px', marginBottom:20, boxShadow:'0 1px 4px rgba(26,26,46,0.06)' }}>
          <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Total scores</p>
          {[...players].sort((a,b)=>(session.totalScores?.[b.id]||0)-(session.totalScores?.[a.id]||0)).map((p,i) => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <span style={{ fontSize:14, width:22 }}>{MEDALS[i]||`${i+1}.`}</span>
              <p style={{ flex:1, fontSize:13, color: p.id===playerId ? T.teal : T.textPrimary, fontWeight: p.id===playerId?700:400, margin:0, fontFamily:'Georgia,serif' }}>{p.name}</p>
              <p style={{ fontSize:16, fontWeight:800, color:T.gold, margin:0 }}>{session.totalScores?.[p.id]||0}</p>
            </div>
          ))}
        </div>

        {isHost ? (
          <button onClick={handleNext} style={{
            width:'100%', padding:'14px', borderRadius:14, border:'none', cursor:'pointer',
            background: isLastRound ? `linear-gradient(135deg,${T.gold},#A07010)` : `linear-gradient(135deg,${T.teal},#115E59)`,
            color: T.white, fontSize:15, fontWeight:800, fontFamily:'Georgia,serif',
            boxShadow: `0 4px 16px ${isLastRound?'rgba(200,147,12,0.3)':'rgba(26,140,140,0.3)'}`,
          }}>
            {isLastRound ? 'See final results →' : 'Next round →'}
          </button>
        ) : (
          <div style={{ textAlign:'center', padding:'14px', background:T.cardBg, borderRadius:12, border:`1px solid ${T.border}` }}>
            <p style={{ fontSize:13, color:T.textSecondary, margin:0 }}>Waiting for host to continue…</p>
          </div>
        )}
      </div>
    </div>
  );
}
