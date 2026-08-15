import React from 'react';
import tableRoom from '../assets/welcome/table-room.webp';
import logo from '../assets/welcome/word-harmony-logo.webp';
import tagline from '../assets/welcome/tagline-ribbon.webp';
import thinkCard from '../assets/welcome/think-card.webp';
import linkCard from '../assets/welcome/link-card.webp';
import winCard from '../assets/welcome/win-card.webp';
import leo from '../assets/welcome/leo-v2.webp';
import maya from '../assets/welcome/maya-v2.webp';
import noah from '../assets/welcome/noah-v2.webp';
import zoe from '../assets/welcome/zoe-v2.webp';
import './WelcomePage.css';

export default function WelcomePage({ onNavigate }) {
  return (
    <main className="wh-welcome">
      <img className="wh-welcome__backdrop" src={tableRoom} alt="" aria-hidden="true" />

      <section className="wh-stage" aria-label="Word Harmony welcome screen">
        <img className="wh-stage__room" src={tableRoom} alt="" aria-hidden="true" />

        <div className="wh-stage__characters" aria-label="Four friends holding Word Harmony cards">
          <img className="wh-character wh-character--leo" src={leo} alt="Leo holding three cards" />
          <img className="wh-character wh-character--maya" src={maya} alt="Maya holding three cards" />
          <img className="wh-character wh-character--noah" src={noah} alt="Noah holding three cards" />
          <img className="wh-character wh-character--zoe" src={zoe} alt="Zoe holding four cards" />
        </div>

        <header className="wh-stage__brand">
          <h1 className="wh-visually-hidden">Word Harmony</h1>
          <img className="wh-stage__logo" src={logo} alt="Word Harmony" />
          <img
            className="wh-stage__tagline"
            src={tagline}
            alt="Connect words. Outsmart friends."
          />
        </header>

        <div className="wh-stage__cards" aria-label="Think, Link, Win">
          <img className="wh-game-card wh-game-card--think" src={thinkCard} alt="Think — Brainstorm clever words" />
          <span className="wh-card-arrow wh-card-arrow--blue" aria-hidden="true">➜</span>
          <img className="wh-game-card wh-game-card--link" src={linkCard} alt="Link — Connect and build" />
          <span className="wh-card-arrow wh-card-arrow--red" aria-hidden="true">➜</span>
          <img className="wh-game-card wh-game-card--win" src={winCard} alt="Win — Outsmart and victory" />
        </div>

        <div className="wh-stage__actions">
          <button
            className="wh-create-account"
            type="button"
            onClick={() => onNavigate('signup')}
          >
            CREATE ACCOUNT
          </button>
          <p className="wh-sign-in">
            Already have an account?{' '}
            <button type="button" onClick={() => onNavigate('signin')}>SIGN IN</button>
          </p>
        </div>
      </section>
    </main>
  );
}
