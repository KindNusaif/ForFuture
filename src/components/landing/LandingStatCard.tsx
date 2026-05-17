import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '../Skeleton'

interface LandingStatCardProps {
  value: string
  label: string
  icon: LucideIcon
  loading?: boolean
  live?: boolean
}

export default function LandingStatCard({
  value,
  label,
  icon: Icon,
  loading = false,
  live = false,
}: LandingStatCardProps) {
  return (
    <article className="landing-stat-card group">
      <div className="flex items-start justify-between gap-2">
        <span className="landing-stat-icon" aria-hidden>
          <Icon className="h-5 w-5" />
        </span>
        {live && !loading && (
          <span className="landing-stat-live-badge" aria-hidden>
            <span className="landing-stat-live-dot" />
          </span>
        )}
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-4 h-8 w-20 rounded-lg sm:h-9" />
          <Skeleton className="mt-2 h-4 w-full max-w-[12rem] rounded-md" />
        </>
      ) : (
        <>
          <p className="landing-stat-value mt-4 tabular-nums">{value}</p>
          <p className="landing-stat-label mt-1.5">{label}</p>
        </>
      )}
    </article>
  )
}
