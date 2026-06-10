import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { navigateAfterLogout } from '../lib/authNavigation'
import { clearUserSessionCache } from '../lib/clearUserSessionCache'
import { ensureProfile, getProfile, getSession } from '../lib/auth'
import { formatError } from '../lib/errors'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Profile } from '../types'
import { AuthContext, type AuthContextValue } from './auth-context'

import { AUTH_BOOTSTRAP_TIMEOUT_MS } from '../lib/requestConfig'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthContextValue['session']>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [loggingOut, setLoggingOut] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const profileUserIdRef = useRef<string | null>(null)
  const profileLoadGenRef = useRef(0)
  const logoutInFlightRef = useRef(false)
  const mountedRef = useRef(true)

  const finishLoading = useCallback(() => setLoading(false), [])

  const clearLocalAuth = useCallback(() => {
    profileLoadGenRef.current += 1
    profileUserIdRef.current = null
    setProfile(null)
    setSession(null)
    setProfileError(null)
    setAuthError(null)
  }, [])

  const loadProfile = useCallback(async (user: User, force = false) => {
    if (!force && profileUserIdRef.current === user.id) return

    const requestUserId = user.id
    const generation = ++profileLoadGenRef.current
    setProfileError(null)
    try {
      let data = await getProfile(requestUserId)
      if (generation !== profileLoadGenRef.current) return
      if (!data) {
        const name =
          (user.user_metadata?.display_name as string | undefined) ??
          user.email?.split('@')[0] ??
          'ForFuture member'
        data = await ensureProfile(requestUserId, name)
        if (generation !== profileLoadGenRef.current) return
      }
      profileUserIdRef.current = requestUserId
      setProfile(data)
    } catch (err) {
      if (generation !== profileLoadGenRef.current) return
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

  const logout = useCallback(async () => {
    if (logoutInFlightRef.current) return
    logoutInFlightRef.current = true
    setLoggingOut(true)

    clearLocalAuth()
    clearUserSessionCache()

    try {
      if (!isSupabaseConfigured || !supabase) {
        navigateAfterLogout('/')
        if (mountedRef.current) {
          setLoggingOut(false)
          logoutInFlightRef.current = false
        }
        return
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      navigateAfterLogout('/')
    } catch (err) {
      logoutInFlightRef.current = false
      if (mountedRef.current) setLoggingOut(false)
      throw err
    }
  }, [clearLocalAuth])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    let mounted = true
    let bootstrapDone = false

    const applyBootstrapSession = (nextSession: AuthContextValue['session']) => {
      if (!mounted || bootstrapDone) return
      bootstrapDone = true
      setSession(nextSession)
      setAuthError(null)
      finishLoading()
      if (nextSession?.user) {
        void loadProfile(nextSession.user)
      } else {
        clearLocalAuth()
      }
    }

    void getSession()
      .then((nextSession) => {
        applyBootstrapSession(nextSession)
      })
      .catch(() => {
        if (!mounted) return
        if (!bootstrapDone) {
          setAuthError('We could not connect to ForFuture. Please check your connection and try again.')
          finishLoading()
        }
      })

    const timeout = window.setTimeout(() => {
      if (!mounted || bootstrapDone) return
      void getSession()
        .then((nextSession) => {
          applyBootstrapSession(nextSession)
        })
        .catch(() => {
          if (mounted && !bootstrapDone) {
            setAuthError('We could not connect to ForFuture. Please check your connection and try again.')
            finishLoading()
          }
        })
    }, AUTH_BOOTSTRAP_TIMEOUT_MS)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return

      if (event === 'INITIAL_SESSION') {
        applyBootstrapSession(nextSession)
        return
      }

      if (event === 'SIGNED_OUT') {
        clearLocalAuth()
        clearUserSessionCache()
        setLoggingOut(false)
        logoutInFlightRef.current = false
        finishLoading()
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
        clearLocalAuth()
      }
    })

    return () => {
      mounted = false
      window.clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [loadProfile, finishLoading, clearLocalAuth])

  const authReady = !loading && !loggingOut
  const user = session?.user ?? null
  const isLoggedIn = authReady && Boolean(user)

  const value = useMemo(
    () => ({
      session,
      user,
      profile: loggingOut ? null : profile,
      loading,
      authReady,
      configured: isSupabaseConfigured,
      authError,
      profileError,
      isGuest: authReady && !user,
      isMember: isLoggedIn,
      isLoggedIn,
      role: (profile?.is_admin ? 'admin' : 'user') as 'admin' | 'user',
      isAdmin: isLoggedIn && Boolean(profile?.is_admin),
      loggingOut,
      refreshProfile,
      logout,
    }),
    [
      session,
      user,
      profile,
      loading,
      authReady,
      isLoggedIn,
      loggingOut,
      authError,
      profileError,
      refreshProfile,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
