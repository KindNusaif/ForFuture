import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AsyncLoadHint from '../AsyncLoadHint'

/** Branded full-screen loader while Supabase session + profile are resolving (GuestRoute / ProtectedRoute). */
export default function SessionBootstrapLoader({
  showSlowHint,
  showRecovery,
  minHeight = 'screen',
}: {
  showSlowHint: boolean
  showRecovery: boolean
  minHeight?: 'screen' | 'half'
}) {
  const { t } = useTranslation()
  const heightClass = minHeight === 'screen' ? 'min-h-screen' : 'min-h-[50vh]'

  return (
    <main
      className={`auth-bootstrap-shell flex ${heightClass} flex-col items-center justify-center gap-6 px-4 py-12`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="auth-bootstrap-panel">
        <div className="auth-bootstrap-mark" aria-hidden>
          <span className="auth-bootstrap-dot" />
        </div>
        <Loader2 className="auth-bootstrap-spinner h-10 w-10 animate-spin" aria-hidden />
        <p className="auth-bootstrap-title">{t('auth.sessionLoading')}</p>
        <AsyncLoadHint
          className="auth-bootstrap-hint w-full max-w-md border-0 bg-transparent p-0 text-center shadow-none"
          showSlowHint={showSlowHint}
          showRecovery={showRecovery}
          slowMessage={t('auth.sessionSlow')}
          onRetry={() => window.location.reload()}
        />
      </div>
    </main>
  )
}
