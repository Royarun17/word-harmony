import React, { useState } from 'react';
import socket from '../utils/socket';
import AvatarPicker, { AvatarDisplay } from '../components/AvatarPicker';

const T = {
  pageBg:'#F7F2EA', cardBg:'#FFFFFF', border:'#E8E0D0',
  textPrimary:'#1A1A2E', textSecondary:'#9B8E7A', textMuted:'#C4B9A8',
  gold:'#C8930C', goldBg:'#FEF3E2', teal:'#1A8C8C', tealBg:'#E8F4F4',
  red:'#E94560', navy:'#1A1A2E', white:'#FFFFFF', tabBg:'#F0EDE8',
};

const AVATAR_COLORS = ['#8B5CF6','#059669','#DC2626','#D97706','#2563EB','#DB2777','#0EA5E9','#EA580C'];

export default function WaitingRoom({ session, playerId, isHost }) {
  const [showAvatar, setShowAvatar] = useState(false);
  const players    = session.players || [];
  const maxPlayers = session.maxPlayers || 4;
  const botsNeeded = Math.max(0, maxPlayers - players.length);
  const canStart   = isHost && players.filter(p => !p.isBot).length >= 1;

  function handleStart() { socket.emit('start_submission', { sessionId: session.id }); }
  function handleAvatarChange(av) { socket.emit('update_avatar', { sessionId: session.id, playerId, avatar: av }); }

  return (
    <div style={{ minHeight:'100vh', background:T.pageBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20 }}>
      <style>{`@keyframes wh-pop{0%{transform:scale(0.96);opacity:0;}100%{transform:scale(1);opacity:1;}}.wh-pop{animation:wh-pop 0.25s cubic-bezier(.34,1.56,.64,1) forwards;}`}</style>

      <div className="wh-pop" style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:24, fontWeight:700, color:T.navy, fontFamily:'Georgia,serif', margin:0 }}>Waiting Room</h2>
          <p style={{ fontSize:12, color:T.textSecondary, marginTop:4 }}>Share the code with friends</p>
        </div>

        {/* Session code */}
        <div style={{ background:T.navy, borderRadius:16, padding:'16px 20px', textAlign:'center', marginBottom:14, boxShadow:'0 4px 16px rgba(26,26,46,0.2)' }}>
          <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:6 }}>Session code</p>
          <p style={{ fontSize:38, fontWeight:800, color:T.gold, fontFamily:'monospace', letterSpacing:'0.2em', margin:0 }}>{session.id}</p>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {[
            [`${players.length}/${maxPlayers}`, 'Players'],
            [session.rounds, 'Rounds'],
            [session.difficulty==='easy'?'😊':session.difficulty==='hard'?'🔥':'🧠', session.difficulty||'Medium'],
            [session.gameMode==='fun'?'🎉':'📚', session.gameMode==='fun'?'Fun':'Edu'],
          ].map(([val,lbl]) => (
            <div key={lbl} style={{ flex:1, background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:12, padding:'10px 6px', textAlign:'center', boxShadow:'0 1px 4px rgba(26,26,46,0.06)' }}>
              <p style={{ fontSize:18, fontWeight:700, color:T.navy, margin:0 }}>{val}</p>
              <p style={{ fontSize:9, color:T.textSecondary, margin:0, marginTop:2 }}>{lbl}</p>
            </div>
          ))}
        </div>

        {/* Player list */}
        <div style={{ background:T.cardBg, borderRadius:16, border:`1px solid ${T.border}`, overflow:'hidden', marginBottom:14, boxShadow:'0 2px 8px rgba(26,26,46,0.06)' }}>
          {players.map((p, i) => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderBottom: i<players.length-1 ? `1px solid ${T.border}` : 'none', background: p.id===playerId ? T.tealBg : T.cardBg }}>
              <div style={{ position:'relative' }}>
                <AvatarDisplay avatar={p.avatar} size={36} fallbackLetter={p.name.charAt(0).toUpperCase()} style={{ border:`2px solid ${AVATAR_COLORS[i%8]}` }}/>
                {p.id===playerId && (
                  <button onClick={()=>setShowAvatar(s=>!s)} style={{ position:'absolute', bottom:-2, right:-2, width:16, height:16, borderRadius:'50%', background:T.gold, border:'none', cursor:'pointer', fontSize:8, color:T.navy, fontWeight:700 }}>✏</button>
                )}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:600, color:T.textPrimary, margin:0 }}>{p.name}{p.id===playerId?' (you)':''}</p>
                <p style={{ fontSize:10, color:T.textSecondary, margin:0 }}>{p.id===session.hostId?'Host':p.isBot?'Bot 🤖':'Player'}</p>
              </div>
              <div style={{ width:8, height:8, borderRadius:'50%', background: p.connected===false?'#D1D5DB':'#22C55E' }}/>
            </div>
          ))}
          {botsNeeded > 0 && [...Array(botsNeeded)].map((_,i) => (
            <div key={`bot-${i}`} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderBottom: i<botsNeeded-1?`1px solid ${T.border}`:'none', opacity:0.5 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:T.tabBg, border:`2px dashed ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:16 }}>🤖</span>
              </div>
              <p style={{ fontSize:12, color:T.textSecondary, margin:0 }}>Bot will fill in</p>
            </div>
          ))}
        </div>

        {/* Avatar picker */}
        {showAvatar && (
          <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:16, padding:14, marginBottom:14 }}>
            <AvatarPicker onSelect={av=>{ handleAvatarChange(av); setShowAvatar(false); }}/>
          </div>
        )}

        {/* Buttons */}
        {isHost ? (
          <button onClick={handleStart} disabled={!canStart} style={{
            width:'100%', padding:'14px', borderRadius:14, border:'none',
            cursor:canStart?'pointer':'not-allowed',
            background: canStart ? `linear-gradient(135deg,${T.teal},#115E59)` : T.tabBg,
            color: canStart ? T.white : T.textSecondary,
            fontSize:15, fontWeight:800, fontFamily:'Georgia,serif',
            boxShadow: canStart ? '0 4px 16px rgba(26,140,140,0.3)' : 'none',
            transition:'all 0.2s ease',
          }}>
            {canStart ? 'Start game →' : 'Waiting for players…'}
          </button>
        ) : (
          <div style={{ textAlign:'center', padding:'14px', background:T.cardBg, borderRadius:12, border:`1px solid ${T.border}` }}>
            <p style={{ fontSize:13, color:T.textSecondary, margin:0 }}>Waiting for host to start…</p>
          </div>
        )}
      </div>
    </div>
  );
}
