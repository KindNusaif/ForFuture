import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Full-screen overlay while signing out — prevents dashboard flash. */
export default function LogoutTransitionLoader() {
  const { t } = useTranslation()

  return (
    <main
      className="auth-bootstrap-shell flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-12"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="auth-bootstrap-panel">
        <Loader2 className="auth-bootstrap-spinner h-10 w-10 animate-spin" aria-hidden />
        <p className="auth-bootstrap-title">{t('auth.loggingOut', { defaultValue: 'Logging out…' })}</p>
        <p className="mt-1 text-sm text-secondary">{t('auth.loggingOutHint', { defaultValue: 'See you soon.' })}</p>
      </div>
    </main>
  )
}
