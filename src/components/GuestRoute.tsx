import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AsyncLoadHint from './AsyncLoadHint'
import { useAuth } from '../hooks/useAuth'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { isOnboardingComplete } from '../lib/onboarding'
import { isAuthProfileReady } from '../lib/authReady'

/** Redirect logged-in users away from login/signup */
export default function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading, configured, profile, profileError, authError } = useAuth()
  const { showSlowHint, showRecovery } = useLoadingProgress(loading)
  const profileReady = isAuthProfileReady(loading, user?.id, profile, profileError)

  if (!configured) return <>{children}</>

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
    return (
      <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-label="Loading" />
        <p className="text-sm text-muted">Loading your session…</p>
        <AsyncLoadHint
          className="w-full max-w-md"
          showSlowHint={showSlowHint}
          showRecovery={showRecovery}
          slowMessage="Still connecting to ForFuture…"
          onRetry={() => window.location.reload()}
        />
      </main>
    )
  }

  if (user) {
    const dest = isOnboardingComplete(profile) ? '/feed' : '/onboarding'
    return <Navigate to={dest} replace />
  }

  return <>{children}</>
}
