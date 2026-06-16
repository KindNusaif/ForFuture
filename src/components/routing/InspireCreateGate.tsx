import { Navigate, useLocation } from 'react-router-dom'
import LogoutTransitionLoader from '../auth/LogoutTransitionLoader'
import PageLoader from '../PageLoader'
import { useAuth } from '../../hooks/useAuth'
import InspireCreate from '../../pages/InspireCreate'

/** `/inspire/create` is member-only; guests are sent to login with return path. */
export default function InspireCreateGate() {
  const { user, authReady, loggingOut } = useAuth()
  const location = useLocation()

  if (!authReady || loggingOut) {
    if (loggingOut) {
      return <LogoutTransitionLoader />
    }
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <InspireCreate />
}
