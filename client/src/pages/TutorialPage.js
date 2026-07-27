import React, { useState, useRef, useEffect } from 'react';
import { WordCard, BuzzButton, ThemeSwitcher } from '../SynapseComponents';

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
    body: 'On your turn, drag a card onto the table to pass it to the next player. The starter goes first, with an extra 4th card to kick things off — try it below!',
    interactive: 'pass',
  },
  {
    id: 'buzz',
    emoji: '⚡',
    title: 'Step 4 — Buzz In',
    body: "Once cards travel all the way around, the buzzer unlocks. On your own turn you can buzz any time. Right after you pass a card, you also get a short window to buzz immediately — try that scenario below.",
    interactive: 'buzz',
  },
  {
    id: 'score',
    emoji: '🏆',
    title: 'Step 5 — Scoring',
    body: 'After everyone buzzes, the game checks who actually has 3 matching cards. Buzz order + a correct match decides the points: 10, 7, 5, 3, 1.',
  },
  {
    id: 'ready',
    emoji: '🚀',
    title: "You're Ready!",
    body: "That's the whole game. Submit, pass, buzz, repeat. Good luck — go create or join a game!",
  },
];

const BUZZ_WINDOW = 3;

export default function TutorialPage({ onDone }) {
  const [stepIndex, setStepIndex]       = useState(0);
  const [demoHand, setDemoHand]         = useState(['Joyful', 'Elated', 'Content', 'Swift']);
  const [demoSelected, setDemoSelected] = useState(null);
  const [demoPassed, setDemoPassed]     = useState(false);
  const [demoBuzzed, setDemoBuzzed]     = useState(false);
  const [demoTime, setDemoTime]         = useState(BUZZ_WINDOW);
  const timerRef = useRef(null);

  const step    = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast  = stepIndex === STEPS.length - 1;

  function next() { if (isLast) { onDone(); return; } setStepIndex(i => i + 1); }
  function back() { if (!isFirst) setStepIndex(i => i - 1); }
  function skip() { onDone(); }

  function handleDemoCardClick(word) {
    if (demoPassed) return;
    setDemoSelected(prev => (prev === word ? null : word));
  }

  function handleDemoPass() {
    if (!demoSelected) return;
    setDemoHand(h => h.filter(c => c !== demoSelected));
    setDemoSelected(null);
    setDemoPassed(true);
  }

  function startBuzzTimer() {
    setDemoTime(BUZZ_WINDOW);
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

  useEffect(() => {
    if (step.interactive === 'buzz' && !demoBuzzed) startBuzzTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  return (
    <div className="scene" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <ThemeSwitcher />

      <div className="scene-content" style={{ width: '100%', maxWidth: 440 }}>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{
              width: i === stepIndex ? 24 : 8, height: 8, borderRadius: 4,
              background: i === stepIndex ? 'var(--accent)' : i < stepIndex ? 'oklch(0.82 0.16 195 / 0.4)' : 'var(--border)',
              transition: 'all 0.25s ease',
            }} />
          ))}
        </div>

        {/* Card */}
        <div className="panel" style={{ padding: 24, animation: 'syn-pop 250ms cubic-bezier(.34,1.56,.64,1) both' }}>

          {/* Emoji + title */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>{step.emoji}</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', margin: 0 }}>{step.title}</h2>
            <p style={{ fontSize: 13, color: 'var(--ink-dim)', marginTop: 8, lineHeight: 1.6 }}>{step.body}</p>
          </div>

          {/* Interactive: Pass demo */}
          {step.interactive === 'pass' && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {demoHand.map(word => (
                  <WordCard
                    key={word}
                    word={word}
                    selected={demoSelected === word}
                    hint={demoSelected === word ? 'selected' : !demoPassed ? 'tap to select' : ''}
                    onClick={() => handleDemoCardClick(word)}
                    small
                  />
                ))}
              </div>
              {!demoPassed ? (
                <button
                  onClick={handleDemoPass}
                  disabled={!demoSelected}
                  className={demoSelected ? 'btn-primary tap-target' : 'btn-ghost tap-target'}
                  style={{ width: '100%', opacity: demoSelected ? 1 : 0.5 }}
                >
                  {demoSelected ? `Pass "${demoSelected}" →` : 'Select a card first'}
                </button>
              ) : (
                <div style={{ textAlign: 'center', padding: 12, borderRadius: 12 }} className="chip chip-accent">
                  <span style={{ fontWeight: 600, fontSize: 13 }}>✓ That card went to the next player — you now hold 3! (In a real game, you'd drag it onto the table instead of tapping a button.)</span>
                </div>
              )}
            </div>
          )}

          {/* Interactive: Buzz demo */}
          {step.interactive === 'buzz' && (
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 12, lineHeight: 1.5 }}>
                Scenario: you just passed a card. You get a short {BUZZ_WINDOW}-second window to buzz right away —
                mandatory if you were holding 4 cards. On a normal turn (not right after passing) you'd have your
                full turn to decide, not just {BUZZ_WINDOW} seconds.
              </p>
              <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center' }}>
                <BuzzButton onClick={handleDemoBuzz} disabled={demoBuzzed || demoTime === 0} ready={!demoBuzzed && demoTime > 0} />
              </div>
              {!demoBuzzed ? (
                <p className="num" style={{ fontSize: 13, color: demoTime <= 1 ? 'var(--danger)' : 'var(--ink-dim)', fontWeight: 600 }}>
                  {demoTime > 0 ? `⏱ ${demoTime}s window — buzz now!` : 'Window closed — you\'d catch it on your next turn instead.'}
                </p>
              ) : (
                <div className="chip chip-accent" style={{ padding: 10, borderRadius: 10, display: 'inline-flex' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>✓ Buzzed! The game instantly checks your cards for a match.</span>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {!isFirst && (
              <button onClick={back} className="btn-ghost tap-target" style={{ flex: 1 }}>← Back</button>
            )}
            <button onClick={next} className="btn-primary tap-target" style={{ flex: 2 }}>
              {isLast ? "Let's Play! →" : 'Next →'}
            </button>
          </div>
        </div>

        {/* Skip */}
        {!isLast && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button onClick={skip} style={{ background: 'none', border: 'none', color: 'var(--ink-mute)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
              Skip tutorial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
