import { notifyFollowsChanged } from './dataSync'
import { enhanceSupabaseError, isMissingRelation } from './supabaseErrors'
import { requireSupabase } from './supabase'
import { DEFAULT_REQUEST_TIMEOUT_MS, withTimeout } from './supabaseRequest'

const FOLLOWS_TABLE = 'movement_follows'
const COUNTS_VIEW = 'movement_follower_counts'

export async function fetchFollowedMovementIds(userId: string): Promise<string[]> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client.from(FOLLOWS_TABLE).select('movement_id').eq('user_id', userId),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) {
    if (isMissingRelation(error)) {
      throw enhanceSupabaseError(error)
    }
    throw enhanceSupabaseError(error)
  }
  return (data ?? []).map((row) => String(row.movement_id))
}

export async function followMovement(userId: string, movementId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client.from(FOLLOWS_TABLE).insert({ user_id: userId, movement_id: movementId }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) {
    if (error.code === '23505') return
    throw enhanceSupabaseError(error)
  }
  notifyFollowsChanged()
}

export async function unfollowMovement(userId: string, movementId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client
      .from(FOLLOWS_TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('movement_id', movementId),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
  notifyFollowsChanged()
}

export async function fetchFollowerCounts(
  movementIds: string[],
): Promise<Record<string, number>> {
  if (movementIds.length === 0) return {}

  const client = requireSupabase()
  const unique = [...new Set(movementIds)]
  const { data, error } = await withTimeout(
    client.from(COUNTS_VIEW).select('movement_id, follower_count').in('movement_id', unique),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (error) {
    if (isMissingRelation(error)) return {}
    throw enhanceSupabaseError(error)
  }

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[String(row.movement_id)] = Number(row.follower_count) || 0
  }
  return counts
}

export function applyFollowStateToPosts<T extends { id: string }>(
  posts: T[],
  followedIds: Set<string>,
  followerCounts: Record<string, number>,
): (T & { followed_by_me?: boolean; follower_count?: number })[] {
  return posts.map((post) => ({
    ...post,
    followed_by_me: followedIds.has(post.id),
    follower_count: followerCounts[post.id] ?? 0,
  }))
}
