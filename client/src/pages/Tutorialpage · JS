import React, { useState } from 'react';
import GameCard from '../components/GameCard';

const STEPS = [
  {
    id: 'intro',
    title: 'Welcome to Word Harmony',
    body: 'A multiplayer card game where you race to collect matching cards and buzz in first. Let\'s walk through how it works in under a minute.',
  },
  {
    id: 'submit',
    title: 'Step 1 — Submit a Word',
    body: 'Every round, each player submits one word. The game generates 3 related words for it — synonyms in Education Mode, or topic associations in Fun Mode.',
  },
  {
    id: 'deal',
    title: 'Step 2 — Cards Are Dealt',
    body: 'Each player gets 3 cards. One random player — the "starter" — gets a 4th card to begin the round.',
  },
  {
    id: 'pass',
    title: 'Step 3 — Pass a Card',
    body: 'On your turn, you always hold 4 cards for a moment. Pick one to pass to the next player — try this below!',
    interactive: 'pass',
  },
  {
    id: 'buzz',
    title: 'Step 4 — The Buzzer',
    body: 'Once cards have travelled all the way around back to the starter, the buzzer activates. Buzz on your turn if you think your 3 cards match — but watch the clock!',
    interactive: 'buzz',
  },
  {
    id: 'score',
    title: 'Step 5 — Scoring',
    body: 'After everyone buzzes, the game checks who really has 3 matching cards. Buzzer order + a correct match decides the points: 10, 7, 5, 3, 1.',
  },
  {
    id: 'ready',
    title: 'You\'re Ready!',
    body: 'That\'s the whole game. Collect, pass, buzz, repeat. Good luck — go create or join a game!',
  },
];

export default function TutorialPage({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [demoHand, setDemoHand] = useState(['joyful', 'elated', 'content', 'swift']);
  const [demoSelected, setDemoSelected] = useState(null);
  const [demoPassed, setDemoPassed] = useState(false);
  const [demoBuzzed, setDemoBuzzed] = useState(false);
  const [demoTime, setDemoTime] = useState(3);
  const timerRef = React.useRef(null);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  function next() {
    if (isLast) { onDone(); return; }
    setStepIndex(i => i + 1);
  }
  function back() {
    if (isFirst) return;
    setStepIndex(i => i - 1);
  }
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

  function startDemoBuzzTimer() {
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
    if (step.interactive === 'buzz' && !demoBuzzed) {
      startDemoBuzzTimer();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  return (
    <div className="page-center" style={{ background: 'var(--ink)', minHeight: '100vh' }}>
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.04,
        backgroundImage: 'radial-gradient(circle, var(--parchment) 1px, transparent 1px)',
        backgroundSize: '32px 32px', pointerEvents: 'none'
      }} />

      <div className="container-sm" style={{ position: 'relative' }}>

        {/* Progress dots */}
        <div className="flex justify-center gap-8" style={{ marginBottom: 24 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{
              width: i === stepIndex ? 24 : 8, height: 8, borderRadius: 4,
              background: i === stepIndex ? 'var(--gold)' : i < stepIndex ? 'rgba(245,223,160,0.6)' : 'rgba(247,242,232,0.2)',
              transition: 'all 0.25s ease'
            }} />
          ))}
        </div>

        <div className="panel">
          <h2 style={{ fontSize: 26, marginBottom: 12, textAlign: 'center' }}>{step.title}</h2>
          <p style={{ fontSize: 15, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
            {step.body}
          </p>

          {/* Interactive: Pass a card demo */}
          {step.interactive === 'pass' && (
            <div style={{ marginBottom: 8 }}>
              <div className="flex justify-center gap-12" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
                {demoHand.map(word => (
                  <GameCard
                    key={word}
                    word={word}
                    selected={demoSelected === word}
                    onClick={() => handleDemoCardClick(word)}
                    disabled={demoPassed}
                    label={!demoPassed ? 'tap to select' : ''}
                  />
                ))}
              </div>
              {!demoPassed ? (
                <div className="text-center">
                  <button
                    className="btn btn-primary"
                    onClick={handleDemoPass}
                    disabled={!demoSelected}
                  >
                    {demoSelected ? `Pass "${demoSelected}" →` : 'Select a card first'}
                  </button>
                </div>
              ) : (
                <div className="text-center" style={{ color: 'var(--success)', fontWeight: 600, fontSize: 14 }}>
                  ✓ Nice! That card just went to the next player — you're left with 3.
                </div>
              )}
            </div>
          )}

          {/* Interactive: Buzzer demo */}
          {step.interactive === 'buzz' && (
            <div className="text-center" style={{ marginBottom: 8 }}>
              <div className="flex justify-center" style={{ marginBottom: 16 }}>
                <button
                  className={`buzzer-btn ${!demoBuzzed ? 'ready unlocked' : ''}`}
                  onClick={handleDemoBuzz}
                  disabled={demoBuzzed}
                >
                  BUZZ!
                </button>
              </div>
              {!demoBuzzed ? (
                <p style={{ fontSize: 14, color: demoTime <= 1 ? 'var(--danger)' : 'var(--muted)', fontWeight: 600 }}>
                  {demoTime > 0 ? `⏱ ${demoTime}s window — try buzzing now!` : 'Window closed — try again on your next turn!'}
                </p>
              ) : (
                <p style={{ fontSize: 14, color: 'var(--success)', fontWeight: 600 }}>
                  ✓ Buzzed! The game instantly checks your cards for a match.
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-12" style={{ marginTop: 28 }}>
            {!isFirst && (
              <button className="btn btn-outline" onClick={back} style={{ flex: 1 }}>← Back</button>
            )}
            <button className="btn btn-gold" onClick={next} style={{ flex: 2 }}>
              {isLast ? "Let's Play! →" : 'Next →'}
            </button>
          </div>
        </div>

        {!isLast && (
          <div className="text-center" style={{ marginTop: 16 }}>
            <button
              onClick={skip}
              style={{ background: 'none', border: 'none', color: 'rgba(247,242,232,0.5)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Skip tutorial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
