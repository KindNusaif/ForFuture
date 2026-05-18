import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

export type StatCardTone = 'default' | 'accent' | 'brand' | 'teal'

const iconToneClass: Record<StatCardTone, string> = {
  default: 'metric-icon-accent',
  accent: 'metric-icon-accent',
  brand: 'metric-icon-brand',
  teal: 'metric-icon-teal',
}

export interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  tone?: StatCardTone
  /** @deprecated Prefer `tone="brand"` */
  accent?: boolean
  loading?: boolean
  className?: string
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone: toneProp = 'default',
  accent = false,
  loading = false,
  className,
}: StatCardProps) {
  const tone = accent ? 'brand' : toneProp
  return (
    <div
      className={cn(
        'rounded-xl border border-default bg-surface px-4 py-4 shadow-sm ring-1 ring-default/60',
        className,
      )}
    >
      <dt className="flex items-center gap-1.5">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
            iconToneClass[tone],
          )}
          aria-hidden
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="stat-label text-[10px] uppercase tracking-wide">{label}</span>
      </dt>
      <dd className="stat-value mt-2 text-2xl sm:text-3xl">
        {loading ? (
          <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-muted" aria-hidden />
        ) : (
          value
        )}
      </dd>
    </div>
  )
}
