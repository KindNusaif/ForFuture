import type { RealtimeChannel } from '@supabase/supabase-js'
import { emitDataSync } from './dataSync'
import { invalidateFeedCache } from './feedTabCache'
import { isSupabaseConfigured, supabase } from './supabase'
import type { MovementType } from '../types'

const REALTIME_DEBOUNCE_MS = 400
const CHANNEL_NAME = 'forfuture-app-sync'

let syncChannel: RealtimeChannel | null = null
let started = false
let subscribeFailed = false
let pendingKeys = new Set<string>()
let flushTimer: ReturnType<typeof setTimeout> | null = null

function flushPending() {
  flushTimer = null
  const pending = pendingKeys
  pendingKeys = new Set()
  for (const key of pending) {
    if (key.startsWith('post:')) {
      emitDataSync({ type: 'post:updated', postId: key.slice(5) })
    } else if (key.startsWith('poll:')) {
      emitDataSync({ type: 'post:updated', postId: key.slice(5) })
    } else if (key.startsWith('comment:')) {
      const [, postId, contentType] = key.split(':')
      emitDataSync({
        type: 'comments:changed',
        postId,
        contentType: contentType === 'inspire' ? 'inspire' : 'movement',
      })
    } else if (key === 'follows') {
      emitDataSync({ type: 'follows:invalidate' })
    } else if (key.startsWith('feed:')) {
      emitDataSync({ type: 'feed:invalidate' })
    } else if (key === 'inspire') {
      emitDataSync({ type: 'inspire:invalidate' })
    }
  }
}

function schedule(key: string) {
  pendingKeys.add(key)
  if (flushTimer) return
  flushTimer = window.setTimeout(flushPending, REALTIME_DEBOUNCE_MS)
}

function buildChannel(client: NonNullable<typeof supabase>): RealtimeChannel {
  // All postgres_changes handlers MUST be registered before subscribe().
  return client
    .channel(CHANNEL_NAME)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'private', table: 'posts' },
      (payload) => {
        const row = payload.new as {
          id?: string
          movement_type?: MovementType
          user_id?: string
        }
        if (!row?.id || !row.user_id || !row.movement_type) return
        invalidateFeedCache()
        emitDataSync({
          type: 'post:created',
          postId: row.id,
          movementType: row.movement_type,
          userId: row.user_id,
        })
        if (row.movement_type === 'quick_youth_poll') {
          emitDataSync({ type: 'polls:invalidate' })
        }
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'private', table: 'posts' },
      (payload) => {
        const row = payload.new as { id?: string }
        if (row?.id) schedule(`post:${row.id}`)
      },
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'private', table: 'posts' },
      (payload) => {
        const row = payload.old as { id?: string; user_id?: string }
        if (!row?.id) return
        invalidateFeedCache()
        emitDataSync({ type: 'post:deleted', postId: row.id, userId: row.user_id })
        emitDataSync({ type: 'polls:invalidate' })
        if (row.user_id) {
          emitDataSync({ type: 'profile:invalidate', userId: row.user_id })
        }
        schedule('feed:all')
      },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'poll_votes' },
      (payload) => {
        const row = payload.new as { post_id?: string }
        if (row?.post_id) schedule(`poll:${row.post_id}`)
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'comments' },
      (payload) => {
        const row = (payload.new ?? payload.old) as {
          content_id?: string
          content_type?: string
        }
        if (!row?.content_id) return
        const ct = row.content_type === 'inspire' ? 'inspire' : 'movement'
        schedule(`comment:${row.content_id}:${ct}`)
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'movement_follows' },
      () => {
        schedule('follows')
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'post_actions' },
      (payload) => {
        const row = (payload.new ?? payload.old) as { post_id?: string }
        if (row?.post_id) schedule(`post:${row.post_id}`)
      },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'petition_signatures' },
      (payload) => {
        const row = payload.new as { petition_id?: string }
        if (row?.petition_id) schedule(`post:${row.petition_id}`)
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inspire_posts' },
      () => {
        schedule('inspire')
      },
    )
}

/**
 * Start the global realtime → dataSync bridge once per page load.
 * Idempotent: safe under React StrictMode (mount/unmount/remount) because we
 * never call `.on()` on a channel that was already subscribed.
 */
export function ensureRealtimeSyncBridge(): void {
  if (started) return

  const client = supabase
  if (!isSupabaseConfigured || !client) return

  started = true

  try {
    const channel = buildChannel(client)
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        subscribeFailed = false
        return
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        subscribeFailed = true
        if (import.meta.env.DEV) {
          console.warn(
            '[realtimeSyncBridge] Live updates unavailable. Fetch/refetch still works.',
            err?.message ?? status,
          )
        }
      }
    })
    syncChannel = channel
  } catch (err) {
    subscribeFailed = true
    if (import.meta.env.DEV) {
      console.warn('[realtimeSyncBridge] Failed to start:', err)
    }
  }
}

export function isRealtimeSyncActive(): boolean {
  return syncChannel != null && !subscribeFailed
}

/** @deprecated Use ensureRealtimeSyncBridge — kept for DataSyncProvider mount hook. */
export function acquireRealtimeSyncBridge(): () => void {
  ensureRealtimeSyncBridge()
  return () => {}
}
