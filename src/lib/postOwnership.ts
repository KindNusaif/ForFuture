import { isPollMovement } from './movements'
import { isPetitionMovement } from './petitions'
import { isReliefPost } from './reliefHub'
import { isYouthVoicePost } from './postIdentity'
import type { Post } from '../types'

export type ContributionFilter =
  | 'all'
  | 'youth_voice'
  | 'petition'
  | 'poll'
  | 'volunteer'
  | 'relief'
  | 'other'

export type ContributionStatus = 'active' | 'closed'

/** True when the signed-in user created this post (uses owner-visible user_id). */
export function isPostOwner(
  post: Pick<Post, 'user_id'>,
  currentUserId: string | undefined,
): boolean {
  return Boolean(currentUserId && post.user_id && post.user_id === currentUserId)
}

export function getContributionFilter(post: Post): ContributionFilter {
  if (isYouthVoicePost(post)) return 'youth_voice'
  if (isPetitionMovement(post.movement_type)) return 'petition'
  if (isPollMovement(post.movement_type)) return 'poll'
  if (post.movement_type === 'volunteer_drive') return 'volunteer'
  if (isReliefPost(post)) return 'relief'
  return 'other'
}

export function getContributionStatus(post: Post): ContributionStatus {
  if (post.petition_closing_date) {
    const closes = new Date(post.petition_closing_date)
    if (!Number.isNaN(closes.getTime()) && closes < new Date()) return 'closed'
  }
  const relief = post.relief_status?.toLowerCase()
  if (relief === 'closed' || relief === 'fulfilled' || relief === 'completed') {
    return 'closed'
  }
  return 'active'
}

export function filterContributions(posts: Post[], filter: ContributionFilter): Post[] {
  if (filter === 'all') return posts
  return posts.filter((p) => getContributionFilter(p) === filter)
}

export function countContributionsByFilter(posts: Post[]): Record<ContributionFilter, number> {
  const counts: Record<ContributionFilter, number> = {
    all: posts.length,
    youth_voice: 0,
    petition: 0,
    poll: 0,
    volunteer: 0,
    relief: 0,
    other: 0,
  }
  for (const post of posts) {
    counts[getContributionFilter(post)] += 1
  }
  return counts
}
