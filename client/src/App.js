import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './SynapseComponents';
import socket from './utils/socket';
import { useSocketEvent } from './hooks/useSocketEvent';
import { useToast, ToastContainer } from './components/Toast';
import { auth, onAuthStateChanged } from './utils/firebase';
import axios from 'axios';

import TutorialPage      from './pages/TutorialPage';
import CardLoader        from './components/CardLoader';
import WelcomePage       from './pages/WelcomePage';
import SignUpPage        from './pages/SignUpPage';
import SignInPage        from './pages/SignInPage';
import ProfileSetupPage  from './pages/ProfileSetupPage';
import ProfilePage       from './pages/ProfilePage';
import LobbyPage         from './pages/LobbyPage';
import WaitingRoom       from './pages/WaitingRoom';
import SubmitWord        from './pages/SubmitWord';
import GamePlay          from './pages/GamePlay';
import ScoringPage       from './pages/ScoringPage';
import GameEnded         from './pages/GameEnded';

const TUTORIAL_KEY = 'synapseTutorialSeen';
const SESSION_KEY  = 'synapseSession';
const PROFILE_KEY  = 'synapseProfile';
const REJOIN_GRACE = 90000;

export default function App() {
  // ── Auth state ────────────────────────────────────────────────────────────
  const [authScreen, setAuthScreen]   = useState('loading'); // loading|welcome|signup|signin|phone|profileSetup|checkProfile|done
  const [authUser, setAuthUser]       = useState(null);
  const [profile, setProfile]         = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const [pendingName, setPendingName] = useState('');

  // ── Game state ────────────────────────────────────────────────────────────
  const [showTutorial, setShowTutorial] = useState(false);
  const [gameState, setGameState]       = useState('lobby');
  const [session, setSession]           = useState(null);
  const [myInfo, setMyInfo]             = useState(null);
  const [finalScores, setFinalScores]   = useState(null);
  const [scoringData, setScoringData]   = useState(null);
  const [rejoining, setRejoining]       = useState(false);
  const [showProfile, setShowProfile]   = useState(false);

  const { toasts, show: showToast } = useToast();

  // ── Firebase auth listener ─────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        // Try to load profile from server
        try {
          const { data } = await axios.get(`/auth/profile/${user.uid}`);
          if (data?.username) {
            // Always attach firebaseUid so mobile can use it
            const profileWithUid = { ...data, firebaseUid: user.uid, uid: user.uid };
            setProfile(profileWithUid);
            // Save to localStorage for quick access
            try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profileWithUid)); } catch {}
            setAuthScreen('done');
            // Check tutorial
            if (!localStorage.getItem(TUTORIAL_KEY)) setShowTutorial(true);
            // Check auto-rejoin
            checkAutoRejoin(data);
          } else {
            // No profile yet — show setup
            setAuthScreen('profileSetup');
          }
        } catch {
          // Profile not found — show setup
          setAuthScreen('profileSetup');
        }
      } else {
        // Not logged in — check cached profile first
        try {
          const cached = localStorage.getItem(PROFILE_KEY);
          if (cached) {
            // Had profile before — show welcome to sign back in
            localStorage.removeItem(PROFILE_KEY);
          }
        } catch {}
        setAuthScreen('welcome');
        setProfile(null);
        setAuthUser(null);
      }
    });
    return () => unsub();
  }, []);

  // ── Auth navigation ────────────────────────────────────────────────────────
  function handleAuthNavigate(screen, data = {}) {
    if (screen === 'checkProfile') {
      setPendingUser(data.user);
      setPendingName(data.displayName || '');
      setAuthScreen('checkProfile');
    } else {
      setAuthScreen(screen);
    }
  }

  // When we get to checkProfile — check if profile exists
  useEffect(() => {
    if (authScreen !== 'checkProfile' || !pendingUser) return;
    async function check() {
      try {
        const { data } = await axios.get(`/auth/profile/${pendingUser.uid}`);
        if (data?.username) {
          const profileWithUid = { ...data, firebaseUid: pendingUser.uid, uid: pendingUser.uid };
          setProfile(profileWithUid);
          try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profileWithUid)); } catch {}
          setAuthScreen('done');
          if (!localStorage.getItem(TUTORIAL_KEY)) setShowTutorial(true);
        } else {
          setAuthScreen('profileSetup');
        }
      } catch {
        setAuthScreen('profileSetup');
      }
    }
    check();
  }, [authScreen, pendingUser]);

  function handleProfileComplete(profileData) {
    setProfile(profileData);
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData)); } catch {}
    setAuthScreen('done');
    if (!localStorage.getItem(TUTORIAL_KEY)) setShowTutorial(true);
  }

  function handleSignOut() {
    setProfile(null);
    setAuthUser(null);
    try { localStorage.removeItem(PROFILE_KEY); } catch {}
    setShowProfile(false);
    setAuthScreen('welcome');
  }

  // ── Auto-rejoin ────────────────────────────────────────────────────────────
  function checkAutoRejoin(prof) {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const { sessionId, playerId, playerName, isHost, savedAt } = parsed;
        const elapsed = Date.now() - (savedAt || 0);
        if (sessionId && playerId && elapsed < REJOIN_GRACE) {
          setRejoining(true);
          setMyInfo({ sessionId, playerId, playerName: playerName || prof?.username, isHost });
          socket.connect();
          socket.emit('rejoin_session', { sessionId, playerId, playerName: playerName || prof?.username });
        } else if (elapsed >= REJOIN_GRACE) {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {}
  }

  // ── Session helpers ────────────────────────────────────────────────────────
  function saveSession(info) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ ...info, savedAt: Date.now() })); } catch {}
  }
  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  }

  // ── Socket events ──────────────────────────────────────────────────────────
  useSocketEvent('rejoin_success', () => setRejoining(false));
  useSocketEvent('rejoin_failed', ({ message }) => {
    setRejoining(false); clearSession(); setGameState('lobby');
    showToast(message || 'Could not rejoin — please enter the session code.', 'error');
  });
  useSocketEvent('player_reconnected', ({ playerName }) => showToast(`${playerName} rejoined!`, 'success'));
  useSocketEvent('player_disconnected', ({ playerName }) => showToast(`${playerName} disconnected`, 'info'));
  useSocketEvent('player_turn_skipped', ({ playerName }) => showToast(`${playerName} is away — auto-passing`, 'info'));

  useSocketEvent('session_update', (s) => {
    setSession(s);
    if      (s.phase === 'lobby')   setGameState('waiting');
    else if (s.phase === 'submit')  { setGameState('submit'); setScoringData(null); }
    else if (s.phase === 'loading') setGameState('submit');
    else if (s.phase === 'playing') setGameState(prev => prev === 'scoring' ? 'scoring' : 'playing');
    else if (s.phase === 'buzzing') setGameState(prev => prev === 'scoring' ? 'scoring' : 'playing');
    else if (s.phase === 'scoring') setGameState('scoring');
    else if (s.phase === 'ended')   { setGameState('ended'); clearSession(); }
  });

  useSocketEvent('round_scored',  (data) => { setScoringData(data); setGameState('scoring'); });
  useSocketEvent('game_ended',    ({ finalScores: fs }) => { setFinalScores(fs); setGameState('ended'); clearSession(); });
  useSocketEvent('error',         ({ message }) => showToast(message, 'error'));
  useSocketEvent('word_error',    ({ message }) => showToast(message, 'error'));
  useSocketEvent('buzzer_pressed', ({ playerName, playerId: bid }) => {
    if (bid !== myInfo?.playerId) showToast(`${playerName} buzzed!`, 'info');
  });
  useSocketEvent('card_incoming', ({ fromPlayerName, toPlayerId }) => {
    if (toPlayerId === myInfo?.playerId) showToast(`Card from ${fromPlayerName}!`, 'success');
  });

  function handleJoined(info) {
    setMyInfo(info);
    setGameState('waiting');
    saveSession(info);
  }

  function handlePlayAgain() {
    socket.disconnect();
    clearSession();
    setSession(null); setMyInfo(null); setFinalScores(null); setScoringData(null);
    setGameState('lobby');
  }

  function completeTutorial() {
    setShowTutorial(false);
    try { localStorage.setItem(TUTORIAL_KEY, 'true'); } catch {}
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  // Loading — Firebase checking auth
  if (authScreen === 'loading' || authScreen === 'checkProfile') {
    return <CardLoader message="Loading Synapse…"/>;
  }

  // Auth screens
  if (authScreen === 'welcome')      return <WelcomePage onNavigate={handleAuthNavigate}/>;
  if (authScreen === 'signup')       return <SignUpPage onNavigate={handleAuthNavigate}/>;
  if (authScreen === 'signin')       return <SignInPage onNavigate={handleAuthNavigate}/>;
  if (authScreen === 'profileSetup') return (
    <ProfileSetupPage
      user={pendingUser || authUser}
      prefillName={pendingName}
      onNavigate={(screen, data) => {
        if (screen === 'lobby') {
          // Profile was saved — fetch fresh profile from server
          const u = pendingUser || authUser;
          if (u) {
            axios.get(`/auth/profile/${u.uid}`).then(({ data: profileData }) => {
              if (profileData?.username) handleProfileComplete(profileData);
            }).catch(() => handleProfileComplete({ username: data?.username || pendingName }));
          } else {
            handleProfileComplete({});
          }
        } else {
          setAuthScreen(screen);
        }
      }}
    />
  );

  // Profile page overlay
  if (showProfile) return (
    <ThemeProvider>
    <ProfilePage
      profile={profile}
      onSignOut={handleSignOut}
      onBack={() => setShowProfile(false)}
      onProfileUpdate={(updatedProfile) => {
        setProfile(updatedProfile);
        try { localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile)); } catch {}
      }}
    />
    </ThemeProvider>
  );

  // Rejoining spinner
  if (rejoining) return (
    <div style={{ position:'relative' }}>
      <CardLoader message="Rejoining your game…"/>
      <div style={{ position:'absolute', bottom:40, left:0, right:0, textAlign:'center' }}>
        <button onClick={() => { setRejoining(false); clearSession(); setGameState('lobby'); }}
          style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:13, cursor:'pointer', textDecoration:'underline' }}>
          Go to Lobby instead
        </button>
      </div>
    </div>
  );

  // Tutorial
  if (showTutorial) return <TutorialPage onDone={completeTutorial}/>;

  // Main game — lobby prefills name from profile
  return (
    <ThemeProvider>
    <>
      {gameState === 'lobby'   && (
        <LobbyPage
          onJoined={handleJoined}
          onShowTutorial={() => setShowTutorial(true)}
          prefillName={profile?.username || ''}
          onShowProfile={() => setShowProfile(true)}
          onSignOut={handleSignOut}
          profile={profile}
        />
      )}
      {gameState === 'waiting' && session && myInfo && <WaitingRoom session={session} playerId={myInfo.playerId} isHost={myInfo.isHost} onBack={() => { socket.disconnect(); clearSession(); setSession(null); setMyInfo(null); setGameState('lobby'); }}/>}
      {gameState === 'submit'  && session && myInfo && <SubmitWord  session={session} playerId={myInfo.playerId}/>}
      {gameState === 'playing' && session && myInfo && <GamePlay    session={session} playerId={myInfo.playerId} onExit={handlePlayAgain}/>}
      {gameState === 'scoring' && session && myInfo && <ScoringPage session={session} playerId={myInfo.playerId} isHost={myInfo.isHost} scoringData={scoringData}/>}
      {gameState === 'ended'   && finalScores && myInfo && <GameEnded finalScores={finalScores} playerId={myInfo.playerId} onPlayAgain={handlePlayAgain}/>}
      <ToastContainer toasts={toasts}/>
    </>
    </ThemeProvider>
  );
}
