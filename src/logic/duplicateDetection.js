import { normalizeText } from './normalizeText.js';

const HINDI_STOP_WORDS = new Set([
  'है', 'हैं', 'और', 'के', 'का', 'की', 'में', 'से', 'को', 'पर', 'एक', 'यह', 'वह',
  'जो', 'कि', 'भी', 'तो', 'अपने', 'सभी', 'कोई', 'इस', 'उस', 'बहुत', 'जैसे', 'आज',
]);

function tokenize(text) {
  return normalizeText(text)
    .split(' ')
    .filter((w) => w.length > 3 && !HINDI_STOP_WORDS.has(w));
}

export function jaccardSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

export function detectDuplicate(text, claims, threshold = 0.35) {
  let best = null;
  let bestScore = 0;
  for (const claim of claims) {
    const score = jaccardSimilarity(text, claim.text);
    if (score > bestScore) {
      bestScore = score;
      best = claim;
    }
  }
  const isDuplicate = bestScore >= threshold;
  return { isDuplicate, matchedClaim: isDuplicate ? best : null, score: bestScore };
}
