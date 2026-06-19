import type { FeedTab } from '../components/FeedTabs'
import { invalidateFeedCache } from './feedTabCache'
import type { MovementType } from '../types'

export type DataSyncEvent =
  | {
      type: 'post:created'
      postId: string
      movementType: MovementType
      userId: string
    }
  | { type: 'post:deleted'; postId: string; userId?: string }
  | { type: 'post:updated'; postId: string }
  | { type: 'feed:invalidate'; feedTab?: FeedTab }
  | { type: 'polls:invalidate' }
  | { type: 'inspire:invalidate' }
  | { type: 'profile:invalidate'; userId?: string }
  | { type: 'follows:invalidate' }
  | {
      type: 'comments:changed'
      postId: string
      contentType?: 'movement' | 'inspire'
    }
  | { type: 'poll:published'; postId: string; userId: string }
  | { type: 'notifications:invalidate'; userId?: string }

type Listener = (event: DataSyncEvent) => void

const listeners = new Set<Listener>()

export function subscribeDataSync(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const recentEvents = new Map<string, number>()
const DEDUPE_MS = 600

function eventKey(event: DataSyncEvent): string {
  return JSON.stringify(event)
}

/** Emit once per window to avoid double refetch from local action + realtime echo. */
export function emitDataSync(event: DataSyncEvent): void {
  const key = eventKey(event)
  const now = Date.now()
  const last = recentEvents.get(key)
  if (last != null && now - last < DEDUPE_MS) return
  recentEvents.set(key, now)
  if (recentEvents.size > 80) {
    for (const [k, t] of recentEvents) {
      if (now - t > DEDUPE_MS * 4) recentEvents.delete(k)
    }
  }

  for (const listener of listeners) {
    try {
      listener(event)
    } catch (err) {
      if (import.meta.env.DEV) console.error('[dataSync]', err)
    }
  }
}

export function invalidateAllFeeds(feedTab?: FeedTab): void {
  invalidateFeedCache(feedTab)
  emitDataSync({ type: 'feed:invalidate', feedTab })
}

export function notifyPostCreated(post: {
  id: string
  movement_type: MovementType
  user_id: string
}): void {
  invalidateFeedCache()
  emitDataSync({
    type: 'post:created',
    postId: post.id,
    movementType: post.movement_type,
    userId: post.user_id,
  })
  emitDataSync({ type: 'profile:invalidate', userId: post.user_id })
  if (post.movement_type === 'quick_youth_poll') {
    emitDataSync({ type: 'polls:invalidate' })
  }
}

export function notifyPostDeleted(postId: string, userId?: string): void {
  invalidateFeedCache()
  emitDataSync({ type: 'post:deleted', postId, userId })
  emitDataSync({ type: 'polls:invalidate' })
  if (userId) emitDataSync({ type: 'profile:invalidate', userId })
}

export function notifyPostUpdated(postId: string): void {
  emitDataSync({ type: 'post:updated', postId })
}

export function notifyFollowsChanged(): void {
  emitDataSync({ type: 'follows:invalidate' })
}

export function notifyInspireChanged(): void {
  emitDataSync({ type: 'inspire:invalidate' })
}

export function notifyCommentsChanged(
  postId: string,
  contentType: 'movement' | 'inspire' = 'movement',
): void {
  emitDataSync({ type: 'comments:changed', postId, contentType })
}

/** After poll publish — prepend on polls page without waiting for full refetch. */
export function notifyPollPublished(postId: string, userId: string): void {
  emitDataSync({ type: 'poll:published', postId, userId })
}

/** Clears in-memory dedupe state and notifies mounted views to drop user-specific data. */
export function resetDataSyncState(): void {
  recentEvents.clear()
  emitDataSync({ type: 'feed:invalidate' })
  emitDataSync({ type: 'polls:invalidate' })
  emitDataSync({ type: 'follows:invalidate' })
  emitDataSync({ type: 'profile:invalidate' })
  emitDataSync({ type: 'inspire:invalidate' })
}
