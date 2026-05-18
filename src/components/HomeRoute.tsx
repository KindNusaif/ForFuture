import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isAuthProfileReady } from '../lib/authReady'
import { isOnboardingComplete } from '../lib/onboarding'
import PageLoader from './PageLoader'
import Landing from '../pages/Landing'

/**
 * Marketing home for guests; signed-in members go to feed (or onboarding).
 */
export default function HomeRoute() {
  const { loading, isMember, user, profile, profileError } = useAuth()
  const profileReady = isAuthProfileReady(loading, user?.id, profile, profileError)

  if (!profileReady) {
    return <PageLoader />
  }

  if (isMember) {
    if (!isOnboardingComplete(profile)) {
      return <Navigate to="/onboarding" replace />
    }
    return <Navigate to="/feed" replace />
  }

  return <Landing />
}
