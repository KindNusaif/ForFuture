import { useCallback, useEffect, useRef, useState } from 'react'
import { useDataSync } from './useDataSync'
import { formatError } from '../lib/errors'
import { fetchPostById } from '../lib/posts'
import { isRequestAborted } from '../lib/supabaseRequest'
import type { Post } from '../types'

export interface UseMovementDetailOptions {
  postId: string
  isGuest: boolean
  userId?: string
  enabled: boolean
}

export function useMovementDetail({
  postId,
  isGuest,
  userId,
  enabled,
}: UseMovementDetailOptions) {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = ++requestIdRef.current

    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const result = await fetchPostById(
          postId,
          isGuest ? undefined : userId,
          controller.signal,
        )
        if (requestId !== requestIdRef.current) return
        setPost(result ?? null)
      } catch (err) {
        if (requestId !== requestIdRef.current || isRequestAborted(err)) return
        setError(formatError(err))
        setPost(null)
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
          abortRef.current = null
        }
      }
    })()
  }, [postId, isGuest, userId])

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort()
      return
    }
    const timer = window.setTimeout(() => {
      load()
    }, 0)
    return () => {
      window.clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [enabled, load])

  const reload = useCallback(() => {
    load()
  }, [load])

  useDataSync(
    (event) => {
      if (event.type !== 'post:updated' && event.type !== 'post:deleted') return
      if (event.postId !== postId) return
      if (event.type === 'post:deleted') {
        setPost(null)
        setError('This movement is no longer available.')
        return
      }
      void (async () => {
        try {
          const updated = await fetchPostById(postId, isGuest ? undefined : userId)
          if (updated) {
            setPost(updated)
            setError(null)
          }
        } catch {
          /* keep current detail — user action already updated local state */
        }
      })()
    },
    enabled,
  )

  return { post, loading, error, reload, setPost }
}
