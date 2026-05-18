import type { Profile } from '../types'

/** Session bootstrap finished (Supabase auth resolved). */
export function isAuthSessionReady(loading: boolean): boolean {
  return !loading
}

/**
 * Profile fetch settled for the signed-in user (success, missing row, or error).
 * Avoids treating "profile still loading" as "needs onboarding".
 */
export function isAuthProfileReady(
  loading: boolean,
  userId: string | undefined,
  profile: Profile | null,
  profileError: string | null,
): boolean {
  if (loading) return false
  if (!userId) return true
  return profile !== null || Boolean(profileError)
}
