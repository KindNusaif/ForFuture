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

const accentRing: Record<NonNullable<MetricCardProps['accent']>, string> = {
  brand: 'from-brand-100 to-brand-50 text-brand-700',
  accent: 'from-accent-100 to-accent-50 text-accent-700',
  teal: 'from-emerald-100 to-teal-50 text-emerald-700',
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
      className={`card-surface group relative min-w-0 overflow-hidden ${pad} transition hover:border-accent-200/80 hover:shadow-md ${
        unavailable ? 'opacity-80' : ''
      }`}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-linear-to-br from-accent-100/40 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex items-start gap-3">
        <span
          className={`flex shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${accentRing[accent]} shadow-inner ${
            compact ? 'h-9 w-9' : 'h-11 w-11'
          }`}
        >
          <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {loading ? (
            <Skeleton className={`${compact ? 'h-7' : 'h-8'} w-20 rounded-lg`} />
          ) : unavailable ? (
            <p
              className={`${valueClass} font-extrabold tracking-tight text-slate-400`}
              aria-label={label}
            >
              —
            </p>
          ) : (
            <p className={`${valueClass} font-extrabold tracking-tight text-slate-900 tabular-nums`}>
              {formatImpactCountFull(value)}
            </p>
          )}
          <p className="mt-1 text-sm font-semibold text-slate-800 [overflow-wrap:anywhere]">{label}</p>
          {hint && <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p>}
        </div>
        </div>
    </article>
  )
}
