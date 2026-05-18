import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import type { ToastVariant } from '../context/toast-context'
import { cn } from '../lib/cn'

interface ToastProps {
  variant: ToastVariant
  message: string
  detail?: string
  onDismiss: () => void
}

const variantConfig: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; className: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    className: 'toast-item toast-item-success',
    iconClass: 'text-[var(--ff-success-icon)]',
  },
  error: {
    icon: XCircle,
    className: 'toast-item toast-item-error',
    iconClass: 'text-[var(--ff-danger-icon)]',
  },
  info: {
    icon: Info,
    className: 'toast-item toast-item-info',
    iconClass: 'text-[var(--ff-info-icon)]',
  },
  warning: {
    icon: AlertTriangle,
    className: 'toast-item toast-item-warning',
    iconClass: 'text-[var(--ff-warning-icon)]',
  },
}

export default function Toast({ variant, message, detail, onDismiss }: ToastProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn('flex items-start gap-3', config.className)}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconClass)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="wrap-user-text text-sm font-semibold">{message}</p>
        {detail && <p className="wrap-user-text mt-0.5 text-sm opacity-90">{detail}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="toast-dismiss shrink-0 rounded-lg p-1.5"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}

/** Legacy alias for feed components still typed as success | error */
export type LegacyToastVariant = 'success' | 'error'
