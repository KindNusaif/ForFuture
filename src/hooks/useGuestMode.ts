import { useAuthUser } from './useAuthUser'

/**
 * Guest explore mode: unauthenticated visitors browsing public content.
 * Pair with `useAuthGate()` for action-level conversion modals.
 */
export function useGuestMode() {
  const { user, loading, isGuest, isMember } = useAuthUser()

  return {
    user,
    loading,
    isGuest,
    isMember,
    isAuthenticated: isMember,
  }
}
