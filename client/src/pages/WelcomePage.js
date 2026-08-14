import React from 'react';
import welcomeReference from '../assets/welcome-reference.webp';
import './WelcomePage.css';

export default function WelcomePage({ onNavigate }) {
  return (
    <main className="wh-welcome" aria-label="Word Harmony welcome page">
      <div
        className="wh-welcome__stage"
        role="img"
        aria-label="Word Harmony tabletop with four friends and Think, Link, Win cards"
        style={{ backgroundImage: `url(${welcomeReference})` }}
      >

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
