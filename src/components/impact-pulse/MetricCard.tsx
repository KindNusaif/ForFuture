import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '../Skeleton'
import { formatImpactCountFull } from '../../lib/impactPulse'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: number
  hint?: string
  loading?: boolean
  unavailable?: boolean
  compact?: boolean
  accent?: 'brand' | 'accent' | 'teal'
}

const accentIcon: Record<NonNullable<MetricCardProps['accent']>, string> = {
  brand: 'metric-icon-brand',
  accent: 'metric-icon-accent',
  teal: 'metric-icon-teal',
}

export default function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  loading,
  unavailable = false,
  compact = false,
  accent = 'accent',
}: MetricCardProps) {
  const pad = compact ? 'p-4' : 'p-5'
  const valueClass = compact ? 'text-2xl' : 'text-3xl'

  return (
    <article
      className={`card-surface group relative min-w-0 overflow-hidden ${pad} ${
        unavailable ? 'opacity-80' : ''
      }`}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent-500/10 opacity-0 transition group-hover:opacity-100 dark:bg-accent-400/15"
        aria-hidden
      />
      <div className="relative flex items-start gap-3">
        <span
          className={`flex shrink-0 items-center justify-center rounded-xl shadow-inner ${accentIcon[accent]} ${
            compact ? 'h-9 w-9' : 'h-11 w-11'
          }`}
        >
          <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {loading ? (
            <Skeleton className={`${compact ? 'h-7' : 'h-8'} w-20 rounded-lg`} />
          ) : unavailable ? (
            <p className={`${valueClass} stat-value text-muted`} aria-label={label}>
              —
            </p>
          ) : (
            <p className={`${valueClass} stat-value tabular-nums`}>{formatImpactCountFull(value)}</p>
          )}
          <p className="stat-label mt-1 text-sm [overflow-wrap:anywhere]">{label}</p>
          {hint && <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>}
        </div>
      </div>
    </article>
  )
}
