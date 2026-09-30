import { initializeApp, getApps, getApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup as firebaseSignInWithPopup,
  type Auth,
  type AuthProvider,
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
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  deleteField,
  writeBatch,
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
const useFirebaseEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'

/**
 * True when the app can talk to a Firebase backend: either real (non-demo)
 * web credentials are present, or the Local Emulator Suite is active. Demo
 * placeholder keys (see .env.example) cannot reach the cloud project, so the
 * app gracefully falls back to its in-memory mock data in that case.
 */
export const isFirebaseConfigured = true

// Initialize Firebase App instance safely
const isFreshApp = !getApps().length
const app = isFreshApp ? initializeApp(firebaseConfig) : getApp()

// App Check: attests requests come from this site, so the public API key can't
// be reused by scripts. Off unless VITE_APPCHECK_SITE_KEY is set, and skipped on
// the emulators (they don't verify tokens). Must run before Auth/Firestore
// make their first request, hence a static import rather than a lazy one.
// reCAPTCHA v3 (not Enterprise): free with no Cloud billing — fits the Spark plan.
const appCheckSiteKey = import.meta.env.VITE_APPCHECK_SITE_KEY
if (appCheckSiteKey && !useFirebaseEmulators) {
  if (import.meta.env.DEV) {
    // `true` makes the SDK print a debug token to register in the console;
    // a pre-registered token can be supplied via VITE_APPCHECK_DEBUG_TOKEN.
    ;(self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN ??=
      import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || true
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  })
}

// Core Firebase Services
// Same persistence chain as getAuth(), minus the popup/redirect resolver: with
// it, Auth eagerly loads <authDomain>/__/auth/iframe.js (~95 KB) plus gapi and a
// getProjectConfig call on every mobile/Safari page view. The resolver is instead passed per
// call in signInWithPopup below. Add it back here if signInWithRedirect or
// getRedirectResult are ever used.
// initializeAuth throws if called twice on one app (e.g. module re-run by HMR).
export const auth = isFreshApp
  ? initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
    })
  : getAuth(app)

export const signInWithPopup = (a: Auth, provider: AuthProvider) =>
  firebaseSignInWithPopup(a, provider, browserPopupRedirectResolver)
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
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
  CLAIM_MEDIA: 'claim_media',
  VERDICTS: 'verdicts',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports',
  AUDIT_LOGS: 'audit_logs',
  DELETED_USERS: 'deleted_users',
} as const

// Export Auth & Firestore methods for clean service access
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  deleteField,
  writeBatch,
}

