import { useContext } from 'react'
import { ToastContext, type ToastVariant } from '../context/toast-context'

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }

  return {
    toast: (variant: ToastVariant, message: string, detail?: string) => {
      ctx.push({ variant, message, detail })
    },
    success: (message: string, detail?: string) => ctx.push({ variant: 'success', message, detail }),
    error: (message: string, detail?: string) => ctx.push({ variant: 'error', message, detail }),
    info: (message: string, detail?: string) => ctx.push({ variant: 'info', message, detail }),
    warning: (message: string, detail?: string) => ctx.push({ variant: 'warning', message, detail }),
    dismiss: ctx.dismiss,
  }
}
