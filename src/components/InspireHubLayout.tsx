import { Loader2 } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import AppShell from './AppShell'
import ExploreLayout from './ExploreLayout'
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
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted">
        <Loader2 className="motion-essential h-10 w-10 animate-spin text-accent-600" aria-label="Loading" />
        <p className="text-sm text-muted">Loading…</p>
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
