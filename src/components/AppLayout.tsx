import AppShell from './AppShell'
import LogoutTransitionLoader from './auth/LogoutTransitionLoader'
import { useAuth } from '../hooks/useAuth'

export default function AppLayout() {
  const { loggingOut } = useAuth()

  if (loggingOut) {
    return <LogoutTransitionLoader />
  }

  return <AppShell />
}
