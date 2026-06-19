import { Navigate } from 'react-router-dom'
import LogoutTransitionLoader from './auth/LogoutTransitionLoader'
import AdminAccessDenied from './admin/AdminAccessDenied'
import AdminLoadingSkeleton from './admin/AdminLoadingSkeleton'
import { useAuth } from '../hooks/useAuth'
import { useIsAdmin } from '../hooks/useIsAdmin'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { loading, authReady, loggingOut, user, profile, profileError } = useAuth()
  const isAdmin = useIsAdmin()
  const profileSettled =
    !user || profile !== null || Boolean(profileError)

  if (loggingOut) {
    return <LogoutTransitionLoader />
  }

  if (loading || !authReady || (user && !profileSettled)) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8" role="status" aria-live="polite" aria-label="Checking access">
        <AdminLoadingSkeleton rows={5} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <AdminAccessDenied />
  }

  return <>{children}</>
}
