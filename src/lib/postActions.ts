import { getActionTypeForMovement } from './movements'
import { enhanceSupabaseError, isMissingRelation } from './supabaseErrors'
import { requireSupabase } from './supabase'
import { chunkIds, DEFAULT_REQUEST_TIMEOUT_MS, withTimeout } from './supabaseRequest'
import { isPollMovement } from './movements'
import { isPetitionMovement } from './petitions'
import type { MovementType, Post, PostActionType } from '../types'

const ACTIONS_TABLE = 'post_actions' as const
const LEGACY_SUPPORTS_TABLE = 'supports' as const

export interface PostActionRow {
  post_id: string
  user_id: string
  action_type?: PostActionType
}

async function fetchActionsChunk(postIds: string[], useLegacy: boolean): Promise<PostActionRow[]> {
  const client = requireSupabase()
  const table = useLegacy ? LEGACY_SUPPORTS_TABLE : ACTIONS_TABLE
  const columns = useLegacy ? 'post_id, user_id' : 'post_id, user_id, action_type'

  const { data, error } = await client.from(table).select(columns).in('post_id', postIds)

  if (error) throw enhanceSupabaseError(error)
  return (data ?? []) as unknown as PostActionRow[]
}

/** Load engagement rows for post ids (chunked). Falls back to legacy supports table if needed. */
export async function fetchPostActionsForPosts(postIds: string[]): Promise<PostActionRow[]> {
  if (postIds.length === 0) return []

  const chunks = chunkIds(postIds)
  let useLegacy = false

  try {
    const results = await withTimeout(
      Promise.all(chunks.map((chunk) => fetchActionsChunk(chunk, false))),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )
    return results.flat()
  } catch (error) {
    if (!isMissingRelation(error)) throw error
    useLegacy = true
  }

  const results = await withTimeout(
    Promise.all(chunks.map((chunk) => fetchActionsChunk(chunk, useLegacy))),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  return results.flat()
}

/** Attach support_count and supported_by_me to each post */
export function attachActionCounts(posts: Post[], actions: PostActionRow[], userId?: string): Post[] {
  const countMap = new Map<string, number>()
  const myActionSet = new Set<string>()

  for (const row of actions) {
    countMap.set(row.post_id, (countMap.get(row.post_id) ?? 0) + 1)
    if (userId && row.user_id === userId) {
      myActionSet.add(row.post_id)
    }
  }

  return posts.map((post) => ({
    ...post,
    support_count: countMap.get(post.id) ?? 0,
    supported_by_me: myActionSet.has(post.id),
  }))
}

export async function enrichPostsWithActions(posts: Post[], userId?: string): Promise<Post[]> {
  if (posts.length === 0) return []
  const actionPostIds = posts
    .filter((p) => !isPollMovement(p.movement_type) && !isPetitionMovement(p.movement_type))
    .map((p) => p.id)
  const actions =
    actionPostIds.length > 0 ? await fetchPostActionsForPosts(actionPostIds) : []
  return attachActionCounts(posts, actions, userId)
}

/** @deprecated Use enrichPostsWithActions */
export const enrichPostsWithSupport = enrichPostsWithActions

/** @deprecated Use attachActionCounts */
export const attachSupportCounts = attachActionCounts

/** @deprecated Use fetchPostActionsForPosts */
export const fetchSupportsForPosts = fetchPostActionsForPosts

async function insertAction(
  postId: string,
  userId: string,
  movementType: MovementType,
  useLegacy: boolean,
  donationSubtype?: string | null,
): Promise<void> {
  const client = requireSupabase()

  if (useLegacy) {
    const { error } = await withTimeout(
      client.from(LEGACY_SUPPORTS_TABLE).insert({ post_id: postId, user_id: userId }),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )
    if (error) throw enhanceSupabaseError(error)
    return
  }

  const { error } = await withTimeout(
    client.from(ACTIONS_TABLE).insert({
      post_id: postId,
      user_id: userId,
      action_type: getActionTypeForMovement(movementType, donationSubtype),
    }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
}

async function deleteAction(
  postId: string,
  userId: string,
  useLegacy: boolean,
): Promise<void> {
  const client = requireSupabase()
  const table = useLegacy ? LEGACY_SUPPORTS_TABLE : ACTIONS_TABLE

  const { error } = await withTimeout(
    client.from(table).delete().eq('post_id', postId).eq('user_id', userId),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
}

/**
 * Toggle civic action engagement for a post.
 * Returns true if the user is now participating.
 */
export async function togglePostAction(
  postId: string,
  userId: string,
  movementType: MovementType,
  currentlyParticipating: boolean,
  donationSubtype?: string | null,
): Promise<boolean> {
  if (currentlyParticipating) {
    try {
      await deleteAction(postId, userId, false)
    } catch (error) {
      if (!isMissingRelation(error)) throw error
      await deleteAction(postId, userId, true)
    }
    return false
  }

  try {
    await insertAction(postId, userId, movementType, false, donationSubtype)
  } catch (error) {
    if (!isMissingRelation(error)) throw enhanceSupabaseError(error)
    await insertAction(postId, userId, movementType, true, donationSubtype)
  }
  return true
}

/** @deprecated Use togglePostAction */
export async function toggleSupport(
  postId: string,
  userId: string,
  currentlySupported: boolean,
  movementType: MovementType = 'idea_for_change',
): Promise<boolean> {
  return togglePostAction(postId, userId, movementType, currentlySupported)
}
