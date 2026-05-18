import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { ensureProfile, getProfile } from '../lib/auth'
import { formatError } from '../lib/errors'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Profile } from '../types'
import { AuthContext, type AuthContextValue } from './auth-context'

import { AUTH_BOOTSTRAP_TIMEOUT_MS } from '../lib/requestConfig'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthContextValue['session']>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [authError, setAuthError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const profileUserIdRef = useRef<string | null>(null)

  const finishLoading = useCallback(() => setLoading(false), [])

  const loadProfile = useCallback(async (user: User, force = false) => {
    if (!force && profileUserIdRef.current === user.id) return

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
      profileUserIdRef.current = user.id
      setProfile(data)
    } catch (err) {
      profileUserIdRef.current = null
      setProfile(null)
      setProfileError(formatError(err))
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      profileUserIdRef.current = null
      await loadProfile(session.user, true)
    }
  }, [session, loadProfile])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    let mounted = true
    let sessionResolved = false

    const timeout = window.setTimeout(() => {
      if (mounted && !sessionResolved) {
        sessionResolved = true
        finishLoading()
      }
    }, AUTH_BOOTSTRAP_TIMEOUT_MS)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return

      if (event === 'INITIAL_SESSION') {
        sessionResolved = true
        setSession(nextSession)
        setAuthError(null)
        finishLoading()
        if (nextSession?.user) {
          void loadProfile(nextSession.user)
        } else {
          profileUserIdRef.current = null
          setProfile(null)
          setProfileError(null)
        }
        return
      }

      setSession(nextSession)
      setAuthError(null)
      finishLoading()

      if (nextSession?.user) {
        const userId = nextSession.user.id
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || userId !== profileUserIdRef.current) {
          void loadProfile(nextSession.user)
        }
      } else {
        profileUserIdRef.current = null
        setProfile(null)
        setProfileError(null)
      }
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
