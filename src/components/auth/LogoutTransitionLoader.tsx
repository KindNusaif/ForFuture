import { useTranslation } from 'react-i18next'
import FullScreenLoader from './FullScreenLoader'

/** Full-screen loader while signing out on protected routes. */
export default function LogoutTransitionLoader() {
  const { t } = useTranslation()

  return (
    <FullScreenLoader
      title={t('auth.loggingOut', { defaultValue: 'Signing out…' })}
      hint={t('auth.loggingOutHint', { defaultValue: 'See you soon.' })}
    />
  )
}
