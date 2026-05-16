import { CheckCircle2, X, XCircle } from 'lucide-react'

interface ToastProps {
  variant: 'success' | 'error'
  message: string
  detail?: string
  onDismiss: () => void
}

export default function Toast({ variant, message, detail, onDismiss }: ToastProps) {
  const isSuccess = variant === 'success'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-md ${
        isSuccess
          ? 'border-brand-200/90 bg-brand-50/95 text-brand-950'
          : 'border-red-200/90 bg-red-50/95 text-red-950'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
      ) : (
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="wrap-user-text text-sm font-semibold">{message}</p>
        {detail && <p className="wrap-user-text mt-0.5 text-sm opacity-90">{detail}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg p-1.5 opacity-70 transition hover:bg-black/5 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
