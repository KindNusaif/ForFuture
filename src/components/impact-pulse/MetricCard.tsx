import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '../Skeleton'
import { formatImpactCountFull } from '../../lib/impactPulse'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: number
  hint?: string
  loading?: boolean
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
  accent = 'accent',
}: MetricCardProps) {
  return (
    <article className="card-surface group relative min-w-0 overflow-hidden p-5 transition hover:border-accent-200/80 hover:shadow-md">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-linear-to-br from-accent-100/40 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${accentRing[accent]} shadow-inner`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {loading ? (
            <Skeleton className="h-8 w-20 rounded-lg" />
          ) : (
            <p className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
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
