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
import type { User, Claim, AppNotification, ClaimCategory, Verdict, SourceQuality } from '@/lib/types'

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
 * Uses setDoc with merge when document may not exist yet in Firestore (e.g. seed claims).
 */
export async function updateClaimInFirestore(claim: Claim): Promise<void> {
  const { id: _id, ...data } = claim
  try {
    const docRef = doc(db, COLLECTIONS.CLAIMS, claim.id)
    const snap = await getDoc(docRef)
    const sanitizedData = {
      ...withoutUndefined(data as unknown as Record<string, unknown>),
      serverTime: serverTimestamp(),
    }
    if (snap.exists()) {
      await updateDoc(docRef, sanitizedData)
    } else {
      await setDoc(docRef, sanitizedData)
    }
  } catch (err) {
    console.warn('Firestore claim update notice:', err)
  }
}

/** Helper to parse Firestore Timestamp, ISO string, or number to ISO string. */
function parseTimestamp(val: unknown): string {
  if (!val) return new Date().toISOString()
  if (typeof val === 'string') return val
  if (typeof val === 'number') return new Date(val).toISOString()
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>
    if (typeof obj.toDate === 'function') {
      try {
        return (obj.toDate as () => Date)().toISOString()
      } catch {}
    }
    if (typeof obj.seconds === 'number') {
      return new Date(obj.seconds * 1000).toISOString()
    }
    if (typeof obj._seconds === 'number') {
      return new Date(obj._seconds * 1000).toISOString()
    }
  }
  return new Date().toISOString()
}

/**
 * Robustly normalizes raw Firestore document data into a clean Claim object.
 * Handles Timestamps, case variations, missing fields, and field alias fallbacks.
 */
export function mapFirestoreDocToClaim(docId: string, data: Record<string, unknown>): Claim {
  const text = typeof data.text === 'string'
    ? data.text
    : typeof data.claimText === 'string'
    ? data.claimText
    : typeof data.title === 'string'
    ? data.title
    : 'No text provided'

  const rawCat = typeof data.category === 'string' ? data.category.toLowerCase().trim() : 'other'
  const category: ClaimCategory = ['health', 'political', 'financial', 'religious', 'other'].includes(rawCat)
    ? (rawCat as ClaimCategory)
    : 'other'

  const rawVerifications = Array.isArray(data.verifications) ? data.verifications : []
  const verifications = rawVerifications.map((v: Record<string, unknown>, idx: number) => ({
    id: typeof v.id === 'string' ? v.id : `v_${docId}_${idx}`,
    claimId: docId,
    verdict: (typeof v.verdict === 'string' ? v.verdict.toUpperCase() : 'UNVERIFIABLE') as Verdict,
    sourceUrl: typeof v.sourceUrl === 'string' ? v.sourceUrl : '',
    sourceQuality: (typeof v.sourceQuality === 'string' ? v.sourceQuality.toLowerCase() : 'medium') as SourceQuality,
    explanation: typeof v.explanation === 'string' ? v.explanation : '',
    verifierId: typeof v.verifierId === 'string' ? v.verifierId : '',
    verifierName: typeof v.verifierName === 'string' ? v.verifierName : 'Community Verifier',
    verifierReputation: typeof v.verifierReputation === 'number' ? v.verifierReputation : 50,
    createdAt: parseTimestamp(v.createdAt),
  }))

  const verificationCount = typeof data.verificationCount === 'number'
    ? data.verificationCount
    : verifications.length

  const rawStatus = typeof data.status === 'string' ? data.status.toLowerCase().trim() : ''
  const status: 'pending' | 'verified' = rawStatus === 'verified'
    ? 'verified'
    : rawStatus === 'pending'
    ? 'pending'
    : verificationCount >= 3
    ? 'verified'
    : 'pending'

  const createdAt = parseTimestamp(data.createdAt || data.serverTime)
  const defaultDeadline = new Date(new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const consensusDeadline = parseTimestamp(data.consensusDeadline || defaultDeadline)

  return {
    id: docId,
    text,
    category,
    status,
    verifications,
    verificationCount,
    createdAt,
    consensusDeadline,
    submittedBy: typeof data.submittedBy === 'string' ? data.submittedBy : 'u1',
    submittedByName: typeof data.submittedByName === 'string' ? data.submittedByName : 'Community User',
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : undefined,
    verdict: typeof data.verdict === 'string' ? (data.verdict.toUpperCase() as Verdict) : undefined,
    confidenceScore: typeof data.confidenceScore === 'number' ? data.confidenceScore : undefined,
    agreementRatio: typeof data.agreementRatio === 'number' ? data.agreementRatio : undefined,
    avgVerifierReputation: typeof data.avgVerifierReputation === 'number' ? data.avgVerifierReputation : undefined,
    sourceQualityScore: typeof data.sourceQualityScore === 'number' ? data.sourceQualityScore : undefined,
    adminFlagged: typeof data.adminFlagged === 'boolean' ? data.adminFlagged : undefined,
    adminFlaggedAt: data.adminFlaggedAt ? parseTimestamp(data.adminFlaggedAt) : undefined,
    verifiedAt: data.verifiedAt ? parseTimestamp(data.verifiedAt) : undefined,
  }
}

/**
 * Fetch a single claim document from Cloud Firestore by ID.
 */
export async function getSingleClaimFromFirestore(claimId: string): Promise<Claim | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.CLAIMS, claimId))
    if (snap.exists()) {
      return mapFirestoreDocToClaim(snap.id, snap.data() as Record<string, unknown>)
    }
  } catch (err) {
    console.warn('Could not fetch single claim from Firestore:', err)
  }
  return null
}

/**
 * Real-time Firestore subscription listener for Claims
 * Enables instantaneous consensus updates across all connected clients
 */
export function subscribeClaimsRealtime(
  callback: (claims: Claim[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const claimsRef = collection(db, COLLECTIONS.CLAIMS)
  const q = query(claimsRef, orderBy('createdAt', 'desc'))

  return onSnapshot(
    q,
    (snapshot) => {
      const claims: Claim[] = []
      snapshot.forEach((docSnap) => {
        claims.push(mapFirestoreDocToClaim(docSnap.id, docSnap.data() as Record<string, unknown>))
      })
      callback(claims)
    },
    (err) => {
      console.warn('Realtime ordered query notice, falling back to simple listener:', err)
      return onSnapshot(
        claimsRef,
        (snapshot) => {
          const claims: Claim[] = []
          snapshot.forEach((docSnap) => {
            claims.push(mapFirestoreDocToClaim(docSnap.id, docSnap.data() as Record<string, unknown>))
          })
          claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          callback(claims)
        },
        (fallbackErr) => {
          console.warn('Firestore realtime fallback notice:', fallbackErr)
          onError?.(fallbackErr)
        }
      )
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
