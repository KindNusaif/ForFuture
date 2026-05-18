import { fetchFollowedMovementIds } from './movementFollows'
import { fetchPostById, fetchPostsByUser } from './posts'
import { isPollMovement } from './movements'
import { isPetitionMovement } from './petitions'
import { enhanceSupabaseError, isMissingRelation } from './supabaseErrors'
import { requireSupabase } from './supabase'
import { DEFAULT_REQUEST_TIMEOUT_MS, withTimeout } from './supabaseRequest'
import type { Category, Post } from '../types'

export interface ImpactSummary {
  movementsFollowed: number
  petitionsSigned: number
  volunteerDrivesJoined: number
  causesSupported: number
}

export interface ImpactActivityItem {
  id: string
  kind: 'follow' | 'support' | 'petition' | 'volunteer' | 'created'
  title: string
  movementTitle: string
  at: string
  href: string
}

export interface CauseBreakdownItem {
  category: Category | string
  count: number
}

interface UserActionRow {
  post_id: string
  created_at?: string
}

async function fetchUserActionRows(userId: string): Promise<UserActionRow[]> {
  const client = requireSupabase()
  try {
    const { data, error } = await withTimeout(
      client
        .from('post_actions')
        .select('post_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(40),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )
    if (error) throw error
    return (data ?? []) as UserActionRow[]
  } catch (err) {
    if (!isMissingRelation(err)) throw enhanceSupabaseError(err)
    const { data, error } = await withTimeout(
      client
        .from('supports')
        .select('post_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(40),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )
    if (error) throw enhanceSupabaseError(err)
    return (data ?? []) as UserActionRow[]
  }
}

export async function loadImpactDashboard(userId: string): Promise<{
  summary: ImpactSummary
  activities: ImpactActivityItem[]
  causeBreakdown: CauseBreakdownItem[]
}> {
  const [followedIds, myPosts, actionRows] = await Promise.all([
    fetchFollowedMovementIds(userId),
    fetchPostsByUser(userId),
    fetchUserActionRows(userId),
  ])

  const postMap = new Map<string, Post>()
  for (const p of myPosts) postMap.set(p.id, p)

  const missingIds = [...new Set(actionRows.map((r) => r.post_id))].filter((id) => !postMap.has(id))
  await Promise.all(
    missingIds.slice(0, 20).map(async (id) => {
      const post = await fetchPostById(id, userId)
      if (post) postMap.set(id, post)
    }),
  )

  let petitionsSigned = 0
  let volunteerDrivesJoined = 0
  let causesSupported = 0
  const activities: ImpactActivityItem[] = []

  for (const row of actionRows) {
    const post = postMap.get(row.post_id)
    if (!post) continue
    causesSupported += 1
    const at = row.created_at ?? post.created_at

    if (isPetitionMovement(post.movement_type)) {
      petitionsSigned += 1
      activities.push({
        id: `petition-${row.post_id}`,
        kind: 'petition',
        title: 'Signed petition',
        movementTitle: post.title,
        at,
        href: `/feed/${post.id}`,
      })
    } else if (post.movement_type === 'volunteer_drive') {
      volunteerDrivesJoined += 1
      activities.push({
        id: `volunteer-${row.post_id}`,
        kind: 'volunteer',
        title: 'Joined volunteer drive',
        movementTitle: post.title,
        at,
        href: `/feed/${post.id}`,
      })
    } else if (!isPollMovement(post.movement_type)) {
      activities.push({
        id: `support-${row.post_id}`,
        kind: 'support',
        title: 'Supported movement',
        movementTitle: post.title,
        at,
        href: `/feed/${post.id}`,
      })
    }
  }

  for (const post of myPosts.slice(0, 5)) {
    activities.push({
      id: `created-${post.id}`,
      kind: 'created',
      title: 'Created movement',
      movementTitle: post.title,
      at: post.created_at,
      href: `/feed/${post.id}`,
    })
  }

  activities.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  const categoryCounts = new Map<string, number>()
  for (const post of postMap.values()) {
    categoryCounts.set(post.category, (categoryCounts.get(post.category) ?? 0) + 1)
  }

  return {
    summary: {
      movementsFollowed: followedIds.length,
      petitionsSigned,
      volunteerDrivesJoined,
      causesSupported,
    },
    activities: activities.slice(0, 12),
    causeBreakdown: [...categoryCounts.entries()].map(([category, count]) => ({
      category,
      count,
    })),
  }
}

export function encouragementMessage(summary: ImpactSummary): string {
  const total = summary.causesSupported + summary.movementsFollowed
  if (total === 0) {
    return 'Your impact journey starts with your first action.'
  }
  if (summary.causesSupported >= 8) {
    return `You've supported ${summary.causesSupported} community actions. Keep going.`
  }
  if (summary.movementsFollowed >= 3) {
    return 'Your participation is helping important issues gain visibility.'
  }
  return `You've taken ${total} step${total === 1 ? '' : 's'} toward community impact.`
}
