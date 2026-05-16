import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

/** Redirect logged-in users away from login/signup */
export default function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth()

  if (!configured) return <>{children}</>

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-label="Loading" />
      </main>
    )
  }

  if (user) {
    return <Navigate to="/feed" replace />
  }

  return <>{children}</>
}
