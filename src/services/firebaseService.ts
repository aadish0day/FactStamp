import {
  auth,
  db,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  COLLECTIONS,
} from '@/lib/firebase'
import type { User, Claim, AppNotification } from '@/lib/types'

/* ── 1. FIREBASE AUTHENTICATION SERVICE ── */

/** Firebase Auth error codes → human-readable messages for the UI */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/user-not-found': 'No account found with this email. Check the address or sign up first.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Incorrect email or password. Please try again.',
  'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error — check your connection and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled before completion.',
  'auth/popup-blocked': 'Google sign-in popup was blocked. Please allow popups for this site.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled in the Firebase console.',
}

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code]
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong. Please try again.'
}

/**
 * Register a new user with Email & Password in Firebase Auth
 * and create their Verifier Profile document in Firestore
 */
export async function signUpWithEmail(name: string, email: string, pass: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass)
  const firebaseUser = userCredential.user

  // Ensure the entered full name is saved directly into Firebase Auth user object
  if (name) {
    try {
      await updateProfile(firebaseUser, { displayName: name })
    } catch (err) {
      console.warn('Could not set Firebase Auth displayName:', err)
    }
  }

  const profileData: User = {
    uid: firebaseUser.uid,
    displayName: name || firebaseUser.displayName || 'Verifier',
    email: firebaseUser.email || email,
    reputation: 50, // Default reputation starting score
    totalVerifications: 0,
    joinedAt: new Date().toISOString(),
  }

  // Store Verifier Profile in Firestore
  await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
    ...profileData,
    createdAt: serverTimestamp(),
  })

  return profileData
}

/**
 * Fetch a verifier profile document from Firestore by uid
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid))
  return snap.exists() ? (snap.data() as User) : null
}

/**
 * Update a verifier profile document in Firestore
 */
export async function updateUserProfile(uid: string, updates: Partial<User>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), updates)
}

/**
 * Sign in existing user with Email & Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass)
  const firebaseUser = userCredential.user

  // Fetch Firestore Verifier Profile
  const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid)
  const snap = await getDoc(userDocRef)

  if (snap.exists()) {
    return snap.data() as User
  }

  // Fallback profile if Firestore doc doesn't exist yet
  const fallbackProfile: User = {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || 'Verifier',
    email: firebaseUser.email || email,
    reputation: 50,
    totalVerifications: 0,
    joinedAt: new Date().toISOString(),
  }

  await setDoc(userDocRef, { ...fallbackProfile, createdAt: serverTimestamp() })
  return fallbackProfile
}

/**
 * Sign in using Google OAuth Provider
 */
export async function signInWithGoogleProvider(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider)
  const firebaseUser = result.user

  const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid)
  const snap = await getDoc(userDocRef)

  if (snap.exists()) {
    return snap.data() as User
  }

  const profileData: User = {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || 'Google Verifier',
    email: firebaseUser.email || '',
    reputation: 50,
    totalVerifications: 0,
    joinedAt: new Date().toISOString(),
  }

  await setDoc(userDocRef, { ...profileData, createdAt: serverTimestamp() })
  return profileData
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth)
}

/**
 * Send a password reset email to the given address
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

/* ── 2. CLOUD FIRESTORE DATABASE SERVICE ── */

/**
 * Strip undefined values before writing to Firestore. The JS SDK rejects
 * `undefined` as an "unsupported field value", and optional fields (imageUrl,
 * verifiedAt, adminFlagged, ...) are frequently absent from local Claim
 * objects — so this keeps consensus + flag writes from throwing.
 */
function withoutUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>
}

/**
 * Add a new claim to Cloud Firestore. Stores the complete claim (including
 * the embedded verifications array) so the realtime subscription can rebuild
 * full Claim objects without extra subcollection reads.
 */
export async function addClaimToFirestore(claimData: Omit<Claim, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.CLAIMS), {
    ...withoutUndefined(claimData as unknown as Record<string, unknown>),
    serverTime: serverTimestamp(),
  })
  return docRef.id
}

// Log a permission-denied rules warning only once per session. The cloud
// project's security rules are the likely culprit (e.g. stale rules deployed
// before firestore.rules allowed consensus updates), so spamming the console
// on every failed write (mount + 60s interval + every verdict) adds no value.
let permissionDeniedWarned = false

/**
 * Overwrite a claim document with a fully-computed Claim object
 * (used after local confidence-score/consensus calculations).
 */
export async function updateClaimInFirestore(claim: Claim): Promise<void> {
  const { id: _id, ...data } = claim
  try {
    await updateDoc(doc(db, COLLECTIONS.CLAIMS, claim.id), {
      ...withoutUndefined(data as unknown as Record<string, unknown>),
      serverTime: serverTimestamp(),
    })
  } catch {
    // Silently handle permission-denied / client ad-blocker stream drops so local state continues smoothly
  }
}

/**
 * Real-time Firestore subscription listener for Claims
 * Enables instantaneous consensus updates across all connected clients
 */
export function subscribeClaimsRealtime(
  callback: (claims: Claim[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(collection(db, COLLECTIONS.CLAIMS), orderBy('createdAt', 'desc'))

  return onSnapshot(
    q,
    (snapshot) => {
      const claims: Claim[] = []
      snapshot.forEach((docSnap) => {
        // Defensively drop any `id` field that might have been stored on the
        // doc in older versions — the real document id always wins.
        const { id: _storedId, ...data } = docSnap.data() as Record<string, unknown>
        claims.push({ id: docSnap.id, ...(data as Omit<Claim, 'id'>) })
      })
      callback(claims)
    },
    (err) => {
      console.warn('Firestore realtime notice (using local state fallback):', err)
      onError?.(err)
    }
  )
}

/**
 * Real-time Firestore subscription listener for Verifier Profiles
 * (users collection), ordered by reputation so leaderboards get the
 * strongest community members first without extra client sorting.
 */
export function subscribeUsersRealtime(
  callback: (users: User[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(collection(db, COLLECTIONS.USERS), orderBy('reputation', 'desc'))

  return onSnapshot(
    q,
    (snapshot) => {
      const users: User[] = []
      snapshot.forEach((docSnap) => {
        // Drop any stored `uid` field — the real document id always wins.
        const { uid: _storedUid, ...data } = docSnap.data() as Record<string, unknown>
        users.push({ uid: docSnap.id, ...(data as Omit<User, 'uid'>) })
      })
      callback(users)
    },
    (err) => {
      console.warn('Firestore users realtime notice:', err)
      onError?.(err)
    }
  )
}

/**
 * Real-time Firestore subscription for a single user's notifications,
 * newest first. Reads are scoped to the authenticated user's own docs.
 */
export function subscribeNotificationsRealtime(
  userId: string,
  callback: (notifications: AppNotification[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications: AppNotification[] = []
      snapshot.forEach((docSnap) => {
        const { id: _storedId, ...data } = docSnap.data() as Record<string, unknown>
        notifications.push({ id: docSnap.id, ...(data as Omit<AppNotification, 'id'>) })
      })
      callback(notifications)
    },
    (err) => {
      console.warn('Firestore notifications realtime notice:', err)
      onError?.(err)
    }
  )
}

/** Mark a single notification as read in Firestore. */
export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), { isRead: true })
}

/** Mark every unread notification for a user as read in Firestore. */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    where('isRead', '==', false)
  )
  const snap = await getDocs(q)
  await Promise.all(
    snap.docs.map((d) => updateDoc(d.ref, { isRead: true }))
  )
}

/**
 * Admin action — flag (or unflag) a claim for expedited review.
 * Flagged claims surface first in the verification queue. Enforced server-side
 * in firestore.rules: only an admin (users/{uid}.isAdmin == true) may change
 * the adminFlagged fields on a claim.
 */
export async function flagClaimForExpeditedReview(
  claimId: string,
  flagged: boolean
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.CLAIMS, claimId), {
    adminFlagged: flagged,
    adminFlaggedAt: flagged ? new Date().toISOString() : null,
  })
}
