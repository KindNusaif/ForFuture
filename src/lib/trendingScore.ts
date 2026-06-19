/** Time-decayed engagement score — no personalization, simple math only. */

export interface TrendingScoreInput {
  createdAt: string | Date
  /** Petition signatures (weighted higher). */
  signatureCount?: number
  /** Generic support / participation count. */
  supportCount?: number
  likeCount?: number
}

/**
 * Score = (signatures × 3 + likes × 1) ÷ hoursOld^1.5
 * Higher signatures weigh more; older content naturally falls.
 */
export function calculateTrendingScore(item: TrendingScoreInput): number {
  const ageMs = Date.now() - new Date(item.createdAt).getTime()
  const hoursOld = Math.max(ageMs / (1000 * 60 * 60), 0.5)
  const signatures = item.signatureCount ?? 0
  const support = item.supportCount ?? 0
  const likes = item.likeCount ?? 0
  const engagement = Math.max(signatures, support) * 3 + likes
  if (engagement <= 0) return 0
  return engagement / Math.pow(hoursOld, 1.5)
}
