import React from 'react';
import bg from '../../assets/home/home-bg.webp';
import { GamepadIcon, QrIcon, PlayIcon } from './HomeIcons';
import home from './home.module.css';
import styles from './room.module.css';

const MODES = [
  { id: 'spark', name: 'Spark', note: 'Associations', example: 'ocean → wave' },
  { id: 'syntax', name: 'Syntax', note: 'Synonyms', example: 'happy → glad' },
];
const DIFFICULTIES = [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']];
const PLAYERS = [4, 5, 6, 7, 8];
const ROUNDS = [3, 5, 7, 10];

// A group of real radio inputs drawn as chips: arrow keys, Tab and screen
// readers work for free, and choosing one never submits the form.
function Choice({ name, legend, options, value, onChange, className = '' }) {
  return (
    <fieldset className={`${styles.group} ${className}`}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.chips}>
        {options.map(([v, label, sub]) => (
          <label key={v} className={styles.chip}>
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
            <span>
              {label}
              {[].concat(sub || []).map((line, i) => <small key={i}>{line}</small>)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function RoomSetup({
  tab, onTab, onBack,
  mode, onMode, difficulty, onDifficulty, maxPlayers, onMaxPlayers, rounds, onRounds,
  code, onCode, loading, error, onCreate, onJoin,
}) {
  return (
    <main className={`${home.home} ${styles.room}`}>
      <img className={home.bg} src={bg} alt="" aria-hidden />
      <div className={home.vignette} aria-hidden />

      <header className={styles.top}>
        <button type="button" className={`${home.roundBtn} ${styles.back}`} onClick={onBack} aria-label="Back to Home">←</button>
        <div className={styles.tabs} role="tablist" aria-label="Create or join a room">
          <button type="button" role="tab" id="tab-create" aria-selected={tab === 'create'} aria-controls="panel-create"
            className={`${styles.tab} ${styles.tabCreate}`} onClick={() => onTab('create')}>
            <GamepadIcon /> Create Room
          </button>
          <button type="button" role="tab" id="tab-join" aria-selected={tab === 'join'} aria-controls="panel-join"
            className={`${styles.tab} ${styles.tabJoin}`} onClick={() => onTab('join')}>
            <QrIcon /> Join with Code
          </button>
        </div>
        <span className={styles.topSpacer} aria-hidden />
      </header>

      {tab === 'create' ? (
        <form id="panel-create" role="tabpanel" aria-labelledby="tab-create" className={`${styles.panel} ${styles.create}`} onSubmit={onCreate}>
          <div className={styles.col}>
            <Choice
              name="mode" legend="Mode" value={mode} onChange={onMode} className={styles.modes}
              options={MODES.map(m => [m.id, m.name, [m.note, m.example]])}
            />
            <Choice name="difficulty" legend="Difficulty" value={difficulty} onChange={onDifficulty} options={DIFFICULTIES} />
          </div>
          <div className={styles.col}>
            <Choice name="players" legend="Players" value={maxPlayers} onChange={onMaxPlayers} className={styles.numbers}
              options={PLAYERS.map(n => [n, String(n)])} />
            <Choice name="rounds" legend="Rounds" value={rounds} onChange={onRounds} className={styles.numbers}
              options={ROUNDS.map(n => [n, String(n)])} />
            <p className={styles.note}>Empty seats are filled with bots when you start.</p>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <button type="submit" className={`${styles.go} ${styles.goCreate}`} disabled={loading}>
              {loading ? 'Creating…' : 'Create Room'} <span className={styles.goDisc} aria-hidden><PlayIcon /></span>
            </button>
          </div>
        </form>
      ) : (
        <form id="panel-join" role="tabpanel" aria-labelledby="tab-join" className={`${styles.panel} ${styles.join}`} onSubmit={onJoin}>
          <label className={styles.codeLabel} htmlFor="room-code">Room code</label>
          <input
            id="room-code"
            className={styles.code}
            value={code}
            onChange={e => onCode(e.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase())}
            placeholder="XK7F2"
            maxLength={5}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
          />
          <p className={styles.note}>Ask the host for the 5-letter code on their screen.</p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" className={`${styles.go} ${styles.goJoin}`} disabled={loading || code.length < 5}>
            {loading ? 'Joining…' : 'Join Room'} <span className={styles.goDisc} aria-hidden><PlayIcon /></span>
          </button>
        </form>
      )}
    </main>
  );
}
