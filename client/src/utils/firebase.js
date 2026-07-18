import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged,
  RecaptchaVerifier, signInWithPhoneNumber
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Detect mobile/Capacitor environment
export const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  || window.Capacitor !== undefined;

// Use redirect on mobile (avoids sessionStorage issues), popup on desktop
export async function signInWithGoogle() {
  if (isMobile) {
    await signInWithRedirect(auth, googleProvider);
    return null; // result comes via getRedirectResult
  } else {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  }
}

export {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
};

export default app;
