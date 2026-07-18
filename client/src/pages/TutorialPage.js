import React, { useState } from 'react';

const T = {
  pageBg:'#F7F2EA', cardBg:'#FFFFFF', border:'#E8E0D0',
  textPrimary:'#1A1A2E', textSecondary:'#9B8E7A', textMuted:'#C4B9A8',
  gold:'#C8930C', goldBg:'#FEF3E2', teal:'#1A8C8C', tealBg:'#E8F4F4',
  red:'#E94560', navy:'#1A1A2E', white:'#FFFFFF', tabBg:'#F0EDE8',
};

const STEPS = [
  {
    id: 'intro',
    emoji: '🧠',
    title: 'Welcome to Synapse',
    body: 'A real-time multiplayer card game where you race to collect matching cards and buzz in first. Walk through how it works in under a minute.',
  },
  {
    id: 'submit',
    emoji: '✏️',
    title: 'Step 1 — Submit a Word',
    body: 'Every round each player submits one word. In Syntax mode you get 3 synonym cards. In Spark mode you get 3 topic association cards.',
  },
  {
    id: 'deal',
    emoji: '🃏',
    title: 'Step 2 — Cards Are Dealt',
    body: 'Each player gets 3 cards. One random player — the starter — gets a 4th card to begin the round.',
  },
  {
    id: 'pass',
    emoji: '🔄',
    title: 'Step 3 — Pass a Card',
    body: 'On your turn you hold 4 cards. Pick one to pass to the next player — try it below!',
    interactive: 'pass',
  },
  {
    id: 'buzz',
    emoji: '⚡',
    title: 'Step 4 — Buzz In',
    body: 'Once cards travel all the way around, the buzzer activates. Buzz on your turn if your 3 cards match — but watch the clock!',
    interactive: 'buzz',
  },
  {
    id: 'score',
    emoji: '🏆',
    title: 'Step 5 — Scoring',
    body: 'After everyone buzzes, the game checks who has 3 matching cards. Buzz order + correct match decides the points: 10, 7, 5, 3, 1.',
  },
  {
    id: 'ready',
    emoji: '🚀',
    title: "You're Ready!",
    body: "That's the whole game. Submit, pass, buzz, repeat. Good luck — go create or join a game!",
  },
];

export default function TutorialPage({ onDone }) {
  const [stepIndex, setStepIndex]     = useState(0);
  const [demoHand, setDemoHand]       = useState(['Joyful', 'Elated', 'Content', 'Swift']);
  const [demoSelected, setDemoSelected] = useState(null);
  const [demoPassed, setDemoPassed]   = useState(false);
  const [demoBuzzed, setDemoBuzzed]   = useState(false);
  const [demoTime, setDemoTime]       = useState(3);
  const timerRef = React.useRef(null);

  const step    = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast  = stepIndex === STEPS.length - 1;

  function next() { if (isLast) { onDone(); return; } setStepIndex(i => i + 1); }
  function back() { if (!isFirst) setStepIndex(i => i - 1); }
  function skip() { onDone(); }

  function handleDemoCardClick(word) {
    if (demoPassed) return;
    setDemoSelected(prev => prev === word ? null : word);
  }

  function handleDemoPass() {
    if (!demoSelected) return;
    setDemoHand(h => h.filter(c => c !== demoSelected));
    setDemoSelected(null);
    setDemoPassed(true);
  }

  function startBuzzTimer() {
    setDemoTime(3);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDemoTime(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  function handleDemoBuzz() {
    setDemoBuzzed(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  React.useEffect(() => {
    if (step.interactive === 'buzz' && !demoBuzzed) startBuzzTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stepIndex]); // eslint-disable-line

  return (
    <div style={{ minHeight:'100vh', background:T.pageBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20 }}>
      <style>{`@keyframes wh-pop{0%{transform:scale(0.95);opacity:0;}100%{transform:scale(1);opacity:1;}}.wh-pop{animation:wh-pop 0.25s cubic-bezier(.34,1.56,.64,1) forwards;}`}</style>

      <div style={{ width:'100%', maxWidth:440 }}>

        {/* Progress dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:20 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{
              width: i===stepIndex ? 24 : 8, height:8, borderRadius:4,
              background: i===stepIndex ? T.gold : i<stepIndex ? 'rgba(200,147,12,0.4)' : T.border,
              transition:'all 0.25s ease',
            }}/>
          ))}
        </div>

        {/* Card */}
        <div className="wh-pop" style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:20, padding:24, boxShadow:'0 8px 32px rgba(26,26,46,0.1)' }}>

          {/* Emoji + title */}
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:44, marginBottom:8 }}>{step.emoji}</div>
            <h2 style={{ fontSize:20, fontWeight:700, color:T.navy, fontFamily:'Georgia,serif', margin:0 }}>{step.title}</h2>
            <p style={{ fontSize:13, color:T.textSecondary, marginTop:8, lineHeight:1.6 }}>{step.body}</p>
          </div>

          {/* Interactive: Pass demo */}
          {step.interactive === 'pass' && (
            <div style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap', marginBottom:14 }}>
                {demoHand.map(word => (
                  <div key={word} onClick={() => !demoPassed && handleDemoCardClick(word)}
                    style={{ cursor:demoPassed?'default':'pointer', transform:demoSelected===word?'translateY(-8px) scale(1.05)':'none', transition:'transform 0.15s ease', filter:demoSelected===word?'drop-shadow(0 6px 14px rgba(200,147,12,0.5))':'drop-shadow(0 2px 6px rgba(26,26,46,0.15))' }}>
                    <svg width="68" height="96" viewBox="0 0 76 108" fill="none">
                      <rect x="1" y="1" width="74" height="104" rx="12"
                        fill={demoSelected===word?'#FFF8E8':'#fff'}
                        stroke={demoSelected===word?T.gold:demoPassed?T.border:T.navy}
                        strokeWidth={demoSelected===word?2.5:1.5}/>
                      <rect x="5" y="5" width="66" height="96" rx="9" fill="none" stroke={T.navy} strokeWidth="0.5" opacity="0.12"/>
                      <text x="38" y="54" textAnchor="middle" fontFamily="Georgia,serif" fontSize="12" fontWeight="700"
                        fill={demoSelected===word?T.gold:demoPassed?T.textMuted:T.navy}>{word}</text>
                      <text x="38" y="68" textAnchor="middle" fontFamily="sans-serif" fontSize="8"
                        fill={demoSelected===word?T.gold:T.textMuted}>
                        {demoSelected===word?'selected':!demoPassed?'tap to select':''}
                      </text>
                    </svg>
                  </div>
                ))}
              </div>
              {!demoPassed ? (
                <button onClick={handleDemoPass} disabled={!demoSelected} style={{
                  width:'100%', padding:'12px', borderRadius:12, border:'none',
                  background: demoSelected ? `linear-gradient(135deg,${T.gold},#A07010)` : T.tabBg,
                  color: demoSelected ? T.navy : T.textMuted,
                  fontSize:13, fontWeight:700, fontFamily:'Georgia,serif', cursor:demoSelected?'pointer':'not-allowed',
                  boxShadow: demoSelected ? '0 4px 14px rgba(200,147,12,0.3)' : 'none',
                }}>
                  {demoSelected ? `Pass "${demoSelected}" →` : 'Select a card first'}
                </button>
              ) : (
                <div style={{ textAlign:'center', padding:'12px', background:T.tealBg, borderRadius:10, border:`1px solid rgba(26,140,140,0.2)` }}>
                  <span style={{ color:T.teal, fontWeight:600, fontSize:13 }}>✓ That card went to the next player — you now hold 3!</span>
                </div>
              )}
            </div>
          )}

          {/* Interactive: Buzz demo */}
          {step.interactive === 'buzz' && (
            <div style={{ textAlign:'center', marginBottom:8 }}>
              <div style={{ marginBottom:14 }}>
                <button onClick={handleDemoBuzz} disabled={demoBuzzed || demoTime===0} style={{
                  width:90, height:90, borderRadius:'50%', border:'none',
                  background: demoBuzzed ? T.tabBg : demoTime>0 ? T.red : T.border,
                  color:'#fff', fontSize:16, fontWeight:800, fontFamily:'Georgia,serif',
                  cursor: demoBuzzed||demoTime===0 ? 'not-allowed' : 'pointer',
                  boxShadow: !demoBuzzed&&demoTime>0 ? '0 4px 20px rgba(233,69,96,0.5)' : 'none',
                  transition:'all 0.2s',
                }}>BUZZ!</button>
              </div>
              {!demoBuzzed ? (
                <p style={{ fontSize:13, color:demoTime<=1?T.red:T.textSecondary, fontWeight:600 }}>
                  {demoTime > 0 ? `⏱ ${demoTime}s window — buzz now!` : 'Window closed — try next turn!'}
                </p>
              ) : (
                <div style={{ padding:'10px', background:T.tealBg, borderRadius:10, border:`1px solid rgba(26,140,140,0.2)` }}>
                  <span style={{ color:T.teal, fontWeight:600, fontSize:13 }}>✓ Buzzed! The game instantly checks your cards for a match.</span>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display:'flex', gap:10, marginTop:20 }}>
            {!isFirst && (
              <button onClick={back} style={{ flex:1, padding:'12px', borderRadius:12, border:`1px solid ${T.border}`, background:'transparent', color:T.textSecondary, fontSize:13, fontWeight:600, cursor:'pointer' }}>← Back</button>
            )}
            <button onClick={next} style={{
              flex:2, padding:'12px', borderRadius:12, border:'none',
              background:`linear-gradient(135deg,${T.gold},#A07010)`,
              color:T.navy, fontSize:13, fontWeight:800, fontFamily:'Georgia,serif',
              cursor:'pointer', boxShadow:'0 4px 14px rgba(200,147,12,0.3)',
            }}>
              {isLast ? "Let's Play! →" : 'Next →'}
            </button>
          </div>
        </div>

        {/* Skip */}
        {!isLast && (
          <div style={{ textAlign:'center', marginTop:14 }}>
            <button onClick={skip} style={{ background:'none', border:'none', color:T.textMuted, fontSize:12, cursor:'pointer', textDecoration:'underline' }}>
              Skip tutorial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
