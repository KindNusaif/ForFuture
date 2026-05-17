import { Link } from 'react-router-dom'
import { Flame, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getMovementConfig } from '../../lib/movements'
import { formatImpactCountFull } from '../../lib/impactPulse'
import type { DiscoverTrendingItem } from '../../lib/discover'
import MovementTypeBadge from '../MovementTypeBadge'
import { Skeleton } from '../Skeleton'
import DiscoverSectionShell from './DiscoverSectionShell'

interface Props {
  items: DiscoverTrendingItem[]
  loading: boolean
  error: string | null
}

export default function DiscoverTrendingSection({ items, loading, error }: Props) {
  const { t } = useTranslation()

  return (
    <DiscoverSectionShell
      eyebrow={t('discover.trendingEyebrow')}
      title={t('discover.trendingTitle')}
      subtitle={t('discover.trendingSubtitle')}
    >
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </p>
      )}

      {loading ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="card-surface p-5">
              <Skeleton className="mb-3 h-5 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-lg" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="card-surface rounded-2xl border-dashed p-8 text-center">
          <TrendingUp className="mx-auto h-10 w-10 text-muted" aria-hidden />
          <p className="mt-3 text-sm font-medium text-primary">{t('discover.trendingEmpty')}</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const movement = getMovementConfig(item.movement_type)
            return (
              <li key={item.id}>
                <Link
                  to={`/movements/${item.id}`}
                  className="group card-surface flex h-full flex-col p-5 transition hover:border-accent-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <MovementTypeBadge movementType={item.movement_type} />
                    {index === 0 && item.engagement_count > 0 && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
                        <Flame className="h-3 w-3" aria-hidden />
                        {t('discover.trendingBadge')}
                      </span>
                    )}
                  </div>
                  <h3 className="line-clamp-2 text-base font-bold text-primary group-hover:text-accent-700">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-muted">{item.category}</p>
                  {item.engagement_count > 0 && (
                    <p className="mt-auto pt-4 text-xs font-semibold text-accent-700">
                      {movement.countLabel(item.engagement_count)} ·{' '}
                      {formatImpactCountFull(item.engagement_count)}
                    </p>
                  )}
                  {item.engagement_count === 0 && index > 0 && (
                    <p className="mt-auto pt-4 text-xs font-medium text-secondary">
                      {t('discover.recentlyActive')}
                    </p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </DiscoverSectionShell>
  )
}
