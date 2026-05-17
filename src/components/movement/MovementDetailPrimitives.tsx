import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { movementPanelClass, type MovementPanelVariant } from '../../lib/movementPanel'

export type { MovementPanelVariant }

interface MovementDetailPanelProps {
  variant?: MovementPanelVariant
  className?: string
  children: ReactNode
  'aria-labelledby'?: string
}

export function MovementDetailPanel({
  variant = 'default',
  className = '',
  children,
  'aria-labelledby': ariaLabelledBy,
}: MovementDetailPanelProps) {
  return (
    <section
      className={`${movementPanelClass(variant)} ${className}`.trim()}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </section>
  )
}

export function MovementDetailEyebrow({ children }: { children: ReactNode }) {
  return <p className="movement-detail-eyebrow">{children}</p>
}

export function MovementDetailLabel({ children }: { children: ReactNode }) {
  return <dt className="movement-detail-label">{children}</dt>
}

export function MovementDetailValue({ children }: { children: ReactNode }) {
  return <dd className="movement-detail-value">{children}</dd>
}

export function MovementDetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="wrap-user-text min-w-0">
      <MovementDetailLabel>{label}</MovementDetailLabel>
      <MovementDetailValue>{value}</MovementDetailValue>
    </div>
  )
}

export function MovementDetailRow({
  icon: Icon,
  children,
  className = '',
}: {
  icon: LucideIcon
  children: ReactNode
  className?: string
}) {
  return (
    <li className={`movement-detail-row ${className}`.trim()}>
      <Icon className="movement-detail-row-icon" aria-hidden />
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  )
}

export function MovementDetailCallout({ children }: { children: ReactNode }) {
  return <p className="movement-detail-callout">{children}</p>
}

export function MovementDetailGuidance({ children }: { children: ReactNode }) {
  return <p className="movement-detail-guidance">{children}</p>
}

export function MovementDetailStat({ label, value }: { label?: string; value: ReactNode }) {
  return (
    <div className="movement-detail-stat">
      {label && <p className="movement-detail-stat-label">{label}</p>}
      <p className="movement-detail-stat-value">{value}</p>
    </div>
  )
}
