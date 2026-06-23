import React, { useState } from 'react';
import socket from '../utils/socket';

export default function SubmitWord({ session, playerId }) {
  const [word, setWord] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const mySubmission = session.wordSubmissions?.[playerId];
  const submittedCount = Object.keys(session.wordSubmissions || {}).length;
  const totalPlayers = session.players.length;

  function handleSubmit(e) {
    e.preventDefault();
    const cleaned = word.trim().toLowerCase();
    if (!cleaned) { setError('Enter a word.'); return; }
    if (!/^[a-z]+$/.test(cleaned)) { setError('Use letters only, no spaces or punctuation.'); return; }
    if (cleaned.length < 3) { setError('Word must be at least 3 letters.'); return; }
    setError('');
    socket.emit('submit_word', { sessionId: session.id, playerId, word: cleaned });
    setSubmitted(true);
  }

  // Listen for word error (duplicate)
  React.useEffect(() => {
    const fn = ({ message }) => { setError(message); setSubmitted(false); };
    socket.on('word_error', fn);
    return () => socket.off('word_error', fn);
  }, []);

  return (
    <div className="page-center">
      <div className="container-sm">
        <div className="text-center" style={{ marginBottom: 32 }}>
          <span className="badge badge-teal" style={{ marginBottom: 12, display: 'inline-block' }}>
            Round {session.currentRound || 1} of {session.rounds}
          </span>
          <h1 style={{ fontSize: 38, marginBottom: 8 }}>Submit Your Word</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>
            The system will generate 3 synonyms from your word for the round.
          </p>
        </div>

        {/* Progress */}
        <div className="panel" style={{ marginBottom: 24 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>SUBMISSIONS</span>
            <span style={{ fontWeight: 700 }}>{submittedCount} / {totalPlayers}</span>
          </div>
          <div style={{ height: 8, background: 'var(--blush)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              background: 'var(--teal)',
              width: `${(submittedCount / totalPlayers) * 100}%`,
              transition: 'width 0.4s ease'
            }} />
          </div>
          <div className="flex-col gap-8" style={{ marginTop: 16 }}>
            {session.players.map(p => (
              <div key={p.id} className="flex items-center gap-8">
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: session.wordSubmissions?.[p.id] ? 'var(--success)' : 'var(--border)'
                }} />
                <span style={{ fontSize: 14, color: p.id === playerId ? 'var(--ink)' : 'var(--muted)', fontWeight: p.id === playerId ? 600 : 400 }}>
                  {p.name} {p.id === playerId ? '(you)' : ''}
                </span>
                {session.wordSubmissions?.[p.id] && (
                  <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>Ready ✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submission form */}
        {!mySubmission ? (
          <div className="panel">
            {error && (
              <div style={{ background: '#FEE', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, fontSize: 14, color: 'var(--danger)' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex-col gap-16">
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--muted)' }}>
                  ENTER A WORD (adjectives work best)
                </label>
                <input
                  className="input"
                  value={word}
                  onChange={e => setWord(e.target.value)}
                  placeholder="e.g. happy, vast, clever…"
                  autoFocus
                  disabled={submitted}
                  style={{ fontSize: 20, textAlign: 'center' }}
                />
              </div>
              <button className="btn btn-gold btn-lg w-full" type="submit" disabled={submitted}>
                {submitted ? 'Submitted…' : 'Submit Word →'}
              </button>
            </form>
          </div>
        ) : (
          <div className="panel text-center">
            <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
            <p style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Word submitted!</p>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              Waiting for all players to submit…
            </p>
          </div>
        )}

        {session.phase === 'loading' && (
          <div className="panel text-center" style={{ marginTop: 16 }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--muted)' }}>Generating synonyms and dealing cards…</p>
          </div>
        )}
      </div>
    </div>
  );
}
