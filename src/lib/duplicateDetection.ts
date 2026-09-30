/**
 * Jaccard Similarity — Duplicate Detection Engine
 *
 * Compares the text of a new claim against existing claims
 * using Jaccard similarity: |intersection| / |union|
 * Threshold: 0.75 (claims above this are considered duplicates)
 *
 * Tokens are normalised first (case, punctuation/emoji, chat abbreviations,
 * stopwords, plural "s") so light rewording of the same forward still matches.
 */

const ABBREVIATIONS: Record<string, string> = {
  hr: 'hour', hrs: 'hours', min: 'minute', mins: 'minutes', govt: 'government',
  msg: 'message', pls: 'please', plz: 'please', u: 'you', ur: 'your', r: 'are',
  bcoz: 'because', coz: 'because', b4: 'before', dr: 'doctor', drs: 'doctors',
}

// ponytail: English-only stopwords; add per-language lists if Hindi claims start colliding
const STOPWORDS = new Set(
  ('a an the and or but if of to in on at by for with from as is are was were be been being ' +
    'it its this that these those can could will would should may might must do does did ' +
    'has have had not no so very just some any all your you our we they he she i my me ' +
    'please also only then than there here who what when which how about into up out ' +
    // WhatsApp forwarding boilerplate carries no claim content
    'forward forwarded share send everyone family friends group groups')
    .split(' ')
)

function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    // Remove punctuation and emoji. `\w` is ASCII-only, so the old /[^\w\s]/ erased Hindi,
    // Tamil etc. entirely; letters, combining marks and digits of any script stay.
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')      // normalize whitespace
    .trim()
}

function tokenize(text: string): Set<string> {
  const tokens = new Set<string>()
  for (const raw of normalize(text).split(' ')) {
    const word = ABBREVIATIONS[raw] ?? raw
    if (!word || STOPWORDS.has(word)) continue
    // Crude plural folding: "hours"/"hour", "symptoms"/"symptom".
    tokens.add(word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word)
  }
  return tokens
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
