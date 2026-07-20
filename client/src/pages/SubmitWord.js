import React, { useState, useEffect } from 'react';
import socket from '../utils/socket';
import { ThemeSwitcher } from '../SynapseComponents';

export default function SubmitWord({ session, playerId }) {
  const [word, setWord] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const players = session.players || [];
  const submittedCount = Object.keys(session.wordSubmissions || {}).length;
  const isFun = session.gameMode === 'fun';
  const isLoading = session.phase === 'loading';

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

  if (isLoading) return (
    <div className="syn-scene" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 99, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}/>
        <h2 style={{ fontSize: 22, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Generating cards…</h2>
        <p style={{ color: 'var(--ink-dim)', fontSize: 14 }}>Dealing your hand shortly</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  return (
    <div className="syn-scene" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <ThemeSwitcher />
      <div className="syn-scene-content" style={{ width: '100%', maxWidth: 420 }}>
        <div className="syn-panel" style={{ padding: 24, animation: 'syn-pop 300ms cubic-bezier(.2,.8,.2,1)' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="num" style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>
              ROUND {session.currentRound} OF {session.rounds}
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Submit your word</h2>
            <p style={{ fontSize: 13, color: 'var(--ink-dim)' }}>
              {isFun ? 'Any topic — related cards are generated' : 'Any English word — synonyms become your cards'}
            </p>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="num" style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{submittedCount}/{players.length} submitted</span>
              <span style={{ fontSize: 12, color: submitted ? 'var(--win)' : 'var(--ink-mute)' }}>{submitted ? '✓ Word is in!' : 'Waiting for you…'}</span>
            </div>
            <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', borderRadius: 3, width: `${(submittedCount / Math.max(1, players.length)) * 100}%`, transition: 'width 0.4s ease' }}/>
            </div>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <input value={word} onChange={e => setWord(e.target.value)}
                placeholder={isFun ? 'e.g. football, music…' : 'e.g. happy, fast…'}
                disabled={checking}
                style={{ width: '100%', padding: '16px', borderRadius: 14, border: `1.5px solid ${error ? 'var(--danger)' : 'oklch(from var(--accent) l c h / 0.35)'}`, background: 'var(--surface)', color: 'var(--ink)', fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 0.3, boxSizing: 'border-box', outline: 'none', marginBottom: 10, transition: 'border 0.2s' }}/>
              {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, textAlign: 'center', padding: '8px 12px', background: 'oklch(from var(--danger) l c h / 0.1)', borderRadius: 10 }}>{error}</p>}
              {checking && <p style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>Checking word…</p>}
              <button type="submit" disabled={!word.trim() || checking} className="syn-btn-primary tap" style={{ width: '100%', opacity: word.trim() && !checking ? 1 : 0.5 }}>
                {checking ? 'Checking…' : 'Submit word'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: 20, background: 'oklch(from var(--win) l c h / 0.1)', borderRadius: 16, border: '1px solid oklch(from var(--win) l c h / 0.25)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--win)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>"{session.wordSubmissions[playerId]}"</p>
              <p style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Waiting for {players.length - submittedCount} more…</p>
            </div>
          )}

          {/* Player status pills */}
          <div style={{ marginTop: 20, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {players.map(p => (
              <div key={p.id} className={`syn-chip${session.wordSubmissions?.[p.id] ? ' syn-chip-accent' : ''}`}>
                <div style={{ width: 6, height: 6, borderRadius: 99, background: session.wordSubmissions?.[p.id] ? 'var(--win)' : 'var(--border)', flexShrink: 0 }}/>
                {p.name.split(' ')[0]}{p.id === playerId ? ' (you)' : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
