import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface AdminDashboardCardProps {
  to: string
  title: string
  description: string
  icon: LucideIcon
  pendingCount: number | null
  pendingLabel?: string
}

export default function AdminDashboardCard({
  to,
  title,
  description,
  icon: Icon,
  pendingCount,
  pendingLabel = 'Needs attention',
}: AdminDashboardCardProps) {
  const showBadge = pendingCount !== null && pendingCount > 0

  return (
    <Link
      to={to}
      className="card-surface group flex flex-col gap-3 p-5 transition hover:border-accent-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-700 dark:bg-accent-950/50 dark:text-accent-300">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        {pendingCount !== null && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
              showBadge
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                : 'bg-muted text-muted'
            }`}
          >
            {pendingCount}
          </span>
        )}
      </div>
      <div>
        <h2 className="text-lg font-bold text-primary group-hover:text-accent-700 dark:group-hover:text-accent-300">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-secondary">{description}</p>
        {showBadge && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            {pendingLabel}
          </p>
        )}
      </div>
      <span className="text-sm font-semibold text-accent-600 dark:text-accent-400">Open →</span>
    </Link>
  )
}
