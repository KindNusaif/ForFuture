import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LogoutTransitionLoader from './auth/LogoutTransitionLoader'
import SessionBootstrapLoader from './auth/SessionBootstrapLoader'
import { useAuth } from '../hooks/useAuth'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { sanitizeErrorForDisplay } from '../lib/supabaseErrors'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { user, loading, authReady, loggingOut, configured, authError, profileError } = useAuth()
  const location = useLocation()
  const { showSlowHint, showRecovery } = useLoadingProgress(loading && !authError)

  if (loggingOut) {
    return <LogoutTransitionLoader />
  }

  if (!configured) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-muted px-4">
        <div className="alert-warning max-w-md p-8 text-center">
          <h1 className="text-lg font-semibold text-primary">{t('auth.setupRequiredTitle')}</h1>
          <p className="mt-2 text-sm text-secondary">{t('auth.setupRequired')}</p>
          {import.meta.env.DEV && (
            <p className="mt-3 text-xs text-muted">{t('auth.setupRequiredDevHint')}</p>
          )}
        </div>
      </main>
    )
  }

  if (loading || !authReady) {
    return <SessionBootstrapLoader showSlowHint={showSlowHint} showRecovery={showRecovery} minHeight="screen" />
  }

  if (authError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-muted px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/40">
          <h1 className="text-lg font-semibold text-primary">{t('auth.connectionFailedTitle')}</h1>
          <p className="mt-2 text-sm text-red-800 dark:text-red-200">
            {sanitizeErrorForDisplay(authError)}
          </p>
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Link to="/login" className="text-sm font-semibold text-brand-700 hover:underline">
              {t('auth.tryLoginAgain')}
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm font-semibold text-secondary hover:text-primary"
            >
              {t('auth.retryConnection')}
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <>
      {profileError && (
        <div
          className={`border-b px-4 py-3 text-center text-sm ${
            profileError.includes('APPLY_ALL_MIGRATIONS') ||
              profileError.includes('fix_database.sql')
              ? 'border-red-200 bg-red-50 text-red-900'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
          role="alert"
        >
          {sanitizeErrorForDisplay(profileError)}
        </div>
      )}
      {children}
    </>
  )
}
