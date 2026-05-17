import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useIsAdmin } from '../hooks/useIsAdmin'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth()
  const isAdmin = useIsAdmin()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
        <p className="text-sm text-muted">Checking access…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/feed" replace />
  }

  return <>{children}</>
}
