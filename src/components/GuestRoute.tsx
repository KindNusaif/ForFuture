import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import SessionBootstrapLoader from './auth/SessionBootstrapLoader'
import { useAuth } from '../hooks/useAuth'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { isOnboardingComplete } from '../lib/onboarding'
import { isAuthProfileReady } from '../lib/authReady'
import { resolveAuthReturn } from '../lib/authReturn'

/** Redirect logged-in users away from login/signup */
export default function GuestRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { user, loading, loggingOut, configured, profile, profileError, authError } = useAuth()
  const { showSlowHint, showRecovery } = useLoadingProgress(loading)
  const profileReady = isAuthProfileReady(loading, user?.id, profile, profileError)

  if (!configured) return <>{children}</>

  if (loggingOut) {
    return <SessionBootstrapLoader showSlowHint={false} showRecovery={false} minHeight="half" />
  }

  if (authError) {
    return (
      <main className="flex min-h-[50vh] flex-col items-center justify-center bg-muted px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/40">
          <h1 className="text-lg font-semibold text-primary">Could not connect</h1>
          <p className="mt-2 text-sm text-red-800 dark:text-red-200">{authError}</p>
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary text-sm"
            >
              Retry connection
            </button>
            <Link to="/" className="text-sm font-semibold text-secondary hover:text-primary">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (!profileReady) {
    return <SessionBootstrapLoader showSlowHint={showSlowHint} showRecovery={showRecovery} minHeight="half" />
  }

  if (user) {
    const returnTo = resolveAuthReturn(location.state, '/feed')
    const dest = isOnboardingComplete(profile) ? returnTo : '/onboarding'
    return <Navigate to={dest} replace />
  }

  return <>{children}</>
}
