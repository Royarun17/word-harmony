import React from 'react';

const T = {
  pageBg:'#F7F2EA', cardBg:'#FFFFFF', border:'#E8E0D0',
  textPrimary:'#1A1A2E', textSecondary:'#9B8E7A', textMuted:'#C4B9A8',
  gold:'#C8930C', goldBg:'#FEF3E2', teal:'#1A8C8C', tealBg:'#E8F4F4',
  red:'#E94560', navy:'#1A1A2E', white:'#FFFFFF', tabBg:'#F0EDE8',
};
const MEDALS = ['🥇','🥈','🥉'];
const AVATAR_COLORS = ['#8B5CF6','#059669','#DC2626','#D97706','#2563EB','#DB2777','#0EA5E9','#EA580C'];

export default function GameEnded({ finalScores, playerId, onPlayAgain }) {
  const sorted = [...(finalScores||[])].sort((a,b)=>b.totalScore-a.totalScore);
  const winner = sorted[0];
  const isWinner = winner?.playerId === playerId;

  return (
    <div style={{ minHeight:'100vh', background:T.pageBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20 }}>
      <style>{`
        @keyframes wh-pop{0%{transform:scale(0.8);opacity:0;}70%{transform:scale(1.05);}100%{transform:scale(1);opacity:1;}}
        @keyframes wh-float{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
        .wh-pop{animation:wh-pop 0.4s cubic-bezier(.34,1.56,.64,1) forwards;}
        .wh-float{animation:wh-float 3s ease-in-out infinite;}
      `}</style>

      <div style={{ width:'100%', maxWidth:420, textAlign:'center' }}>

        {/* Trophy */}
        <div className="wh-float" style={{ fontSize:90, marginBottom:10, lineHeight:1 }}>🏆</div>

        {/* Winner */}
        <div className="wh-pop" style={{ marginBottom:24 }}>
          {isWinner ? (
            <>
              <h1 style={{ fontSize:34, fontWeight:800, color:T.gold, fontFamily:'Georgia,serif', margin:0 }}>You won!</h1>
              <p style={{ fontSize:14, color:T.textSecondary, marginTop:6 }}>Congratulations, {winner?.playerName}!</p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize:28, fontWeight:800, color:T.navy, fontFamily:'Georgia,serif', margin:0 }}>{winner?.playerName} wins!</h1>
              <p style={{ fontSize:14, color:T.textSecondary, marginTop:6 }}>Great game everyone!</p>
            </>
          )}
        </div>

        {/* Leaderboard */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:20, padding:'16px', marginBottom:20, boxShadow:'0 8px 32px rgba(26,26,46,0.1)' }}>
          <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14 }}>Final standings</p>
          {sorted.map((p,i) => {
            const isMe = p.playerId===playerId;
            const isFirst = i===0;
            return (
              <div key={p.playerId} className="wh-pop" style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', marginBottom:6, borderRadius:14, background: isFirst ? T.goldBg : isMe ? T.tealBg : T.tabBg, border:`1px solid ${isFirst?'rgba(200,147,12,0.35)':isMe?'rgba(26,140,140,0.25)':T.border}`, animationDelay:`${i*0.08}s`, opacity:0, boxShadow:'0 1px 4px rgba(26,26,46,0.06)' }}>
                <span style={{ fontSize:24, width:32 }}>{MEDALS[i]||`${i+1}`}</span>
                <div style={{ width:36, height:36, borderRadius:'50%', background:AVATAR_COLORS[i%8], display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:T.white, border:`2px solid ${isFirst?T.gold:'rgba(255,255,255,0.8)'}`, flexShrink:0 }}>
                  {p.playerName?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex:1, textAlign:'left' }}>
                  <p style={{ fontSize:13, fontWeight: isMe?700:500, color: isMe?T.teal:T.textPrimary, margin:0, fontFamily:'Georgia,serif' }}>{p.playerName}{isMe?' (you)':''}</p>
                </div>
                <div>
                  <p style={{ fontSize:22, fontWeight:800, color: isFirst?T.gold:T.textSecondary, margin:0 }}>{p.totalScore}</p>
                  <p style={{ fontSize:9, color:T.textMuted, margin:0 }}>pts</p>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={onPlayAgain} style={{
          width:'100%', padding:'14px', borderRadius:14, border:'none', cursor:'pointer',
          background:`linear-gradient(135deg,${T.gold},#A07010)`,
          color:T.navy, fontSize:15, fontWeight:800, fontFamily:'Georgia,serif',
          boxShadow:'0 4px 16px rgba(200,147,12,0.3)', marginBottom:10,
        }}>Play again</button>

        <button onClick={onPlayAgain} style={{ width:'100%', padding:'12px', borderRadius:12, border:`1px solid ${T.border}`, background:'transparent', color:T.textSecondary, fontSize:12, cursor:'pointer' }}>
          Back to lobby
        </button>
      </div>
    </div>
  );
}
