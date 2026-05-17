import { Navigate, useLocation } from 'react-router-dom'
import { useAuthUser } from '../hooks/useAuthUser'

/** Legacy route — redirects to Movements while preserving query filters. */
export default function Explore() {
  const location = useLocation()
  const { isMember, loading } = useAuthUser()

  if (!loading && isMember) {
    return <Navigate to="/feed" replace />
  }

  return <Navigate to={`/movements${location.search}`} replace />
}
