import type { ReactNode } from 'react'

type AlertVariant = 'success' | 'error' | 'warning' | 'info'

const variantClass: Record<AlertVariant, string> = {
  success: 'alert-success',
  error: 'alert-error',
  warning: 'alert-warning',
  info: 'alert-info',
}

interface AlertProps {
  variant: AlertVariant
  children: ReactNode
  className?: string
  role?: 'alert' | 'status'
}

export default function Alert({
  variant,
  children,
  className = '',
  role = variant === 'error' ? 'alert' : 'status',
}: AlertProps) {
  return (
    <div className={`${variantClass[variant]} ${className}`.trim()} role={role}>
      {children}
    </div>
  )
}
