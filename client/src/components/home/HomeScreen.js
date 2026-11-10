import React, { useEffect, useRef, useState } from 'react';
import bg from '../../assets/home/home-bg.webp';
import logo from '../../assets/home/home-logo.webp';
import { RULES } from '../gameplay/InfoDialog';
import {
  FriendsIcon, BellIcon, GearIcon, PencilIcon, StarIcon, GamepadIcon, PeopleIcon,
  QrIcon, PlayIcon, BookIcon, RulesIcon, InfoIcon, CloseIcon,
} from './HomeIcons';
import styles from './home.module.css';

const MODE_NOTES = [
  ['Syntax', 'Your word becomes synonym cards: happy → joyful, elated, content.'],
  ['Spark', 'Your word becomes association cards: football → lineman, league, kickoff.'],
];

function Avatar({ avatar, name }) {
  const isImage = typeof avatar === 'string' && /^(data:|https?:)/.test(avatar);
  const initials = name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <span className={styles.avatar} aria-hidden>
      {isImage ? <img src={avatar} alt="" /> : <span className={styles.avatarGlyph}>{avatar || initials}</span>}
    </span>
  );
}

// A small modal in the Home style. Focus moves into it on open, Escape and the
// backdrop close it, and focus returns to the button that opened it.
export function HomeDialog({ title, onClose, children }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    closeRef.current?.focus();
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className={styles.dialogWrap} role="dialog" aria-modal="true" aria-labelledby="home-dialog-title">
      <button type="button" className={styles.backdrop} aria-label="Close" tabIndex={-1} onClick={onClose} />
      <div className={styles.dialog}>
        <div className={styles.dialogHead}>
          <h2 id="home-dialog-title">{title}</h2>
          <button ref={closeRef} type="button" className={styles.dialogClose} onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </div>
        <div className={styles.dialogBody}>{children}</div>
      </div>
    </div>
  );
}

export default function HomeScreen({
  playerName, level, avatar,
  onProfile, onCreateRoom, onPlayWithFriends, onJoinWithCode, onHowToPlay,
  busy, error,
}) {
  const [dialog, setDialog] = useState(null); // 'rules' | 'about' | 'alerts' | 'invite'
  const [inviteState, setInviteState] = useState('');
  const close = React.useCallback(() => setDialog(null), []);

  async function invite() {
    const url = window.location.origin;
    const text = 'Play Word Harmony with me! Make a room or join with my code.';
    try {
      if (navigator.share) { await navigator.share({ title: 'Word Harmony', text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setInviteState('Invite link copied. Paste it to your friends.');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      setInviteState(`Share this link with your friends: ${url}`);
    }
    setDialog('invite');
  }

  return (
    <main className={styles.home}>
      <img className={styles.bg} src={bg} alt="" aria-hidden />
      <div className={styles.vignette} aria-hidden />

      {/* Top left: profile */}
      <div className={styles.profile}>
        <button type="button" className={styles.profileMain} onClick={onProfile} aria-label={`Open profile: ${playerName}, level ${level}`}>
          <Avatar avatar={avatar} name={playerName} />
          <span className={styles.profileText}>
            <span className={styles.profileName}>{playerName}</span>
            <span className={styles.profileLevel}><StarIcon /> Lv. {level}</span>
          </span>
        </button>
        <button type="button" className={styles.profileEdit} onClick={onProfile} aria-label="Edit profile"><PencilIcon /></button>
      </div>

      {/* Top right: friends, notifications, settings */}
      <nav className={styles.topIcons} aria-label="Quick actions">
        <button type="button" className={styles.roundBtn} onClick={invite} aria-label="Invite friends"><FriendsIcon /></button>
        <button type="button" className={styles.roundBtn} onClick={() => setDialog('alerts')} aria-label="Notifications"><BellIcon /></button>
        <button type="button" className={styles.roundBtn} onClick={onProfile} aria-label="Settings"><GearIcon /></button>
      </nav>

      <div className={styles.column}>
        <header className={styles.brand}>
          <h1 className={styles.srOnly}>Word Harmony</h1>
          <img className={styles.logo} src={logo} alt="Word Harmony" />
          <p className={styles.tagline}>A Multiplayer Word Card Game</p>
          <p className={styles.sub}>
            Connect Words <i aria-hidden>✦</i> Build Sets <i aria-hidden>✦</i> Pass Cards <i aria-hidden>✦</i> Buzz &amp; Win Together!
          </p>
        </header>

        <section className={styles.actions} aria-label="Play">
          <button type="button" className={`${styles.card} ${styles.cardCreate}`} onClick={onCreateRoom} disabled={busy} aria-label="Create game room">
            <span className={styles.cardIcon}><GamepadIcon /></span>
            <span className={styles.cardLabel}>Create<br />Game Room</span>
          </button>

          <button type="button" className={`${styles.card} ${styles.cardPlay}`} onClick={onPlayWithFriends} disabled={busy} aria-label={busy ? 'Opening room' : 'Play with friends'} aria-describedby="home-play-hint">
            <span className={styles.cardIcon}><PeopleIcon /></span>
            <span className={styles.cardLabel}>{busy ? 'Opening room…' : <>Play with<br />Friends</>}</span>
            <span className={styles.playDisc} aria-hidden><PlayIcon /></span>
            <span id="home-play-hint" className={styles.srOnly}>Opens a new room right away and gives you a code to share.</span>
          </button>

          <button type="button" className={`${styles.card} ${styles.cardJoin}`} onClick={onJoinWithCode} disabled={busy} aria-label="Join with code">
            <span className={styles.cardIcon}><QrIcon /></span>
            <span className={styles.cardLabel}>Join with<br />Code</span>
          </button>
        </section>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <nav className={styles.infoRow} aria-label="Help">
          <button type="button" className={styles.infoBtn} onClick={onHowToPlay}><BookIcon /> How to Play</button>
          <button type="button" className={styles.infoBtn} onClick={() => setDialog('rules')}><RulesIcon /> Game Rules</button>
          <button type="button" className={styles.infoBtn} onClick={() => setDialog('about')}><InfoIcon /> About</button>
        </nav>
      </div>

      {dialog === 'rules' && (
        <HomeDialog title="Game Rules" onClose={close}>
          <ol className={styles.rules}>{RULES.map(r => <li key={r}>{r}</li>)}</ol>
          <div className={styles.modes}>
            {MODE_NOTES.map(([name, note]) => <p key={name}><b>{name}.</b> {note}</p>)}
          </div>
        </HomeDialog>
      )}
      {dialog === 'about' && (
        <HomeDialog title="About Word Harmony" onClose={close}>
          <p>A multiplayer word card game for 4 to 8 players. Everyone submits a word, the deck is built from those words, and you pass cards around the table until someone holds a full set and buzzes.</p>
          <p>Rooms fill empty seats with bots, so you can start with fewer friends.</p>
        </HomeDialog>
      )}
      {dialog === 'alerts' && (
        <HomeDialog title="Notifications" onClose={close}>
          <p>No notifications yet. You're all caught up.</p>
        </HomeDialog>
      )}
      {dialog === 'invite' && (
        <HomeDialog title="Invite friends" onClose={close}>
          <p>{inviteState}</p>
          <p>Then tap <b>Play with Friends</b> to open a room and share its code.</p>
        </HomeDialog>
      )}
    </main>
  );
}
