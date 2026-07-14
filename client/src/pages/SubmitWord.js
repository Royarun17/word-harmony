import React, { useState, useEffect } from 'react';
import socket from '../utils/socket';

const T = {
  navy:'#1A1A2E', dark:'#0D1B2A', gold:'#C8930C', goldL:'#FFD166',
  teal:'#1A8C8C', tealL:'#99F6E4', red:'#E94560', white:'#FFFFFF',
  muted:'rgba(255,255,255,0.45)', border:'rgba(255,255,255,0.1)',
};

export default function SubmitWord({ session, playerId }) {
  const [word, setWord]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError]       = useState('');

  const players = session.players || [];
  const myPlayer = players.find(p => p.id === playerId);
  const submittedCount = Object.keys(session.wordSubmissions || {}).length;
  const totalCount = players.length;
  const isFun = session.gameMode === 'fun';

  useEffect(() => {
    if (session.wordSubmissions?.[playerId]) setSubmitted(true);
  }, [session.wordSubmissions, playerId]);

  useEffect(() => {
    const fn = ({ message }) => { setError(message); setChecking(false); };
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

  const isLoading = session.phase === 'loading';

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg,${T.navy} 0%,${T.dark} 100%)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20 }}>
      <style>{`@keyframes wh-pop{0%{transform:scale(0.95);opacity:0;}100%{transform:scale(1);opacity:1;}}.wh-pop{animation:wh-pop 0.25s cubic-bezier(.34,1.56,.64,1) forwards;}@keyframes wh-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}.wh-spin{animation:wh-spin 1s linear infinite;}`}</style>

      <div className="wh-pop" style={{ width:'100%', maxWidth:420 }}>

        {isLoading ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ width:60, height:60, borderRadius:'50%', border:`4px solid rgba(200,147,12,0.2)`, borderTopColor:T.gold, margin:'0 auto 20px' }} className="wh-spin"/>
            <h2 style={{ fontSize:20, fontWeight:700, color:T.white, fontFamily:'Georgia,serif', margin:0 }}>Generating cards…</h2>
            <p style={{ color:T.muted, fontSize:13, marginTop:8 }}>Dealing your hand shortly</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <p style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'0.12em', textTransform:'uppercase', margin:0 }}>Round {session.currentRound} of {session.rounds}</p>
              <h2 style={{ fontSize:24, fontWeight:700, color:T.white, fontFamily:'Georgia,serif', margin:'6px 0 4px' }}>Submit your word</h2>
              <p style={{ fontSize:12, color:T.muted, margin:0 }}>
                {isFun ? 'Any topic word — the game generates related cards' : 'Any English word — synonyms become your cards'}
              </p>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11, color:T.muted }}>{submittedCount}/{totalCount} submitted</span>
                <span style={{ fontSize:11, color:T.tealL }}>{submitted ? '✓ Your word is in!' : 'Waiting for you…'}</span>
              </div>
              <div style={{ height:6, background:'rgba(255,255,255,0.1)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:3, background:`linear-gradient(90deg,${T.teal},${T.gold})`, width:`${(submittedCount/Math.max(1,totalCount))*100}%`, transition:'width 0.4s ease' }}/>
              </div>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <div style={{ position:'relative', marginBottom:12 }}>
                  <input value={word} onChange={e=>setWord(e.target.value)} placeholder={isFun ? 'e.g. football, music, doctor…' : 'e.g. happy, fast, strong…'}
                    disabled={checking}
                    style={{ width:'100%', padding:'16px 18px', borderRadius:14, border:`1.5px solid ${error ? 'rgba(233,69,96,0.6)' : 'rgba(255,255,255,0.1)'}`, background:'rgba(0,0,0,0.3)', color:T.white, fontSize:18, fontFamily:'Georgia,serif', fontWeight:500, letterSpacing:0.3, boxSizing:'border-box', transition:'border 0.2s ease' }}
                    onFocus={e=>e.target.style.borderColor='rgba(200,147,12,0.6)'}
                    onBlur={e=>e.target.style.borderColor= error ? 'rgba(233,69,96,0.6)' : 'rgba(255,255,255,0.1)'}/>
                </div>

                {error && <p style={{ color:'#FCA5A5', fontSize:12, marginBottom:10, padding:'8px 12px', background:'rgba(233,69,96,0.1)', border:'1px solid rgba(233,69,96,0.2)', borderRadius:8, textAlign:'center' }}>{error}</p>}
                {checking && <p style={{ color:T.tealL, fontSize:12, marginBottom:10, textAlign:'center' }}>Checking word…</p>}

                <button type="submit" disabled={!word.trim() || checking} style={{
                  width:'100%', padding:'14px', borderRadius:14, border:'none',
                  cursor: word.trim() && !checking ? 'pointer' : 'not-allowed',
                  background: word.trim() && !checking ? `linear-gradient(135deg,${T.gold},#A07010)` : 'rgba(255,255,255,0.08)',
                  color: word.trim() && !checking ? T.navy : T.muted,
                  fontSize:15, fontWeight:800, fontFamily:'Georgia,serif', letterSpacing:0.5,
                  boxShadow: word.trim() && !checking ? '0 4px 20px rgba(200,147,12,0.4)' : 'none',
                  transition:'all 0.2s ease',
                }}>
                  {checking ? 'Checking…' : 'Submit word'}
                </button>
              </form>
            ) : (
              <div style={{ textAlign:'center', padding:'20px', background:'rgba(26,140,140,0.1)', borderRadius:16, border:`1px solid rgba(26,140,140,0.3)` }}>
                <div style={{ fontSize:40, marginBottom:10 }}>✓</div>
                <p style={{ fontSize:16, fontWeight:700, color:T.tealL, fontFamily:'Georgia,serif', margin:0 }}>"{session.wordSubmissions[playerId]}"</p>
                <p style={{ fontSize:12, color:T.muted, marginTop:6 }}>Waiting for {totalCount - submittedCount} more player{totalCount - submittedCount !== 1 ? 's' : ''}…</p>
              </div>
            )}

            {/* Players status */}
            <div style={{ marginTop:16, display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
              {players.map(p => (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, background: session.wordSubmissions?.[p.id] ? 'rgba(26,140,140,0.2)' : 'rgba(255,255,255,0.06)', border:`1px solid ${session.wordSubmissions?.[p.id] ? 'rgba(26,140,140,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background: session.wordSubmissions?.[p.id] ? '#22C55E' : T.muted }}/>
                  <span style={{ fontSize:11, color: session.wordSubmissions?.[p.id] ? T.tealL : T.muted }}>{p.name}{p.id===playerId?' (you)':''}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
