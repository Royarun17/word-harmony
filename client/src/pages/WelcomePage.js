import React from 'react';
import { AuthScene, GoldButton, PlumButton, authStyles as styles } from '../components/auth/AuthKit';
import { UserPlusIcon, SignInIcon } from '../components/auth/AuthIcons';
import background from '../assets/auth/bg-welcome.webp';
import logo from '../assets/auth/welcome-logo.webp';
import mascot from '../assets/auth/welcome-mascot.webp';
import cardBuddy from '../assets/auth/card-buddy.webp';
import cardFan from '../assets/auth/fan-welcome.webp';

// Figures at their painted positions in the 1672x941 reference.
const FIGURES = [
  { src: mascot, x: 125, y: 95, w: 515 },
  { src: cardBuddy, x: 1210, y: 255, w: 315 },
  { src: cardFan, x: 10, y: 655, w: 530 },
  { src: logo, x: 465, y: 0, w: 760, alt: 'Word Harmony' },
];

export default function WelcomePage({ onNavigate }) {
  return (
    <AuthScene background={background} figures={FIGURES} className={styles.welcomeScene}>
      <h1 className={styles.srOnly}>Word Harmony</h1>
      <p className={styles.tagline}>A Multiplayer Word Card Game</p>
      <GoldButton
        type="button"
        className={styles.welcomeCreate}
        icon={<UserPlusIcon />}
        onClick={() => onNavigate('signup')}
      >
        Create Account
      </GoldButton>
      <PlumButton
        type="button"
        className={styles.welcomeSignIn}
        icon={<SignInIcon />}
        onClick={() => onNavigate('signin')}
      >
        Sign In
      </PlumButton>
    </AuthScene>
  );
}
