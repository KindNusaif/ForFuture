import { Outlet } from 'react-router-dom'
import AppShell from './AppShell'
import ExploreLayout from './ExploreLayout'
import PageLoader from './PageLoader'
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
      <main className="min-h-screen bg-muted">
        <PageLoader />
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
