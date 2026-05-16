import { Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AppShell from './AppShell'
import ExploreLayout from './ExploreLayout'
import { useAuth } from '../hooks/useAuth'

/**
 * Keeps members inside AppShell (session + nav) while guests use public explore chrome.
 * Prevents the “logged out” feeling when opening Impact Map from the feed sidebar.
 */
export default function ImpactMapLayout() {
  const { isMember, loading, configured } = useAuth()

  if (!configured) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-slate-600">Configure Supabase to use the Impact Map.</p>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-accent-600" aria-label="Loading" />
        <p className="text-sm text-slate-500">Loading Impact Map…</p>
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
