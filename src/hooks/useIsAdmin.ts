import { useAuth } from './useAuth'

export function useIsAdmin(): boolean {
  const { profile } = useAuth()
  return Boolean(profile?.is_admin)
}
