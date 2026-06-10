import LandingLovable from '../pages/LandingLovable'
import LandingPageShell from './auth/LandingPageShell'
import { useAuth } from '../hooks/useAuth'

/** Marketing home at `/` — waits for auth before showing member CTAs. */
export default function HomeRoute() {
  const { authReady, loggingOut } = useAuth()

  if (!authReady || loggingOut) {
    return <LandingPageShell />
  }

  return <LandingLovable />
}
