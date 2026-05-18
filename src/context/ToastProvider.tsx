import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastMessage, type ToastVariant } from './toast-context'
import Toaster from '../components/ui/Toaster'

const MAX_VISIBLE = 3
const AUTO_DISMISS_MS = 5200

function createId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (toast: { variant: ToastVariant; message: string; detail?: string }) => {
      const id = createId()
      const entry: ToastMessage = { id, ...toast }

      setToasts((prev) => {
        const next = [...prev, entry]
        if (next.length <= MAX_VISIBLE) return next
        const overflow = next.length - MAX_VISIBLE
        const removed = next.slice(0, overflow)
        removed.forEach((r) => {
          const t = timersRef.current.get(r.id)
          if (t) {
            window.clearTimeout(t)
            timersRef.current.delete(r.id)
          }
        })
        return next.slice(overflow)
      })

      const timer = window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
      timersRef.current.set(id, timer)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
