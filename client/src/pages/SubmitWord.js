import React, { useState, useEffect } from 'react';
import socket from '../utils/socket';
import { ThemeSwitcher, Dialog, SuccessState } from '../SynapseComponents';

const SUGGESTIONS = ['Radiant','Fierce','Serene','Bold','Mellow','Vivid','Happy','Swift','Calm','Bright'];

export default function SubmitWord({ session, playerId }) {
  const [word, setWord] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const players = session.players || [];
  const submittedCount = Object.keys(session.wordSubmissions || {}).length;
  const isFun = session.gameMode === 'fun';
  const isLoading = session.phase === 'loading';

  const len = word.trim().length;
  const valid = len >= 2 && len <= 14;

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

  function handleSubmit() {
    if (!word.trim() || submitted || checking) return;
    if (!valid) { setError('Use 2–14 letters.'); return; }
    setError('');
    socket.emit('submit_word', { sessionId: session.id, playerId, word: word.trim().toLowerCase() });
  }

  if (isLoading) return (
    <div className="scene" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 99, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}/>
        <h2 style={{ fontSize: 22, fontFamily: 'var(--font-display)', marginBottom: 8, color: 'var(--ink)' }}>Generating cards…</h2>
        <p style={{ color: 'var(--ink-dim)', fontSize: 14 }}>Dealing your hand shortly</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  return (
    <div className="scene" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <ThemeSwitcher />
      <div className="scene-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '56px 20px 24px', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div style={{ width: 40, height: 40, borderRadius: 99, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', color: 'var(--ink)', fontSize: 18 }}>←</div>
          <div style={{ textAlign: 'center' }}>
            <div className="number-tab" style={{ fontSize: 10, letterSpacing: '0.32em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>ROUND {session.currentRound} · YOUR TURN</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Submit a seed word</div>
          </div>
          <div style={{ width: 40 }}/>
        </div>

        {/* Icon + hero */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 99, background: 'linear-gradient(140deg, var(--accent), var(--accent-2))', boxShadow: 'var(--glow-accent)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', fontSize: 28 }}>✦</div>
          <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1.2, color: 'var(--ink)', marginBottom: 8 }}>
            Pick a word.<br/>We'll find its family.
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-dim)', maxWidth: 280, margin: '0 auto' }}>
            {isFun ? 'Everyone will hunt for associations of your word.' : 'Everyone will hunt for synonyms of your word. Choose something rich.'}
          </p>
        </div>

        {/* Input */}
        {!submitted ? (
          <>
            <div className="panel" style={{ padding: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, boxShadow: valid ? '0 0 0 1px var(--accent), var(--glow-accent)' : undefined, transition: 'box-shadow 220ms' }}>
              <input autoFocus value={word} onChange={e => { setWord(e.target.value); setError(''); }}
                placeholder="Type your word" maxLength={16}
                style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none', fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}/>
              <span className="chip number-tab" style={{ minWidth: 46, justifyContent: 'center' }}>{len}/14</span>
            </div>
            {error ? (
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)', animation: 'syn-rise 220ms ease-out both', marginBottom: 16, paddingLeft: 4 }}>{error}</div>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 16, paddingLeft: 4 }}>Tip: nouns and adjectives play best.</div>
            )}
            {checking && <p style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>Checking word…</p>}

            {/* Suggestions */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 600, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 10 }}>SUGGESTIONS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SUGGESTIONS.slice(0, 6).map(s => (
                  <button key={s} onClick={() => setWord(s)} className="chip tap-target" style={{ cursor: 'pointer', background: word === s ? 'linear-gradient(140deg, var(--accent), var(--accent-2))' : undefined, color: word === s ? 'var(--accent-ink)' : undefined, border: word === s ? 'none' : undefined }}>
                    💡 {s}
                  </button>
                ))}
                <button onClick={() => setWord(SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)])} className="chip tap-target" style={{ cursor: 'pointer' }}>🔀 Surprise me</button>
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button onClick={handleSubmit} disabled={!valid || checking} className="btn-primary tap-target" style={{ width: '100%', opacity: valid && !checking ? 1 : 0.5 }}>
                ✦ {checking ? 'Locking in…' : 'SUBMIT WORD'}
              </button>
              <p style={{ marginTop: 12, textAlign: 'center', fontSize: 11, color: 'var(--ink-mute)' }}>
                {players.length - submittedCount} player{players.length - submittedCount !== 1 ? 's' : ''} still waiting
              </p>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>✓</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--win)', fontFamily: 'var(--font-display)', marginBottom: 8 }}>"{session.wordSubmissions?.[playerId]}" is in</h2>
            <p style={{ fontSize: 14, color: 'var(--ink-dim)' }}>Cards are being dealt. Get ready to buzz.</p>
            <div style={{ marginTop: 20, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {players.map(p => (
                <div key={p.id} className={`chip${session.wordSubmissions?.[p.id] ? ' chip-accent' : ''}`}>
                  <div style={{ width: 6, height: 6, borderRadius: 99, background: session.wordSubmissions?.[p.id] ? 'var(--win)' : 'var(--border)', flexShrink: 0 }}/>
                  {p.name.split(' ')[0]}{p.id === playerId ? ' (you)' : ''}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
