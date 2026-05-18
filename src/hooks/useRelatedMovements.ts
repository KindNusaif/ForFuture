import { useCallback, useEffect, useRef, useState } from 'react'
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

  const load = useCallback(async () => {
    if (!postId || !category || !enabled) return

    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    try {
      const related = await fetchRelatedPosts(category, postId, viewerUserId, 3)
      if (requestId !== requestIdRef.current) return
      setPosts(related)
    } catch (err) {
      if (requestId !== requestIdRef.current || isRequestAborted(err)) return
      setError(formatError(err))
      setPosts([])
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [postId, category, viewerUserId, enabled])

  useEffect(() => {
    void load()
  }, [load])

  return { posts, loading, error, reload: load }
}
