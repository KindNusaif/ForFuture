import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchFollowedMovementIds,
  fetchFollowerCounts,
  followMovement,
  unfollowMovement,
} from '../lib/movementFollows'
import { useDataSync } from './useDataSync'
import { formatError } from '../lib/errors'

export function useMovementFollows(userId: string | undefined) {
  const [followedIds, setFollowedIds] = useState<Set<string>>(() => new Set())
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(Boolean(userId))
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const followedIdsRef = useRef(followedIds)

  useEffect(() => {
    followedIdsRef.current = followedIds
  }, [followedIds])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const reloadFollowedIds = useCallback(async (options?: { silent?: boolean }) => {
    if (!userId) {
      setFollowedIds(new Set())
      setLoading(false)
      return
    }
    if (!options?.silent) setLoading(true)
    setError(null)
    try {
      const ids = await fetchFollowedMovementIds(userId)
      if (!mountedRef.current) return
      setFollowedIds(new Set(ids))
    } catch (err) {
      if (!mountedRef.current) return
      setError(formatError(err))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void reloadFollowedIds()
  }, [reloadFollowedIds])

  useDataSync((event) => {
    if (event.type === 'follows:invalidate') {
      void reloadFollowedIds({ silent: followedIdsRef.current.size > 0 })
    }
  }, Boolean(userId))

  const refreshCountsForPosts = useCallback(async (movementIds: string[]) => {
    if (movementIds.length === 0) return
    try {
      const counts = await fetchFollowerCounts(movementIds)
      if (!mountedRef.current) return
      setFollowerCounts((prev) => ({ ...prev, ...counts }))
    } catch {
      /* counts are optional UI enhancement */
    }
  }, [])

  const toggleFollow = useCallback(
    async (movementId: string): Promise<{ following: boolean }> => {
      if (!userId) {
        throw new Error('Sign in to follow movements.')
      }
      if (processingId) {
        return { following: followedIds.has(movementId) }
      }

      const wasFollowing = followedIds.has(movementId)
      setProcessingId(movementId)
      setError(null)

      setFollowedIds((prev) => {
        const next = new Set(prev)
        if (wasFollowing) next.delete(movementId)
        else next.add(movementId)
        return next
      })
      setFollowerCounts((prev) => {
        const current = prev[movementId] ?? 0
        const next = wasFollowing ? Math.max(0, current - 1) : current + 1
        return { ...prev, [movementId]: next }
      })

      try {
        if (wasFollowing) {
          await unfollowMovement(userId, movementId)
        } else {
          await followMovement(userId, movementId)
        }
        return { following: !wasFollowing }
      } catch (err) {
        if (mountedRef.current) {
          setFollowedIds((prev) => {
            const next = new Set(prev)
            if (wasFollowing) next.add(movementId)
            else next.delete(movementId)
            return next
          })
          setFollowerCounts((prev) => {
            const current = prev[movementId] ?? 0
            const next = wasFollowing ? current + 1 : Math.max(0, current - 1)
            return { ...prev, [movementId]: next }
          })
          setError(formatError(err))
        }
        throw err
      } finally {
        if (mountedRef.current) setProcessingId(null)
      }
    },
    [userId, followedIds, processingId],
  )

  return {
    followedIds,
    followerCounts,
    loading,
    processingId,
    error,
    reloadFollowedIds,
    refreshCountsForPosts,
    toggleFollow,
    isFollowing: (movementId: string) => followedIds.has(movementId),
  }
}
