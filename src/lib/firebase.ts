import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  connectAuthEmulator,
} from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  connectFirestoreEmulator,
} from 'firebase/firestore'

// Firebase Configuration from Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoApiKeyFactStamp2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'factstamp-app.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'factstamp-app',
  // Newer projects use the `.firebasestorage.app` domain, not `.appspot.com`
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'factstamp-app.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:839201948576',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

/** Local Emulator Suite flag — run `npm run emulators` first, then set to true. */
export const useFirebaseEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'

/**
 * True when the app can talk to a Firebase backend: either real (non-demo)
 * web credentials are present, or the Local Emulator Suite is active. Demo
 * placeholder keys (see .env.example) cannot reach the cloud project, so the
 * app gracefully falls back to its in-memory mock data in that case.
 */
const PLACEHOLDER_KEY_MARKERS = ['Demo', 'YOUR_']
function isRealApiKey(key: string | undefined): boolean {
  if (!key) return false
  return !PLACEHOLDER_KEY_MARKERS.some((marker) => key.includes(marker))
}
export const isFirebaseConfigured = useFirebaseEmulators || isRealApiKey(import.meta.env.VITE_FIREBASE_API_KEY)

// Initialize Firebase App instance safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// Core Firebase Services
export const auth = getAuth(app)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
})

// Connect to the Local Emulator Suite when enabled (default ports)
if (useFirebaseEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

// OAuth Providers
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// Firestore Collections Constants
export const COLLECTIONS = {
  USERS: 'users',
  CLAIMS: 'claims',
  VERDICTS: 'verdicts',
  NOTIFICATIONS: 'notifications',
} as const

// Export Auth & Firestore methods for clean service access
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
}
