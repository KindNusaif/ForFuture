import { formatEventDate } from './movements'
import type { Post } from '../types'

export function isPetitionMovement(
  type: Post['movement_type'] | string,
): type is 'youth_petition' {
  return type === 'youth_petition'
}

/** Today at UTC midnight for date-only comparison */
function todayDateOnly(): string {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

export function isPetitionClosed(post: Pick<Post, 'petition_closing_date'>): boolean {
  if (!post.petition_closing_date) return false
  return post.petition_closing_date < todayDateOnly()
}

export function getPetitionClosingLabel(
  closingDate: string | null | undefined,
): string | null {
  if (!closingDate) return null
  const formatted = formatEventDate(closingDate)
  if (!formatted) return null
  if (closingDate < todayDateOnly()) return `Closed on ${formatted}`
  return `Open until ${formatted}`
}

export function getPetitionProgressPercent(
  supporterCount: number,
  goal: number | null | undefined,
): number | null {
  if (goal == null || goal <= 0) return null
  return Math.min(100, Math.round((supporterCount / goal) * 100))
}

export function formatPetitionSupporterCount(count: number, goal?: number | null): string {
  if (goal != null && goal > 0) {
    return `${count} / ${goal} Youth Supporters`
  }
  return `${count} ${count === 1 ? 'Youth Supporter' : 'Youth Supporters'}`
}

export const PETITION_DISCLAIMER =
  'Community advocacy on ForFuture — not a government-verified or legally binding signature system.'
