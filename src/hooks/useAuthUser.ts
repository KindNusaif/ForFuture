import { useAuth } from './useAuth'

/** Reusable guest vs member detection */
export function useAuthUser() {
  const { user, profile, loading, configured } = useAuth()

  const isGuest = !loading && !user
  const isMember = !loading && Boolean(user)

  return {
    user,
    profile,
    loading,
    configured,
    isGuest,
    isMember,
  }
}
