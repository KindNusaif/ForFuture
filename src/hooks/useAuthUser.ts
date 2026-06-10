import { useAuth } from './useAuth'

/** Reusable guest vs member detection */
export function useAuthUser() {
  const {
    user,
    profile,
    loading,
    authReady,
    loggingOut,
    configured,
    isGuest,
    isMember,
    isLoggedIn,
    role,
    isAdmin,
  } = useAuth()

  return {
    user,
    profile,
    loading,
    authReady,
    loggingOut,
    configured,
    isGuest,
    isMember,
    isLoggedIn,
    role,
    isAdmin,
  }
}
