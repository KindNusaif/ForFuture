import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { ensureProfile, getProfile, getSession } from '../lib/auth'
import { formatError } from '../lib/errors'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Profile } from '../types'
import { AuthContext, type AuthContextValue } from './auth-context'

const AUTH_TIMEOUT_MS = 12_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthContextValue['session']>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [authError, setAuthError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const finishLoading = useCallback(() => setLoading(false), [])

  const loadProfile = useCallback(async (user: User) => {
    setProfileError(null)
    try {
      let data = await getProfile(user.id)
      if (!data) {
        const name =
          (user.user_metadata?.display_name as string | undefined) ??
          user.email?.split('@')[0] ??
          'User'
        data = await ensureProfile(user.id, name)
      }
      setProfile(data)
    } catch (err) {
      setProfile(null)
      setProfileError(formatError(err))
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await loadProfile(session.user)
    }
  }, [session, loadProfile])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    let mounted = true
    const timeout = window.setTimeout(() => {
      if (mounted) finishLoading()
    }, AUTH_TIMEOUT_MS)

    async function init() {
      try {
        const currentSession = await getSession()
        if (!mounted) return
        setSession(currentSession)
        setAuthError(null)
        if (currentSession?.user) {
          await loadProfile(currentSession.user)
        }
      } catch (err) {
        if (mounted) {
          setAuthError(formatError(err))
          setSession(null)
          setProfile(null)
        }
      } finally {
        if (mounted) finishLoading()
      }
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === 'INITIAL_SESSION') return

      setSession(nextSession)
      setAuthError(null)
      if (nextSession?.user) {
        await loadProfile(nextSession.user)
      } else {
        setProfile(null)
        setProfileError(null)
      }
      finishLoading()
    })

    return () => {
      mounted = false
      window.clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [loadProfile, finishLoading])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      configured: isSupabaseConfigured,
      authError,
      profileError,
      isGuest: !loading && !session?.user,
      isMember: !loading && Boolean(session?.user),
      refreshProfile,
    }),
    [session, profile, loading, authError, profileError, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
