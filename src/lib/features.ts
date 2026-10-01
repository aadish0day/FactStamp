/**
 * Off for now: anyone signed in may submit and vote without verifying their
 * email. To turn it back on, set this to true AND restore the check in
 * isVerifiedEmail() in firestore.rules, then deploy the rules.
 */
export const EMAIL_VERIFICATION_REQUIRED = false

/**
 * Reputation is awarded by the `awardVerificationReputation` Cloud Function,
 * which needs the Blaze plan. Until it is deployed, UI must not promise
 * reputation gains. Set VITE_REPUTATION_ENABLED=true once the function is live.
 */
export const REPUTATION_ENABLED = import.meta.env.VITE_REPUTATION_ENABLED === 'true'

/**
 * Seeded demo claims use short ids (c1, c2, …); real claims get Firestore
 * auto-ids. Demo claims and their persona verifiers are labelled as examples.
 */
export function isDemoClaim(claimId: string): boolean {
  return /^c\d+$/.test(claimId)
}
