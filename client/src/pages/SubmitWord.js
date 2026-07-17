import React, { useState, useEffect } from 'react';
import socket from '../utils/socket';

const T = {
  pageBg:'#F7F2EA', cardBg:'#FFFFFF', border:'#E8E0D0',
  textPrimary:'#1A1A2E', textSecondary:'#9B8E7A', textMuted:'#C4B9A8',
  gold:'#C8930C', goldBg:'#FEF3E2', teal:'#1A8C8C', tealBg:'#E8F4F4',
  red:'#E94560', navy:'#1A1A2E', white:'#FFFFFF', tabBg:'#F0EDE8',
};

export default function SubmitWord({ session, playerId }) {
  const [word, setWord]           = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking]   = useState(false);
  const [error, setError]         = useState('');

  const players      = session.players || [];
  const submittedCount = Object.keys(session.wordSubmissions || {}).length;
  const totalCount   = players.length;
  const isFun        = session.gameMode === 'fun';
  const isLoading    = session.phase === 'loading';

  useEffect(() => {
    if (session.wordSubmissions?.[playerId]) setSubmitted(true);
  }, [session.wordSubmissions, playerId]);

  useEffect(() => {
    const fn  = ({ message }) => { setError(message); setChecking(false); };
    const fn2 = () => { setChecking(true); setError(''); };
    socket.on('word_error', fn);
    socket.on('checking_word', fn2);
    return () => { socket.off('word_error', fn); socket.off('checking_word', fn2); };
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!word.trim() || submitted || checking) return;
    setError('');
    socket.emit('submit_word', { sessionId: session.id, playerId, word: word.trim().toLowerCase() });
  }

  return (
    <div style={{ minHeight:'100vh', background:T.pageBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20 }}>
      <style>{`
        @keyframes wh-pop{0%{transform:scale(0.96);opacity:0;}100%{transform:scale(1);opacity:1;}}
        @keyframes wh-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        .wh-pop{animation:wh-pop 0.25s cubic-bezier(.34,1.56,.64,1) forwards;}
        .wh-spin{animation:wh-spin 1s linear infinite;}
        input:focus{outline:none!important;border-color:${T.gold}!important;}
      `}</style>

      <div className="wh-pop" style={{ width:'100%', maxWidth:420 }}>

        {isLoading ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', border:`4px solid ${T.border}`, borderTopColor:T.gold, margin:'0 auto 20px' }} className="wh-spin"/>
            <h2 style={{ fontSize:20, fontWeight:700, color:T.navy, fontFamily:'Georgia,serif', margin:0 }}>Generating cards…</h2>
            <p style={{ color:T.textSecondary, fontSize:13, marginTop:8 }}>Dealing your hand shortly</p>
          </div>
        ) : (
          <div style={{ background:T.cardBg, borderRadius:20, border:`1px solid ${T.border}`, padding:24, boxShadow:'0 8px 32px rgba(26,26,46,0.1)' }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.12em', textTransform:'uppercase', margin:0 }}>Round {session.currentRound} of {session.rounds}</p>
              <h2 style={{ fontSize:22, fontWeight:700, color:T.navy, fontFamily:'Georgia,serif', margin:'6px 0 4px' }}>Submit your word</h2>
              <p style={{ fontSize:12, color:T.textSecondary, margin:0 }}>
                {isFun ? 'Any topic word — related cards are generated' : 'Any English word — synonyms become your cards'}
              </p>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11, color:T.textSecondary }}>{submittedCount}/{totalCount} submitted</span>
                <span style={{ fontSize:11, color: submitted ? T.teal : T.textSecondary }}>{submitted ? '✓ Your word is in!' : 'Waiting for you…'}</span>
              </div>
              <div style={{ height:6, background:T.tabBg, borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:3, background:`linear-gradient(90deg,${T.teal},${T.gold})`, width:`${(submittedCount/Math.max(1,totalCount))*100}%`, transition:'width 0.4s ease' }}/>
              </div>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <input value={word} onChange={e=>setWord(e.target.value)}
                  placeholder={isFun ? 'e.g. football, music…' : 'e.g. happy, fast…'}
                  disabled={checking}
                  style={{ width:'100%', padding:'14px 16px', borderRadius:12, border:`1.5px solid ${error?T.red:T.border}`, background:T.inputBg, color:T.textPrimary, fontSize:18, fontFamily:'Georgia,serif', fontWeight:500, letterSpacing:0.3, boxSizing:'border-box', marginBottom:10, transition:'border 0.2s' }}/>

                {error && <p style={{ color:T.red, fontSize:12, marginBottom:10, padding:'8px 12px', background:'#FEE2E2', border:`1px solid rgba(233,69,96,0.2)`, borderRadius:8, textAlign:'center' }}>{error}</p>}
                {checking && <p style={{ color:T.teal, fontSize:12, marginBottom:10, textAlign:'center' }}>Checking word…</p>}

                <button type="submit" disabled={!word.trim()||checking} style={{
                  width:'100%', padding:'14px', borderRadius:12, border:'none',
                  cursor: word.trim()&&!checking?'pointer':'not-allowed',
                  background: word.trim()&&!checking ? `linear-gradient(135deg,${T.gold},#A07010)` : T.tabBg,
                  color: word.trim()&&!checking ? T.navy : T.textSecondary,
                  fontSize:15, fontWeight:800, fontFamily:'Georgia,serif',
                  boxShadow: word.trim()&&!checking ? '0 4px 16px rgba(200,147,12,0.3)' : 'none',
                  transition:'all 0.2s ease',
                }}>
                  {checking ? 'Checking…' : 'Submit word'}
                </button>
              </form>
            ) : (
              <div style={{ textAlign:'center', padding:'20px', background:T.tealBg, borderRadius:14, border:`1px solid rgba(26,140,140,0.2)` }}>
                <div style={{ fontSize:36, marginBottom:8 }}>✓</div>
                <p style={{ fontSize:16, fontWeight:700, color:T.teal, fontFamily:'Georgia,serif', margin:0 }}>"{session.wordSubmissions[playerId]}"</p>
                <p style={{ fontSize:12, color:T.textSecondary, marginTop:6 }}>Waiting for {totalCount-submittedCount} more player{totalCount-submittedCount!==1?'s':''}…</p>
              </div>
            )}

            {/* Player status pills */}
            <div style={{ marginTop:14, display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
              {players.map(p => (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, background: session.wordSubmissions?.[p.id] ? T.tealBg : T.tabBg, border:`1px solid ${session.wordSubmissions?.[p.id]?'rgba(26,140,140,0.3)':T.border}` }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background: session.wordSubmissions?.[p.id] ? '#22C55E' : T.textMuted }}/>
                  <span style={{ fontSize:11, color: session.wordSubmissions?.[p.id] ? T.teal : T.textSecondary }}>{p.name}{p.id===playerId?' (you)':''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
