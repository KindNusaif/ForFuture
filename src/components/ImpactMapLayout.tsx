import { Loader2 } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import ExploreLayout from './ExploreLayout'
import { useAuth } from '../hooks/useAuth'

/**
 * Impact Map and Youth Impact Pulse use the same public layout as localhost,
 * whether the visitor is signed in or not (avoids AppShell vs Explore mismatch on Netlify).
 */
export default function ImpactMapLayout() {
  const { loading, configured } = useAuth()

  if (!configured) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-secondary">Configure Supabase to use the Impact Map.</p>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted">
        <Loader2 className="h-10 w-10 animate-spin text-accent-600" aria-label="Loading" />
        <p className="text-sm text-muted">Loading…</p>
      </main>
    )
  }

  return (
    <ExploreLayout>
      <Outlet />
    </ExploreLayout>
  )
}
