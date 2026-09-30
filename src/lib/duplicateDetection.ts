/**
 * Jaccard Similarity — Duplicate Detection Engine
 *
 * Compares the text of a new claim against existing claims
 * using Jaccard similarity: |intersection| / |union|
 * Threshold: 0.75 (claims above this are considered duplicates)
 */

function normalize(text: string): string {
  return text
    .toLowerCase()
    // Remove punctuation. `\w` is ASCII-only, so the old /[^\w\s]/ erased Hindi,
    // Tamil etc. entirely; letters, combining marks and digits of any script stay.
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')      // normalize whitespace
    .trim()
}

function tokenize(text: string): Set<string> {
  return new Set(
    normalize(text)
      .split(/\s+/)
      .filter((word) => word.length > 3) // ignore short words
  )
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a)
  const setB = tokenize(b)

  // Nothing comparable is not evidence of a duplicate. This returned 1 for two
  // empty token sets, which made every non-Latin claim a "100% match".
  if (setA.size === 0 || setB.size === 0) return 0

  let intersection = 0
  for (const word of setA) {
    if (setB.has(word)) intersection++
  }

  const union = setA.size + setB.size - intersection
  return intersection / union
}

export function findDuplicate(
  text: string,
  existingClaims: Array<{ id: string; text: string }>,
  threshold = 0.75
): { id: string; text: string; similarity: number } | null {
  const normalized = normalize(text)

  let bestMatch: { id: string; text: string; similarity: number } | null = null

  for (const claim of existingClaims) {
    const similarity = jaccardSimilarity(normalized, claim.text)
    if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { id: claim.id, text: claim.text, similarity }
    }
  }

  return bestMatch
}
