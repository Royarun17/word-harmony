import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signInWithCredential,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged,
  RecaptchaVerifier, signInWithPhoneNumber,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Detect if running inside Capacitor native app
export const isNative = typeof window !== 'undefined' &&
  typeof window.Capacitor !== 'undefined' &&
  window.Capacitor?.isNativePlatform?.() === true;

// Google sign-in — popup on web, native plugin on Android
// Native plugin loaded dynamically to avoid build errors on web
export async function signInWithGoogle() {
  if (isNative) {
    try {
      // eslint-disable-next-line
      const { GoogleAuth } = await import(/* webpackIgnore: true */ '@codetrix-studio/capacitor-google-auth');
      const googleUser = await GoogleAuth.signIn();
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      return await signInWithCredential(auth, credential);
    } catch (e) {
      throw e;
    }
  }
  return await signInWithPopup(auth, googleProvider);
}

export {
  signInWithPopup,
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
};

export default app;
