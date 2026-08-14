import React from 'react';
import tabletopBackground from '../assets/tabletop-background.png';
import welcomeFriends from '../assets/welcome-friends.png';
import './WelcomePage.css';

const playCards = [
  { label: 'THINK', symbol: '●●●', color: 'blue' },
  { label: 'LINK', symbol: '∞', color: 'coral' },
  { label: 'WIN', symbol: '★', color: 'yellow' },
];

export default function WelcomePage({ onNavigate }) {
  return (
    <main
      className="wh-welcome"
      style={{ '--tabletop-image': `url(${tabletopBackground})` }}
      aria-labelledby="welcome-title"
    >
      <div className="wh-welcome__content">
        <section className="wh-welcome__brand" aria-label="Word Harmony introduction">
          <div className="wh-wordmark" id="welcome-title">
            <span>WORD</span>
            <span>HARMONY</span>
            <i className="wh-wordmark__burst wh-wordmark__burst--left" aria-hidden="true" />
            <i className="wh-wordmark__burst wh-wordmark__burst--right" aria-hidden="true" />
          </div>

          <p className="wh-welcome__tagline">Connect words. Outsmart friends.</p>

          <div className="wh-play-cards" aria-label="Think, link, and win">
            {playCards.map((card) => (
              <article className={`wh-play-card wh-play-card--${card.color}`} key={card.label}>
                <span className="wh-play-card__symbol" aria-hidden="true">{card.symbol}</span>
                <strong>{card.label}</strong>
              </article>
            ))}
            <span className="wh-play-cards__arrow wh-play-cards__arrow--one" aria-hidden="true">→</span>
            <span className="wh-play-cards__arrow wh-play-cards__arrow--two" aria-hidden="true">→</span>
          </div>
        </section>

        <section className="wh-welcome__entry" aria-label="Account options">
          <img
            className="wh-welcome__friends"
            src={welcomeFriends}
            alt="Leo, Maya, Noah, and Zoe playing Word Harmony"
          />

          <div className="wh-welcome__face-down-cards" aria-hidden="true">
            <i /><i /><i />
          </div>

          <button
            type="button"
            className="wh-welcome__signin"
            onClick={() => onNavigate('signin')}
          >
            SIGN IN
          </button>

          <p className="wh-welcome__signup">
            New player?
            <button type="button" onClick={() => onNavigate('signup')}>
              CREATE ACCOUNT
            </button>
          </p>
        </section>
      </div>

      <span className="wh-welcome__version" aria-label="Version 1.0">v1.0</span>
    </main>
  );
}
