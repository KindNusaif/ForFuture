import { Loader2 } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import AppShell from './AppShell'
import ExploreLayout from './ExploreLayout'
import { useAuth } from '../hooks/useAuth'

/**
 * Impact Map & Youth Impact Pulse: signed-in members keep the app shell (feed sidebar);
 * guests use public marketing layout.
 */
export default function ImpactMapLayout() {
  const { loading, configured, isMember } = useAuth()

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
        <Loader2 className="motion-essential h-10 w-10 animate-spin text-accent-600" aria-label="Loading" />
        <p className="text-sm text-muted">Loading…</p>
      </main>
    )
  }

  if (isMember) {
    return (
      <AppShell>
        <Outlet />
      </AppShell>
    )
  }

  return (
    <ExploreLayout>
      <Outlet />
    </ExploreLayout>
  )
}
