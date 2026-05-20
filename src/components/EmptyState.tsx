import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import Button from './ui/Button'

export interface EmptyStateAction {
  label: string
  to?: string
  onClick?: () => void
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: EmptyStateAction
  /** Optional supporting line below the description */
  hint?: string
  /** Tighter vertical padding for in-app feature pages */
  compact?: boolean
  children?: ReactNode
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  hint,
  compact,
  children,
}: EmptyStateProps) {
  return (
    <article
      className={`empty-state-premium card-surface px-6 text-center ${compact ? 'py-10 sm:py-12' : 'py-16 sm:py-20'}`}
    >
      <span className="empty-state-premium-icon mx-auto flex h-16 w-16 items-center justify-center" aria-hidden>
        <Icon className="h-8 w-8" />
      </span>
      <h3 className="mt-6 text-primary">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-secondary">{description}</p>
      {hint && <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-muted">{hint}</p>}
      {children}
      {action &&
        (action.to ? (
          <Link to={action.to} className="btn-primary mt-6 inline-flex">
            {action.label}
          </Link>
        ) : (
          <Button type="button" variant="primary" className="mt-6" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </article>
  )
}
