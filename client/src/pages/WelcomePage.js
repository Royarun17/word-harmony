import React from 'react';
import tabletop from '../assets/welcome/tabletop.webp';
import leo from '../assets/welcome/leo.webp';
import maya from '../assets/welcome/maya.webp';
import noah from '../assets/welcome/noah.webp';
import zoe from '../assets/welcome/zoe.webp';
import './WelcomePage.css';

const LinkMark = () => (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <path d="M25 39l-4 4a10 10 0 01-14-14l9-9a10 10 0 0114 0" />
    <path d="M39 25l4-4a10 10 0 0114 14l-9 9a10 10 0 01-14 0" />
    <path d="M22 32h20" />
  </svg>
);

const FullscreenIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
  </svg>
);

const steps = [
  { word: 'THINK', tone: 'blue', symbol: '●●●' },
  { word: 'LINK', tone: 'coral', symbol: '↗' },
  { word: 'WIN', tone: 'gold', symbol: '★' },
];

export default function WelcomePage({ onNavigate }) {
  const enterFullscreen = async () => {
    const root = document.documentElement;
    try {
      if (!document.fullscreenElement && root.requestFullscreen) {
        await root.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch (_) {
      // Browsers that do not expose fullscreen still receive the responsive layout.
    }
  };

  const go = async (screen) => {
    await enterFullscreen();
    onNavigate(screen);
  };

  return (
    <main className="wh-welcome">
      <section className="wh-welcome__stage" style={{ '--tabletop': `url(${tabletop})` }} aria-label="Word Harmony welcome screen">
        <div className="wh-welcome__ambient" aria-hidden="true" />
        <div className="wh-welcome__confetti" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>

        <button className="wh-welcome__fullscreen" type="button" onClick={enterFullscreen} aria-label="Enter fullscreen">
          <FullscreenIcon />
        </button>

        <header className="wh-welcome__brand">
          <div className="wh-welcome__logo-bursts" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="wh-welcome__logo"><span>WORD</span><span>HARMONY</span></div>
          <p>Connect words. Outsmart friends.</p>
        </header>

        <div className="wh-welcome__cast" aria-label="Four Word Harmony players">
          <img className="wh-character wh-character--leo" src={leo} alt="Leo" />
          <img className="wh-character wh-character--maya" src={maya} alt="Maya" />
          <img className="wh-character wh-character--noah" src={noah} alt="Noah" />
          <img className="wh-character wh-character--zoe" src={zoe} alt="Zoe" />
        </div>

        <div className="wh-welcome__deck" aria-label="Word Harmony cards">
          {[0, 1, 2].map((card) => <div className={`wh-deck-card wh-deck-card--${card + 1}`} key={card}><LinkMark /></div>)}
        </div>

        <div className="wh-welcome__steps" aria-label="Think, Link, Win">
          {steps.map((step, index) => (
            <React.Fragment key={step.word}>
              <div className={`wh-step-card wh-step-card--${step.tone}`}>
                <span className="wh-step-card__symbol" aria-hidden="true">{step.symbol}</span>
                <strong>{step.word}</strong><span className="wh-step-card__shine" aria-hidden="true" />
              </div>
              {index < steps.length - 1 && <span className="wh-step-arrow" aria-hidden="true">➜</span>}
            </React.Fragment>
          ))}
        </div>

        <div className="wh-welcome__actions">
          <button className="wh-primary-button" type="button" onClick={() => go('signin')}><span>SIGN IN</span><i aria-hidden="true">➜</i></button>
          <button className="wh-create-button" type="button" onClick={() => go('signup')}>New player? <strong>CREATE ACCOUNT</strong></button>
        </div>

        <span className="wh-welcome__version">v1.0</span>
      </section>
    </main>
  );
}
