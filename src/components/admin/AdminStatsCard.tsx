import type { LucideIcon } from 'lucide-react'

interface AdminStatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  helper?: string
  loading?: boolean
}

export default function AdminStatsCard({
  icon: Icon,
  label,
  value,
  helper,
  loading,
}: AdminStatsCardProps) {
  return (
    <article className="admin-card flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        <Icon className="h-4 w-4 text-accent-600 dark:text-accent-400" aria-hidden />
      </div>
      {loading ? (
        <div className="admin-skeleton h-8 w-20" aria-hidden />
      ) : (
        <p className="text-2xl font-semibold tabular-nums text-primary">{value}</p>
      )}
      {helper ? <p className="text-xs text-muted">{helper}</p> : null}
    </article>
  )
}
