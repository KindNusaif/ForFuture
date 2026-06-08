import { useCallback, useEffect, useRef, useState } from 'react'
import { useDataSync } from './useDataSync'
import { useVisibilityRefetch } from './useVisibilityRefetch'
import { formatError } from '../lib/errors'
import { fetchRelatedPosts } from '../lib/posts'
import { isRequestAborted } from '../lib/supabaseRequest'
import type { Category, Post } from '../types'

export function useRelatedMovements(
  postId: string | undefined,
  category: Category | undefined,
  viewerUserId?: string,
  enabled = true,
) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const postsRef = useRef(posts)

  useEffect(() => {
    postsRef.current = posts
  }, [posts])

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!postId || !category || !enabled) return

    const requestId = ++requestIdRef.current
    if (!options?.silent) setLoading(true)
    setError(null)

    try {
      const related = await fetchRelatedPosts(category, postId, viewerUserId, 3)
      if (requestId !== requestIdRef.current) return
      setPosts(related)
    } catch (err) {
      if (requestId !== requestIdRef.current || isRequestAborted(err)) return
      setError(formatError(err))
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [postId, category, viewerUserId, enabled])

  useEffect(() => {
    void load()
  }, [load])

  const silentReload = useCallback(() => {
    void load({ silent: postsRef.current.length > 0 })
  }, [load])

  useDataSync(
    (event) => {
      if (event.type === 'post:updated') {
        if (
          event.postId === postId ||
          postsRef.current.some((row) => row.id === event.postId)
        ) {
          silentReload()
        }
        return
      }
      if (event.type === 'post:created' || event.type === 'feed:invalidate') {
        silentReload()
      }
    },
    enabled,
  )

  useVisibilityRefetch(silentReload, { enabled: enabled && !loading && posts.length > 0 })

  return { posts, loading, error, reload: load }
}
