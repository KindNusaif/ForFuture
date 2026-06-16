import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isAuthProfileReady } from '../lib/authReady'
import { isOnboardingComplete } from '../lib/onboarding'
import LogoutTransitionLoader from './auth/LogoutTransitionLoader'
import PageLoader from './PageLoader'

/** Redirects members who have not finished onboarding to `/onboarding`. */
export default function OnboardingGate({ children }: { children: ReactNode }) {
  const { user, profile, loading, profileError, loggingOut, authReady } = useAuth()
  const location = useLocation()
  const profileReady = isAuthProfileReady(loading, user?.id, profile, profileError)

  if (!authReady || loggingOut) {
    if (loggingOut) {
      return <LogoutTransitionLoader />
    }
    return <PageLoader />
  }

  if (!profileReady) {
    return <PageLoader />
  }

  if (!user) return <>{children}</>

  const onOnboarding = location.pathname === '/onboarding'
  const complete = isOnboardingComplete(profile)

  if (onOnboarding) {
    if (complete) {
      const dest = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/feed'
      return <Navigate to={dest} replace />
    }
    return <>{children}</>
  }

  if (!complete) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />
  }

  return <>{children}</>
}
