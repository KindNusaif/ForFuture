import Toast from '../Toast'
import type { ToastMessage } from '../../context/toast-context'

interface ToasterProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export default function Toaster({ toasts, onDismiss }: ToasterProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="toast-stack pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-end gap-2 px-4 sm:inset-x-auto sm:right-4 sm:top-4 sm:max-w-sm"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-enter pointer-events-auto w-full max-w-sm">
          <Toast
            variant={toast.variant}
            message={toast.message}
            detail={toast.detail}
            onDismiss={() => onDismiss(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}
