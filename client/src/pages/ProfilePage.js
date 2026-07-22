import React, { useState } from 'react';
import { auth, signOut } from '../utils/firebase';
import { useEffect } from 'react';
import axios from 'axios';
import { ThemeSwitcher } from '../SynapseComponents';

const AVATARS = ['😎','🧠','🦊','🐯','🐸','🦁','🐧','🐉','🦋','🐺','🦅','🐬','🎭','🧩','⚡','🔥'];

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--ink-mute)', marginBottom: 10 }}>
      {children}
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div style={{ flex: 1, background: 'oklch(0.22 0.03 232 / 0.7)', border: '1px solid var(--border)', borderRadius: 16, padding: '12px 8px', textAlign: 'center' }}>
      <div className="number-tab" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 4, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

export default function ProfilePage({ profile, onSignOut, onBack }) {
  const [editing, setEditing]   = useState(false);
  const [avatar, setAvatar]     = useState(profile?.avatar || '😎');
  const [username, setUsername] = useState(profile?.username || '');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [saved, setSaved]       = useState(false);

  const winRate = profile?.gamesPlayed > 0
    ? Math.round((profile.wins / profile.gamesPlayed) * 100)
    : 0;

  async function handleSave() {
    setLoading(true); setError('');
    try {
      const uid = auth.currentUser?.uid || profile?.firebaseUid;
      if (!uid) { setError('Not logged in. Please sign in again.'); setLoading(false); return; }
      const { data } = await axios.patch('/auth/profile', { firebaseUid: uid, username, avatar });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditing(false);
      // Update local profile data
      if (data?.username) {
        try { localStorage.setItem('synapseProfile', JSON.stringify(data)); } catch {}
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save. Try again.');
    }
    setLoading(false);
  }

  async function handleSignOut() {
    try { await signOut(auth); onSignOut(); }
    catch { setError('Sign out failed.'); }
  }

  return (
    <div className="scene" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <ThemeSwitcher />
      <div className="scene-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '56px 24px 32px', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={onBack} className="tap-target" style={{ width: 44, height: 44, borderRadius: 99, background: 'oklch(0.22 0.03 232 / 0.7)', border: '1px solid var(--border)', color: 'var(--ink)', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(8px)', flexShrink: 0 }}>‹</button>
          <h1 style={{ flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)', margin: 0 }}>My Profile</h1>
          <div style={{ width: 44 }}/>
        </div>

        {/* Profile card */}
        <div className="panel" style={{ padding: 24, marginBottom: 12, animation: 'syn-pop 300ms cubic-bezier(.2,.8,.2,1) both' }}>

          {/* Avatar + identity */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 99, margin: '0 auto 12px',
              background: 'oklch(0.82 0.16 195 / 0.12)',
              border: '3px solid var(--accent)',
              display: 'grid', placeItems: 'center', fontSize: 42,
              boxShadow: '0 0 0 4px oklch(0.82 0.16 195 / 0.15), 0 0 24px oklch(0.82 0.16 195 / 0.3)',
              animation: 'syn-float 6s ease-in-out infinite',
            }}>{avatar}</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)', margin: 0, marginBottom: 4 }}>{profile?.username}</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-mute)', margin: 0, marginBottom: 8 }}>
              {profile?.countryFlag} {profile?.countryName || profile?.country} · Joined {profile?.joinedDate || 'July 2026'}
            </p>
            <span className="chip chip-accent" style={{ fontSize: 11 }}>⭐ Level {profile?.level || 1}</span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <StatCard value={profile?.gamesPlayed || 0} label="Games" />
            <StatCard value={profile?.wins || 0} label="Wins" />
            <StatCard value={(profile?.totalPoints || 0).toLocaleString()} label="Points" />
          </div>

          {/* Win rate */}
          <div style={{ background: 'oklch(0.22 0.03 232 / 0.7)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-dim)', fontWeight: 500 }}>Win rate</span>
              <span className="number-tab" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{winRate}%</span>
            </div>
            <div style={{ height: 8, background: 'var(--surface-3, oklch(0.32 0.04 228))', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${winRate}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', borderRadius: 99, boxShadow: '0 0 10px var(--accent)', transition: 'width 0.6s cubic-bezier(.2,.8,.2,1)' }}/>
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, padding: '10px 12px', background: 'oklch(0.68 0.22 22 / 0.12)', border: '1px solid oklch(0.68 0.22 22 / 0.4)', color: 'var(--danger)', fontSize: 12, fontWeight: 600, marginBottom: 12, animation: 'syn-pop 260ms both' }}>
              ⚠ {error}
            </div>
          )}
          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, padding: '10px 12px', background: 'oklch(0.85 0.18 145 / 0.12)', border: '1px solid oklch(0.85 0.18 145 / 0.4)', color: 'var(--win)', fontSize: 12, fontWeight: 600, marginBottom: 12, animation: 'syn-pop 260ms both' }}>
              ✓ Profile saved!
            </div>
          )}

          {/* Edit section */}
          {editing ? (
            <>
              <SectionLabel>Change avatar</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, marginBottom: 16 }}>
                {AVATARS.map(a => (
                  <button key={a} type="button" onClick={() => setAvatar(a)} className="tap-target" style={{
                    aspectRatio: '1', borderRadius: 99, display: 'grid', placeItems: 'center',
                    fontSize: 18, cursor: 'pointer',
                    background: avatar === a ? 'oklch(0.82 0.16 195 / 0.18)' : 'oklch(0.22 0.03 232 / 0.85)',
                    border: `1.5px solid ${avatar === a ? 'var(--accent)' : 'var(--border)'}`,
                    boxShadow: avatar === a ? '0 0 0 3px oklch(0.82 0.16 195 / 0.2)' : 'none',
                    transition: 'all 150ms',
                  }}>{a}</button>
                ))}
              </div>

              <SectionLabel>Username</SectionLabel>
              <div style={{
                display: 'flex', alignItems: 'center', borderRadius: 999,
                background: 'oklch(0.22 0.03 232 / 0.85)',
                border: '1.5px solid var(--accent)',
                boxShadow: '0 0 0 4px oklch(0.82 0.16 195 / 0.15)',
                marginBottom: 16, overflow: 'hidden',
              }}>
                <span style={{ paddingLeft: 16, paddingRight: 4, fontSize: 16, color: 'var(--accent)' }}>👤</span>
                <input value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '14px 12px', fontSize: 16, fontFamily: 'var(--font-body)', color: 'var(--ink)' }}/>
                <span className="number-tab" style={{ paddingRight: 14, fontSize: 11, color: 'var(--ink-mute)' }}>{username.length}/20</span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEditing(false)} className="btn-ghost tap-target" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleSave} disabled={loading} className="btn-primary tap-target" style={{ flex: 1, opacity: loading ? 0.7 : 1 }}>
                  {loading ? '⏳ Saving…' : '✓ Save changes'}
                </button>
              </div>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-ghost tap-target" style={{ width: '100%' }}>
              ✏ Edit profile
            </button>
          )}
        </div>

        {/* Sign out */}
        <button onClick={handleSignOut} className="tap-target" style={{
          width: '100%', padding: 14, borderRadius: 99,
          border: '1.5px solid oklch(0.68 0.22 22 / 0.35)',
          background: 'oklch(0.68 0.22 22 / 0.08)',
          color: 'var(--danger)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--font-body)', transition: 'all 150ms',
        }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
