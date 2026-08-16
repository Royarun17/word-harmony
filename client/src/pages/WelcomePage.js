import React from 'react';
import lightRoom from '../assets/welcome/light/room.webp';
import lightTabletop from '../assets/welcome/light/tabletop.webp';
import leftProps from '../assets/welcome/light/left-props.webp';
import cardDeck from '../assets/welcome/light/card-deck-v2.webp';
import flowerPot from '../assets/welcome/light/flower-pot-v2.webp';
import logo from '../assets/welcome/word-harmony-logo.webp';
import tagline from '../assets/welcome/tagline-ribbon.webp';
import thinkCard from '../assets/welcome/think-card.webp';
import linkCard from '../assets/welcome/link-card.webp';
import winCard from '../assets/welcome/win-card.webp';
import leo from '../assets/welcome/light/leo-seated.webp';
import maya from '../assets/welcome/light/maya-seated.webp';
import noah from '../assets/welcome/light/noah-seated.webp';
import zoe from '../assets/welcome/light/zoe-seated.webp';
import './WelcomePage.css';

export default function WelcomePage({ onNavigate }) {
  return (
    <main className="wh-welcome">
      <img className="wh-layer wh-layer--room" src={lightRoom} alt="" aria-hidden="true" />

      <section className="wh-stage" aria-label="Word Harmony welcome screen">
        <img className="wh-layer wh-layer--table" src={lightTabletop} alt="" aria-hidden="true" />

        <div className="wh-stage__characters" aria-label="Four friends holding Word Harmony cards">
          <span className="wh-contact-shadow wh-contact-shadow--leo" aria-hidden="true" />
          <span className="wh-contact-shadow wh-contact-shadow--maya" aria-hidden="true" />
          <span className="wh-contact-shadow wh-contact-shadow--noah" aria-hidden="true" />
          <span className="wh-contact-shadow wh-contact-shadow--zoe" aria-hidden="true" />
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
          <img className="wh-game-card wh-game-card--link" src={linkCard} alt="Link — Connect and build" />
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

        <div className="wh-stage__decor" aria-hidden="true">
          <img className="wh-table-props wh-table-props--left" src={leftProps} alt="" />
          <img className="wh-table-props wh-table-props--deck" src={cardDeck} alt="" />
          <img className="wh-table-props wh-table-props--pot" src={flowerPot} alt="" />
        </div>
      </section>
    </main>
  );
}
