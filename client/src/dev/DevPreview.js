import React, { useEffect, useState } from 'react';
import socket from '../utils/socket';
import { useSocketEvent } from '../hooks/useSocketEvent';
import WelcomePage from '../pages/WelcomePage';
import SignUpPage from '../pages/SignUpPage';
import SignInPage from '../pages/SignInPage';
import GamePlay from '../pages/GamePlay';
import LobbyPage from '../pages/LobbyPage';
import WaitingRoom from '../pages/WaitingRoom';

// Development-only screen previews, so layouts can be checked at phone sizes
// without Firebase sign-in or three real players. index.js only loads this
// when NODE_ENV is "development" and the URL has ?preview=<screen>.
//
//   ?preview=welcome               Welcome → Sign Up / Sign In, navigating between them
//   ?preview=signup | signin       open straight on that page
//   ?preview=home                  signed-in Home (Lobby); &name=… to test long names
//   ?preview=waiting               host view, 2 of 4 seats; &host=0 guest view,
//                                  &players=1..8, &max=4..8
//   ?preview=live                  real server: Home → room setup → Waiting Room
//   ?preview=gameplay              your turn, hand of 3
//   ?preview=gameplay&turn=0       someone else's turn
//   ?preview=gameplay&set=1        your hand is a complete set, buzzer open
//   ?preview=gameplay&cards=4      holding 4 cards (just received one)
//   ?preview=gameplay&players=5    more opponents in the top bar

const ME = 'p-me';
const NAMES = ['Maya Patel', 'Leo Brooks', 'Noah Kim', 'Zoe Alvarez', 'Ava Chen'];
const WORDS = ['ocean', 'bright', 'journey', 'quiet', 'garden', 'thunder'];
const HAND = ['luminous', 'radiant', 'sea', 'voyage'];

function mockSession(params) {
  const opponents = Math.min(Math.max(Number(params.get('players') || 3), 1), 5);
  const players = [{ id: ME, name: 'You Player', connected: true }]
    .concat(NAMES.slice(0, opponents).map((name, i) => ({ id: `p-${i}`, name, connected: i !== 2 })));
  const myTurn = params.get('turn') !== '0';
  const turnOrder = players.map(p => p.id);
  const wordSubmissions = {};
  players.forEach((p, i) => { wordSubmissions[p.id] = WORDS[i]; });
  const totalScores = {};
  players.forEach((p, i) => { totalScores[p.id] = [1200, 2400, 800, 1600, 400, 0][i]; });
  const handCounts = {};
  players.forEach((p, i) => { handCounts[p.id] = i === 2 ? 4 : 3; });
  return {
    id: 'HRMNY',
    phase: 'playing',
    currentRound: 2,
    rounds: 3,
    gameMode: 'casual',
    players,
    turnOrder,
    currentTurnIndex: myTurn ? 0 : 1,
    starterPlayerId: 'p-1',
    firstRoundOver: true,
    buzzerLog: [],
    totalScores,
    handCounts,
    wordSubmissions,
  };
}

// Deliver a server event to this client's own listeners (the socket is never
// connected in preview mode, so nothing reaches the real server).
function deliver(event, payload) {
  socket.listeners(event).forEach(fn => fn(payload));
}

function GameplayPreview({ params }) {
  const [session] = useState(() => mockSession(params));
  useEffect(() => {
    const cards = Math.min(Math.max(Number(params.get('cards') || 3), 1), 4);
    const set = params.get('set') === '1';
    const hand = set ? ['radiant', 'luminous', 'bright', 'sea'].slice(0, cards) : HAND.slice(0, cards);
    const id = setTimeout(() => {
      deliver(`hand_update_${ME}`, { hand, isStarter: false, hasCompleteSet: set });
      deliver('turn_timer', { seconds: 24 });
    }, 50);
    return () => clearTimeout(id);
  }, [params]);
  return <GamePlay session={session} playerId={ME} onExit={() => window.location.assign('/?preview=welcome')} />;
}

// Home and the Waiting Room wired to the real local server, without sign-in:
// creating or joining a room shows the Waiting Room fed by session_update.
function LivePreview() {
  const [info, setInfo] = useState(null);
  const [session, setSession] = useState(null);
  useSocketEvent('session_update', s => setSession(s));
  const profile = { username: 'Arun', level: 6, avatar: '🦁' };
  if (!info) return <LobbyPage profile={profile} onJoined={setInfo} onShowTutorial={() => {}} onShowProfile={() => {}} />;
  if (!session) return <p style={{ padding: 20 }}>Joining {info.sessionId}…</p>;
  if (session.phase !== 'lobby') return <p style={{ padding: 20 }}>Room {session.id} moved to phase “{session.phase}”.</p>;
  return <WaitingRoom session={session} playerId={info.playerId} isHost={info.isHost} onBack={() => { setInfo(null); setSession(null); }} />;
}

export default function DevPreview({ screen }) {
  const params = new URLSearchParams(window.location.search);
  if (screen === 'gameplay') return <GameplayPreview params={params} />;
  if (screen === 'live') return <LivePreview />;
  if (screen === 'waiting') {
    const max = Math.min(Math.max(Number(params.get('max') || 4), 4), 8);
    const count = Math.min(Math.max(Number(params.get('players') || 2), 1), max);
    const isHost = params.get('host') !== '0';
    const players = [{ id: ME, name: 'Arun', connected: true, avatar: '🦁' }]
      .concat(NAMES.concat(['Ravi Shah', 'Mia Wong']).slice(0, count - 1).map((name, i) => ({
        id: `p-${i}`, name, connected: i !== 2, avatar: i === 0 ? '🦊' : null,
      })));
    const session = {
      id: 'HRMNY', phase: 'lobby', rounds: 5, gameMode: 'fun', difficulty: 'medium', maxPlayers: max,
      hostId: isHost ? ME : 'p-0', players,
    };
    return <WaitingRoom session={session} playerId={ME} isHost={isHost} onBack={() => console.info('[preview] navigate → lobby')} />;
  }
  if (screen === 'home') {
    const profile = { username: params.get('name') || 'Arun', level: 6, avatar: params.get('avatar') || '🦁' };
    return (
      <LobbyPage
        profile={profile}
        onJoined={info => console.info('[preview] joined →', info)}
        onShowTutorial={() => console.info('[preview] navigate → tutorial')}
        onShowProfile={() => console.info('[preview] navigate → profile')}
      />
    );
  }
  return <AuthPreview start={screen === 'signup' || screen === 'signin' ? screen : 'welcome'} />;
}

// The three sign-in pages with their real navigation between each other.
function AuthPreview({ start }) {
  const [page, setPage] = useState(start);
  const go = (to, data) => {
    console.info('[preview] navigate →', to, data || '');
    if (to === 'welcome' || to === 'signup' || to === 'signin') setPage(to);
  };
  if (page === 'signup') return <SignUpPage onNavigate={go} />;
  if (page === 'signin') return <SignInPage onNavigate={go} />;
  return <WelcomePage onNavigate={go} />;
}
