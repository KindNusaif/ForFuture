import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import FullScreenLoader from './FullScreenLoader'

/** Global overlay during sign-out — covers route change from app shell to landing. */
export default function LogoutOverlay() {
  const { loggingOut } = useAuth()
  const { t } = useTranslation()

  if (!loggingOut) return null

  return (
    <FullScreenLoader
      overlay
      title={t('auth.loggingOut', { defaultValue: 'Logging out…' })}
      hint={t('auth.loggingOutHint', { defaultValue: 'See you soon.' })}
    />
  )
}
