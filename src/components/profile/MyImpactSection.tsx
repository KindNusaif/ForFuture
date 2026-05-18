import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Compass,
  FileText,
  Heart,
  Megaphone,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import EmptyState from '../EmptyState'
import StatCard from '../StatCard'
import { Skeleton } from '../Skeleton'
import { useAuth } from '../../hooks/useAuth'
import {
  encouragementMessage,
  loadImpactDashboard,
  type ImpactActivityItem,
} from '../../lib/impactDashboard'
import { formatError } from '../../lib/errors'
import { ONBOARDING_CAUSES } from '../../lib/onboarding'

const ACTIVITY_ICONS: Record<ImpactActivityItem['kind'], LucideIcon> = {
  follow: Heart,
  support: Heart,
  petition: Megaphone,
  volunteer: Users,
  created: FileText,
}

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    if (diff < 86_400_000) {
      return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function causeLabel(category: string): string {
  const fromOnboarding = ONBOARDING_CAUSES.find((c) => c.category === category)
  if (fromOnboarding) return fromOnboarding.label
  return category
}

export default function MyImpactSection() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof loadImpactDashboard>>['summary'] | null>(
    null,
  )
  const [activities, setActivities] = useState<ImpactActivityItem[]>([])
  const [causeBreakdown, setCauseBreakdown] = useState<
    Awaited<ReturnType<typeof loadImpactDashboard>>['causeBreakdown']
  >([])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const data = await loadImpactDashboard(user.id)
        if (cancelled) return
        setSummary(data.summary)
        setActivities(data.activities)
        setCauseBreakdown(data.causeBreakdown)
      } catch (err) {
        if (!cancelled) setError(formatError(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const preferredCauses = profile?.preferred_causes ?? []
  const preferredLabels = preferredCauses
    .map((id) => ONBOARDING_CAUSES.find((c) => c.id === id)?.label)
    .filter(Boolean) as string[]

  const isEmpty =
    summary &&
    summary.movementsFollowed === 0 &&
    summary.petitionsSigned === 0 &&
    summary.volunteerDrivesJoined === 0 &&
    summary.causesSupported === 0 &&
    activities.length === 0

  if (loading) {
    return (
      <section className="card-surface mt-6 p-5 sm:p-6" aria-labelledby="my-impact-heading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[88px] rounded-xl" />
          ))}
        </dl>
        <Skeleton className="mt-8 h-40 w-full rounded-xl" />
      </section>
    )
  }

  if (error) {
    return (
      <section className="card-surface mt-6 p-5 sm:p-6" aria-labelledby="my-impact-heading">
        <h2 id="my-impact-heading" className="section-title text-lg! sm:text-xl!">
          Your Civic Journey
        </h2>
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      </section>
    )
  }

  if (!summary) return null

  return (
    <section className="card-surface mt-6 p-5 sm:p-6" aria-labelledby="my-impact-heading">
      <h2 id="my-impact-heading" className="section-title text-lg! sm:text-xl!">
        Your Civic Journey
      </h2>
      <p className="mt-1 text-sm text-secondary">
        Every action you take helps build a better community.
      </p>

      {isEmpty ? (
        <div className="mt-6">
          <EmptyState
            icon={Compass}
            title="Your impact journey starts with your first action."
            description="Follow movements, sign petitions, or create your own to see your civic story here."
            action={{ label: 'Browse Movements', to: '/feed' }}
          />
        </div>
      ) : (
        <>
          <p className="mt-4 rounded-xl border border-default bg-muted/50 px-4 py-3 text-sm leading-relaxed text-secondary">
            {encouragementMessage(summary)}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Movements Followed" value={summary.movementsFollowed} icon={Heart} />
            <StatCard label="Petitions Signed" value={summary.petitionsSigned} icon={Megaphone} />
            <StatCard
              label="Volunteer Drives Joined"
              value={summary.volunteerDrivesJoined}
              icon={Users}
            />
            <StatCard label="Causes Supported" value={summary.causesSupported} icon={BarChart3} />
          </dl>

          {(preferredLabels.length > 0 || causeBreakdown.length > 0) && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-primary">Cause focus</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {preferredLabels.map((label) => (
                  <span key={label} className="chip-muted rounded-full px-3 py-1 text-xs font-semibold">
                    {label}
                  </span>
                ))}
                {causeBreakdown.map(({ category, count }) => (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1 rounded-full border border-default bg-surface px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {causeLabel(category)}
                    <span className="text-muted">({count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {activities.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-primary">Recent activity</h3>
              <ul className="mt-3 divide-y divide-default rounded-xl border border-default">
                {activities.map((item) => {
                  const Icon = ACTIVITY_ICONS[item.kind]
                  return (
                    <li key={item.id}>
                      <Link
                        to={item.href}
                        className="flex gap-3 px-4 py-3 transition hover:bg-muted/60"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-accent-600">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-primary">{item.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-secondary">
                            {item.movementTitle}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] font-medium text-muted">
                          {formatRelative(item.at)}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}
