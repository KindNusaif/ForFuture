import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AsyncLoadHint from './AsyncLoadHint'
import { useAuth } from '../hooks/useAuth'
import { useLoadingProgress } from '../hooks/useLoadingProgress'

/** Redirect logged-in users away from login/signup */
export default function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth()
  const { showSlowHint, showRecovery } = useLoadingProgress(loading)

  if (!configured) return <>{children}</>

  if (loading) {
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
    return <Navigate to="/feed" replace />
  }

  return <>{children}</>
}
