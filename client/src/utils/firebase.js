import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signInWithCredential,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
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

// Detect if running inside Capacitor (native app)
export const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();

// Smart Google sign-in — native plugin on mobile, popup on web
export async function signInWithGoogle() {
  if (isNative) {
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      const googleUser = await GoogleAuth.signIn();
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      const result = await signInWithCredential(auth, credential);
      return result;
    } catch (e) {
      throw e;
    }
  } else {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  }
}

export {
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};

export default app;
