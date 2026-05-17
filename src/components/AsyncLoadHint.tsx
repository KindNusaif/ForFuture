import { Loader2, RefreshCw, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AsyncLoadHintProps {
  showSlowHint: boolean
  showRecovery: boolean
  error?: string | null
  onRetry?: () => void
  slowMessage?: string
  className?: string
}

export default function AsyncLoadHint({
  showSlowHint,
  showRecovery,
  error,
  onRetry,
  slowMessage,
  className = '',
}: AsyncLoadHintProps) {
  const { t } = useTranslation()
  const slow = slowMessage ?? t('loading.slowHint')

  if (error) {
    return (
      <div className={`alert-error px-4 py-4 ${className}`} role="alert">
        <div className="flex items-start gap-3">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-950 dark:text-red-100">
              {t('loading.loadFailed')}
            </p>
            <p className="mt-1 text-sm text-red-800/90 dark:text-red-200/90">{error}</p>
            <p className="mt-2 text-xs text-red-700/80 dark:text-red-300/80">
              {t('loading.checkConnection')}
            </p>
            {onRetry && (
              <button type="button" onClick={onRetry} className="btn-secondary mt-4">
                <RefreshCw className="h-4 w-4" />
                {t('loading.retry')}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!showSlowHint && !showRecovery) return null

  return (
    <div
      className={`alert-info flex items-center gap-2 px-4 py-3 text-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent-600 dark:text-accent-400" aria-hidden />
      <span>{slow}</span>
      {showRecovery && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="link-primary ml-auto shrink-0 text-xs"
        >
          {t('loading.retryNow')}
        </button>
      )}
    </div>
  )
}
