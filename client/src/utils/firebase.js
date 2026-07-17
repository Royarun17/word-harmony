import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBGYOMUU9gjtOpybtT4Tsczu9nfkC34vKs",
  authDomain: "synapse-game-6dd64.firebaseapp.com",
  projectId: "synapse-game-6dd64",
  storageBucket: "synapse-game-6dd64.firebasestorage.app",
  messagingSenderId: "586659045092",
  appId: "1:586659045092:web:f834d5de0a3a6f0108d6f1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
};

export default app;
