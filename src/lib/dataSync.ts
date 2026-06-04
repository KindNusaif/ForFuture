import type { FeedTab } from '../components/FeedTabs'
import { invalidateFeedCache } from './feedTabCache'
import { isPollMovement } from './movements'
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
  | { type: 'profile:invalidate'; userId?: string }
  | { type: 'follows:invalidate' }
  | {
      type: 'comments:changed'
      postId: string
      contentType?: 'movement' | 'inspire'
    }

type Listener = (event: DataSyncEvent) => void

const listeners = new Set<Listener>()

export function subscribeDataSync(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitDataSync(event: DataSyncEvent): void {
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
  emitDataSync({
    type: 'post:created',
    postId: post.id,
    movementType: post.movement_type,
    userId: post.user_id,
  })
  invalidateAllFeeds()
  if (isPollMovement(post.movement_type)) {
    emitDataSync({ type: 'polls:invalidate' })
  }
  emitDataSync({ type: 'profile:invalidate', userId: post.user_id })
}

export function notifyPostDeleted(postId: string, userId?: string): void {
  emitDataSync({ type: 'post:deleted', postId, userId })
  invalidateAllFeeds()
  emitDataSync({ type: 'polls:invalidate' })
  if (userId) emitDataSync({ type: 'profile:invalidate', userId })
}

export function notifyPostUpdated(postId: string): void {
  emitDataSync({ type: 'post:updated', postId })
}

export function notifyFollowsChanged(): void {
  emitDataSync({ type: 'follows:invalidate' })
}

export function notifyCommentsChanged(
  postId: string,
  contentType: 'movement' | 'inspire' = 'movement',
): void {
  emitDataSync({ type: 'comments:changed', postId, contentType })
}
