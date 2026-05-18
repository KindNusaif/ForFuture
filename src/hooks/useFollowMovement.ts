import { useMovementFollows } from './useMovementFollows'

/** Follow state for a single movement (wraps shared movement-follows hook). */
export function useFollowMovement(userId: string | undefined, movementId: string) {
  const follows = useMovementFollows(userId)

  return {
    isFollowing: follows.isFollowing(movementId),
    followerCount: follows.followerCounts[movementId],
    loading: follows.processingId === movementId,
    toggle: () => follows.toggleFollow(movementId),
    error: follows.error,
  }
}
