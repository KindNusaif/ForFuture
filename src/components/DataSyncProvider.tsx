import { useEffect, useRef } from 'react'
import { emitDataSync } from '../lib/dataSync'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const REALTIME_DEBOUNCE_MS = 400

/**
 * Global Supabase realtime → dataSync bridge (one channel per app session).
 * Components subscribe via useDataSync; no per-page duplicate channels.
 */
export default function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const pendingRef = useRef(new Set<string>())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const client = supabase
    if (!isSupabaseConfigured || !client) return

    const flush = () => {
      timerRef.current = null
      const pending = pendingRef.current
      pendingRef.current = new Set()
      for (const key of pending) {
        if (key.startsWith('post:')) {
          const postId = key.slice(5)
          emitDataSync({ type: 'post:updated', postId })
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
        }
      }
    }

    const schedule = (key: string) => {
      pendingRef.current.add(key)
      if (timerRef.current) return
      timerRef.current = window.setTimeout(flush, REALTIME_DEBOUNCE_MS)
    }

    const channel = client
      .channel('forfuture-app-sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'private', table: 'posts' },
        (payload) => {
          const row = payload.new as { id?: string; movement_type?: string }
          if (!row?.id) return
          schedule('feed:all')
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
          emitDataSync({ type: 'post:deleted', postId: row.id, userId: row.user_id })
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
      .subscribe()

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      void client.removeChannel(channel)
    }
  }, [])

  return children
}
