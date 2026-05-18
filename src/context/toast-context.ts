import { createContext } from 'react'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  variant: ToastVariant
  message: string
  detail?: string
}

export interface ToastContextValue {
  toasts: ToastMessage[]
  push: (toast: Omit<ToastMessage, 'id'>) => void
  dismiss: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
