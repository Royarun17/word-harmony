import React from 'react';
import welcomeReference from '../assets/welcome-reference.png';
import './WelcomePage.css';

export default function WelcomePage({ onNavigate }) {
  return (
    <main className="wh-welcome" aria-label="Word Harmony welcome page">
      <div className="wh-welcome__stage">
        <img
          className="wh-welcome__reference"
          src={welcomeReference}
          alt="Word Harmony tabletop with four friends and Think, Link, Win cards"
        />

        <button
          type="button"
          className="wh-welcome__hotspot wh-welcome__hotspot--signin"
          aria-label="Sign in"
          onClick={() => onNavigate('signin')}
        />

        <button
          type="button"
          className="wh-welcome__hotspot wh-welcome__hotspot--signup"
          aria-label="Create account"
          onClick={() => onNavigate('signup')}
        />
      </div>
    </main>
  );
}
