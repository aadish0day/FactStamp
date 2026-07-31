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
  connectAuthEmulator,
} from 'firebase/auth'
import {
  getFirestore,
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
import { getStorage, ref, uploadBytes, getDownloadURL, connectStorageEmulator } from 'firebase/storage'

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
export const db = getFirestore(app)
export const storage = getStorage(app)

// Connect to the Local Emulator Suite when enabled (default ports)
if (useFirebaseEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
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

/**
 * Upload a screenshot file to Firebase Storage.
 *
 * Returns a real `https://` download URL, or `null` when the upload fails.
 * We deliberately do NOT fall back to a blob preview URL: blob URLs are
 * session-scoped, so persisting one as a claim's `imageUrl` would show broken
 * images for other users and on page reload. Local preview is handled
 * separately by the caller via `URL.createObjectURL` (never written to DB).
 * @param file The image file selected by the user
 * @param path Storage folder path (default: 'claim_screenshots')
 */
/**
 * Compresses an image file client-side using HTML5 Canvas and converts it
 * to a lightweight Base64 JPEG string (~30-60 KB). This eliminates any
 * external storage service dependencies or bucket configuration entirely!
 *
 * @param file The image file selected by the user
 */
export async function uploadScreenshotToStorage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_DIMENSION = 800 // Resizes large screenshots to max 800px
          let width = img.width
          let height = img.height

          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width)
              width = MAX_DIMENSION
            } else {
              width = Math.round((width * MAX_DIMENSION) / height)
              height = MAX_DIMENSION
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) return resolve(null)

          ctx.drawImage(img, 0, 0, width, height)
          // Compress image to JPEG format at 70% quality (~30-60 KB string)
          const base64DataUrl = canvas.toDataURL('image/jpeg', 0.7)
          resolve(base64DataUrl)
        }
        img.onerror = () => resolve(null)
        img.src = e.target?.result as string
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    } catch (err) {
      console.warn('Canvas image compression failed:', err)
      resolve(null)
    }
  })
}

// Export Auth & Firestore methods for clean service access
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
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
