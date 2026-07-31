/**
 * Weighted Confidence Scoring Algorithm
 *
 * 3-component formula:
 *   Confidence = (agreementRatio × 40) + (avgReputation × 30) + (sourceQuality × 30)
 *
 * All inputs are 0–100 scale.
 */

export function calculateConfidenceScore(
  verifications: Array<{
    verdict: string
    verifierReputation: number
    sourceQuality: number // 0–100
  }>
): {
  score: number
  agreementRatio: number
  avgReputation: number
  sourceQualityScore: number
} {
  if (verifications.length === 0) {
    return { score: 0, agreementRatio: 0, avgReputation: 0, sourceQualityScore: 0 }
  }

  // 1. Agreement ratio: How many verifications agree with the majority verdict
  const verdicts = verifications.map((v) => v.verdict)
  const majorityCount = Math.max(
    ...Array.from(new Set(verdicts)).map(
      (v) => verdicts.filter((x) => x === v).length
    )
  )
  const agreementRatio = (majorityCount / verifications.length) * 100

  // 2. Average reputation of all verifiers
  const avgReputation =
    verifications.reduce((sum, v) => sum + v.verifierReputation, 0) /
    verifications.length

  // 3. Source quality score (average)
  const sourceQualityScore =
    verifications.reduce((sum, v) => sum + v.sourceQuality, 0) /
    verifications.length

  // Weighted calculation
  const score = Math.round(
    agreementRatio * 0.4 + avgReputation * 0.3 + sourceQualityScore * 0.3
  )

  return {
    score: Math.min(100, Math.max(0, score)),
    agreementRatio,
    avgReputation,
    sourceQualityScore,
  }
}

/**
 * Determine source quality from URL domain
 * Returns: 'high' | 'medium' | 'low'
 */
export function determineSourceQuality(url: string): 'high' | 'medium' | 'low' {
  try {
    const domain = new URL(url).hostname.toLowerCase()

    // High-quality sources
    const highQuality = [
      'who.int',
      'nih.gov',
      'ncbi.nlm.nih.gov',
      'pib.gov.in',
      'eci.gov.in',
      'mohfw.gov.in',
      'icmr.gov.in',
      'ayush.gov.in',
      'ceodelhi.gov.in',
      'wikipedia.org',
      'indiacode.nic.in',
      'rbi.org.in',
    ]

    // Medium-quality sources
    const mediumQuality = [
      'timesofindia.indiatimes.com',
      'indianexpress.com',
      'thehindu.com',
      'bbc.com',
      'bbc.in',
      'reuters.com',
      'apnews.com',
      'ndtv.com',
      'economictimes.com',
      'factcheck.org',
      'iitm.org',
      'snopes.com',
    ]

    if (highQuality.some((hq) => domain.includes(hq))) return 'high'
    if (mediumQuality.some((mq) => domain.includes(mq))) return 'medium'
    return 'low'
  } catch {
    return 'low'
  }
}

/**
 * Convert source quality string to numeric score (0–100)
 */
export function sourceQualityToScore(quality: 'high' | 'medium' | 'low'): number {
  switch (quality) {
    case 'high':
      return 100
    case 'medium':
      return 70
    case 'low':
      return 30
  }
}
