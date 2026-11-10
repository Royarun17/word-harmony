import React, { useState } from 'react';
import socket from '../utils/socket';
import { avatarHue } from '../SynapseComponents';
import { HomeDialog } from '../components/home/HomeScreen';
import { FriendsIcon, PlayIcon, PencilIcon } from '../components/home/HomeIcons';
import bg from '../assets/home/home-bg.webp';
import home from '../components/home/home.module.css';
import styles from '../components/home/waiting.module.css';

const AVATARS = ['😎','🧠','🦊','🐯','🐸','🦁','🐧','🐉','🦋','🐺','🦅','🐬','🎭','🧩','⚡','🔥'];
const DIFFICULTY = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

// Players' avatars arrive as an emoji string, or { type: 'emoji' | 'photo', value }.
function SeatAvatar({ player }) {
  const a = player.avatar;
  const value = typeof a === 'string' ? a : a?.value;
  const isPhoto = typeof a === 'object' && a?.type === 'photo' && value;
  const initials = player.name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <span className={styles.avatar} style={{ '--hue': avatarHue(player.name) }} aria-hidden>
      {isPhoto ? <img src={value} alt="" /> : <span>{value || initials}</span>}
    </span>
  );
}

export default function WaitingRoom({ session, playerId, isHost, onBack }) {
  const [showAvatar, setShowAvatar] = useState(false);
  const [copied, setCopied] = useState('');
  const players = session.players || [];
  const maxPlayers = session.maxPlayers || 4;
  const openSeats = Math.max(0, maxPlayers - players.length);
  const canStart = isHost && players.filter(p => !p.isBot).length >= 1;
  const modeName = session.gameMode === 'fun' ? 'Spark' : 'Syntax';
  const settings = [
    `${modeName} · ${session.gameMode === 'fun' ? 'associations' : 'synonyms'}`,
    `${session.rounds} rounds`,
    DIFFICULTY[session.difficulty] || 'Medium',
  ];

  function handleStart() { socket.emit('start_submission', { sessionId: session.id }); }
  function handleLeave() { socket.disconnect(); onBack && onBack(); }
  function handleAvatarChange(av) {
    socket.emit('update_avatar', { sessionId: session.id, playerId, avatar: av });
    setShowAvatar(false);
  }
  function flash(text) { setCopied(text); setTimeout(() => setCopied(''), 1600); }
  async function handleCopy() {
    try { await navigator.clipboard.writeText(session.id); flash('Code copied'); } catch { flash(`Code: ${session.id}`); }
  }
  async function handleShare() {
    const text = `Join my Word Harmony room with code ${session.id}`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Word Harmony', text, url: window.location.origin }); return; }
      await navigator.clipboard.writeText(`${text}: ${window.location.origin}`);
      flash('Invite copied');
    } catch (e) {
      if (!e || e.name !== 'AbortError') flash(`Code: ${session.id}`);
    }
  }

  return (
    <main className={`${home.home} ${styles.room}`}>
      <img className={home.bg} src={bg} alt="" aria-hidden />
      <div className={home.vignette} aria-hidden />

      <header className={styles.top}>
        <button type="button" className={home.roundBtn} onClick={handleLeave} aria-label="Leave room">←</button>
        <div className={styles.title}>
          <h1>Waiting Room</h1>
        </div>
        <button type="button" className={home.roundBtn} onClick={handleShare} aria-label="Invite friends"><FriendsIcon /></button>
      </header>

      <section className={styles.codeCol} aria-label="Room code">
        <span className={styles.label}>Room code</span>
        <button type="button" className={styles.code} onClick={handleCopy} aria-label={`Room code ${session.id.split('').join(' ')}. Tap to copy.`}>
          {session.id.split('').map((ch, i) => (
            <span key={i} className={styles.tile} style={{ '--i': i }}>{ch}</span>
          ))}
        </button>
        <div className={styles.codeActions}>
          <button type="button" className={styles.pill} onClick={handleCopy}>Copy</button>
          <button type="button" className={styles.pill} onClick={handleShare}>Share</button>
        </div>
        <p className={styles.toast} role="status">{copied}</p>
        <ul className={styles.settings} aria-label="Room settings">
          {settings.map(t => <li key={t}>{t}</li>)}
        </ul>

        {isHost ? (
          <button type="button" className={styles.start} onClick={handleStart} disabled={!canStart}>
            Start Game <span className={styles.startDisc} aria-hidden><PlayIcon /></span>
          </button>
        ) : (
          <p className={styles.waiting}>Waiting for the host to start<span className={styles.dots} aria-hidden><i>.</i><i>.</i><i>.</i></span></p>
        )}
      </section>

      <section className={styles.seatsCol} aria-labelledby="seats-title">
        <div className={styles.seatsHead}>
          <h2 id="seats-title" className={styles.label}>Players</h2>
          <span className={styles.count}>{players.length} / {maxPlayers}</span>
        </div>
        <ul className={styles.seats} style={{ '--cols': maxPlayers > 4 ? 4 : maxPlayers }}>
          {players.slice(0, maxPlayers).map(p => {
            const me = p.id === playerId;
            const host = p.id === session.hostId;
            return (
              <li key={p.id} className={`${styles.seat}${me ? ` ${styles.me}` : ''}${p.connected === false ? ` ${styles.away}` : ''}`}>
                <SeatAvatar player={p} />
                <span className={styles.name} title={p.name}>{p.name}</span>
                <span className={styles.tag}>{me ? 'You' : host ? 'Host' : p.isBot ? 'Bot' : p.connected === false ? 'Away' : 'Ready'}</span>
                {host && <span className={styles.crown} aria-label="Host">♛</span>}
                {me && (
                  <>
                    <span className={styles.edit} aria-hidden><PencilIcon /></span>
                    <button type="button" className={styles.seatBtn} onClick={() => setShowAvatar(true)} aria-label="Change your avatar" />
                  </>
                )}
              </li>
            );
          })}
          {Array.from({ length: openSeats }, (_, i) => (
            <li key={`open-${i}`} className={`${styles.seat} ${styles.open}`} title="A bot takes this seat when the game starts">
              <span className={styles.plus} aria-hidden>+</span>
              <span className={styles.name}>Open seat</span>
              <span className={styles.tag} aria-label="A bot takes this seat when the game starts">Bot fills</span>
            </li>
          ))}
        </ul>
      </section>

      {showAvatar && (
        <HomeDialog title="Choose your avatar" onClose={() => setShowAvatar(false)}>
          <div className={styles.avatarGrid}>
            {AVATARS.map(a => (
              <button key={a} type="button" className={styles.avatarPick} onClick={() => handleAvatarChange(a)} aria-label={`Avatar ${a}`}>{a}</button>
            ))}
          </div>
        </HomeDialog>
      )}
    </main>
  );
}
