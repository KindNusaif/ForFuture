import type { LucideIcon } from 'lucide-react'
import { AlertCircle } from 'lucide-react'

interface ErrorStateProps {
  title: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  icon?: LucideIcon
  className?: string
}

export default function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = 'Try again',
  icon: Icon = AlertCircle,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`alert-error px-5 py-5 ${className}`} role="alert">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Icon className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-red-950 dark:text-red-100">{title}</p>
          {description && (
            <p className="mt-1 text-sm text-red-800/90 dark:text-red-200/90">{description}</p>
          )}
          {onRetry && (
            <button type="button" onClick={onRetry} className="btn-secondary mt-4">
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
