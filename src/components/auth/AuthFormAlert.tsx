import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface AuthFormAlertProps {
  variant: 'error' | 'success'
  id?: string
  children: ReactNode
  actions?: ReactNode
}

export default function AuthFormAlert({ variant, id, children, actions }: AuthFormAlertProps) {
  const Icon = variant === 'error' ? AlertCircle : CheckCircle2

  return (
    <div
      id={id}
      role={variant === 'error' ? 'alert' : 'status'}
      className={`auth-premium-alert auth-premium-alert--inline auth-premium-alert--${variant}`}
    >
      <Icon className="auth-premium-alert-icon" aria-hidden />
      <div className="auth-premium-alert-body">
        <p className="auth-premium-alert-text">{children}</p>
        {actions ? <div className="auth-premium-alert-actions">{actions}</div> : null}
      </div>
    </div>
  )
}
