export function sourceQuality(url) {
  if (!url) return { score: 0, level: "none" };
  const u = url.toLowerCase();
  if (
    u.includes("who.int") ||
    u.includes("gov.in") ||
    u.includes("mohfw") ||
    u.includes("wikipedia.org") ||
    u.includes("un.org") ||
    u.includes("rbi.org.in") ||
    u.includes("sci.gov.in") ||
    u.includes("pib.gov")
  ) {
    return { score: 100, level: "high" };
  }
  if (
    u.includes("ndtv") ||
    u.includes("bbc") ||
    u.includes("thehindu") ||
    u.includes("reuters") ||
    u.includes("indianexpress") ||
    u.includes("timesofindia") ||
    u.includes(".org") ||
    u.includes(".edu")
  ) {
    return { score: 70, level: "medium" };
  }
  return { score: 25, level: "low" };
}

export function computeConfidence(verdicts, sourceUrl) {
  if (!verdicts || verdicts.length === 0) return 0;
  const total = verdicts.length;
  const counts = {};
  for (const v of verdicts) counts[v.verdict] = (counts[v.verdict] || 0) + 1;
  const topVerdict = Object.keys(counts).sort(
    (a, b) => counts[b] - counts[a],
  )[0];
  const agreementRatio = counts[topVerdict] / total;

  const avgRep =
    verdicts.reduce((s, v) => s + (v.verifierReputation || 50), 0) / total;

  const sq = sourceQuality(sourceUrl).score;

  const score = agreementRatio * 40 + (avgRep / 100) * 30 + (sq / 100) * 30;

  return Math.round(Math.max(0, Math.min(100, score * 100)) / 1);
}

export function consensusVerdict(verdicts) {
  const counts = {};
  for (const v of verdicts) counts[v.verdict] = (counts[v.verdict] || 0) + 1;
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  const resolved = verdicts.length >= 3 && counts[top] / verdicts.length > 0.5;
  return {
    verdict: top,
    resolved,
    contested: verdicts.length >= 3 && counts[top] / verdicts.length <= 0.5,
  };
}
