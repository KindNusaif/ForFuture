import { useAuth } from './useAuth'

/** Reusable guest vs member detection */
export function useAuthUser() {
  const { user, profile, loading, loggingOut, configured, isGuest, isMember } = useAuth()

  return {
    user,
    profile,
    loading,
    loggingOut,
    configured,
    isGuest,
    isMember,
  }
}
