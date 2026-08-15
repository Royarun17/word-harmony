import React from 'react';
import tabletop from '../assets/welcome/tabletop-v2.webp';
import leo from '../assets/welcome/leo-v2.webp';
import maya from '../assets/welcome/maya-v2.webp';
import noah from '../assets/welcome/noah-v2.webp';
import zoe from '../assets/welcome/zoe-v2.webp';
import './WelcomePage.css';

const steps = [
  {
    word: 'THINK',
    tone: 'blue',
    description: 'Brainstorm clever words',
    symbol: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M21 42c-7 0-12-5-12-11 0-5 3-9 8-10 1-8 7-13 15-13 7 0 13 4 15 11 6 1 10 5 10 11 0 7-6 12-13 12H21Z" />
        <circle cx="14" cy="51" r="4" />
        <circle cx="7" cy="58" r="2.5" />
      </svg>
    ),
  },
  {
    word: 'LINK',
    tone: 'coral',
    description: 'Connect and build',
    symbol: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M25 39l-4 4a10 10 0 0 1-14-14l9-9a10 10 0 0 1 14 0" />
        <path d="M39 25l4-4a10 10 0 0 1 14 14l-9 9a10 10 0 0 1-14 0" />
        <path d="M22 32h20" />
      </svg>
    ),
  },
  {
    word: 'WIN',
    tone: 'gold',
    description: 'Outsmart and win',
    symbol: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M20 10h24v12c0 10-5 17-12 17s-12-7-12-17V10Z" />
        <path d="M20 15H9c0 10 4 15 13 15M44 15h11c0 10-4 15-13 15M32 39v9M23 55h18M26 48h12" />
      </svg>
    ),
  },
];

export default function WelcomePage({ onNavigate }) {
  return (
    <main className="wh-welcome">
      <section
        className="wh-welcome__stage"
        style={{ '--tabletop': `url(${tabletop})` }}
        aria-label="Word Harmony welcome screen"
      >
        <div className="wh-welcome__ambient" aria-hidden="true" />
        <div className="wh-welcome__confetti" aria-hidden="true">
          <i /><i /><i /><i /><i /><i /><i /><i />
        </div>

        <header className="wh-welcome__brand">
          <span className="wh-welcome__brand-star" aria-hidden="true">✦</span>
          <div className="wh-welcome__logo-bursts" aria-hidden="true">
            <i /><i /><i /><i /><i /><i />
          </div>
          <h1 className="wh-welcome__logo">
            <span>WORD</span>
            <span>HARMONY</span>
          </h1>
          <p>CONNECT WORDS. <strong>OUTSMART FRIENDS.</strong></p>
        </header>

        <div className="wh-welcome__cast" aria-label="Four friends holding Word Harmony cards">
          <img className="wh-character wh-character--leo" src={leo} alt="Leo holding three cards" />
          <img className="wh-character wh-character--maya" src={maya} alt="Maya holding three cards" />
          <img className="wh-character wh-character--noah" src={noah} alt="Noah holding three cards" />
          <img className="wh-character wh-character--zoe" src={zoe} alt="Zoe holding four cards" />
        </div>

        <div className="wh-welcome__steps" aria-label="Think, Link, Win">
          {steps.map((step, index) => (
            <React.Fragment key={step.word}>
              <article className={`wh-step-card wh-step-card--${step.tone}`}>
                <span className="wh-step-card__symbol">{step.symbol}</span>
                <strong>{step.word}</strong>
                <small>{step.description}</small>
                <span className="wh-step-card__shine" aria-hidden="true" />
              </article>
              {index < steps.length - 1 && <span className="wh-step-arrow" aria-hidden="true">➜</span>}
            </React.Fragment>
          ))}
        </div>

        <div className="wh-welcome__actions">
          <button
            className="wh-primary-button"
            type="button"
            onClick={() => onNavigate('signup')}
          >
            CREATE ACCOUNT
          </button>
          <p className="wh-signin-copy">
            Already have an account?{' '}
            <button type="button" onClick={() => onNavigate('signin')}>SIGN IN</button>
          </p>
        </div>
      </section>
    </main>
  );
}
