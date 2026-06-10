import { useAuth } from './useAuth'

export function useIsAdmin(): boolean {
  const { profile, isLoggedIn } = useAuth()
  return isLoggedIn && Boolean(profile?.is_admin)
}
