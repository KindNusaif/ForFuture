import { Outlet } from 'react-router-dom'
import AppShell from './AppShell'
import ExploreLayout from './ExploreLayout'
import PageLoader from './PageLoader'
import OnboardingGate from './OnboardingGate'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from '../hooks/useAuth'

/**
 * Inspire Hub: members stay in the authenticated app shell; guests get the public explore chrome.
 * Same pattern as ImpactMapLayout, with ProtectedRoute + OnboardingGate for signed-in users.
 */
export default function InspireHubLayout() {
  const { loading, configured, isMember } = useAuth()

  if (!configured) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-secondary">Configure Supabase to use Inspire Hub.</p>
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
      <ProtectedRoute>
        <OnboardingGate>
          <AppShell>
            <Outlet />
          </AppShell>
        </OnboardingGate>
      </ProtectedRoute>
    )
  }

  return (
    <ExploreLayout>
      <Outlet />
    </ExploreLayout>
  )
}
