import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '../lib/notifications'
import { formatError } from '../lib/errors'
import { isRequestAborted } from '../lib/supabaseRequest'
import { useDataSync } from './useDataSync'

const POLL_MS = 60_000

export function useNotifications(userId: string | undefined) {
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const unreadCount = items.filter((n) => !n.is_read).length

  const load = useCallback(async () => {
    if (!userId) {
      setItems([])
      return
    }
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const data = await fetchNotifications(userId)
      if (requestId !== requestIdRef.current) return
      setItems(data)
    } catch (err) {
      if (requestId !== requestIdRef.current || isRequestAborted(err)) return
      setError(formatError(err))
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
    if (!userId) return
    const timer = window.setInterval(() => void load(), POLL_MS)
    return () => window.clearInterval(timer)
  }, [load, userId])

  useDataSync((event) => {
    if (event.type !== 'notifications:invalidate') return
    if (event.userId && event.userId !== userId) return
    void load()
  })

  const markRead = useCallback(
    async (id: string) => {
      if (!userId) return
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      try {
        await markNotificationRead(userId, id)
      } catch {
        void load()
      }
    },
    [userId, load],
  )

  const markAllRead = useCallback(async () => {
    if (!userId) return
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    try {
      await markAllNotificationsRead(userId)
    } catch {
      void load()
    }
  }, [userId, load])

  return {
    items,
    loading,
    error,
    unreadCount,
    reload: load,
    markRead,
    markAllRead,
  }
}
