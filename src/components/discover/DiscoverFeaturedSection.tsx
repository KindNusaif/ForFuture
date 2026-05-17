import { Link } from 'react-router-dom'
import { ArrowRight, HandHeart, Lightbulb, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DiscoverFeaturedItem } from '../../lib/discover'
import { Skeleton } from '../Skeleton'
import DiscoverSectionShell from './DiscoverSectionShell'

interface Props {
  volunteer: DiscoverFeaturedItem[]
  civic: DiscoverFeaturedItem[]
  rising: DiscoverFeaturedItem[]
  loading: boolean
}

function FeaturedColumn({
  title,
  icon: Icon,
  items,
  emptyLabel,
}: {
  title: string
  icon: typeof HandHeart
  items: DiscoverFeaturedItem[]
  emptyLabel: string
}) {
  return (
    <div className="card-surface flex min-w-0 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-default px-4 py-3">
        <Icon className="h-4 w-4 text-accent-600" aria-hidden />
        <h3 className="text-sm font-bold text-primary">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-secondary">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-default">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={`/movements/${item.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-accent-500"
              >
                <span className="line-clamp-2 font-medium text-primary">{item.title}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function DiscoverFeaturedSection({ volunteer, civic, rising, loading }: Props) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <DiscoverSectionShell
        eyebrow={t('discover.featuredEyebrow')}
        title={t('discover.featuredTitle')}
        subtitle={t('discover.featuredSubtitle')}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </DiscoverSectionShell>
    )
  }

  const allEmpty = volunteer.length === 0 && civic.length === 0 && rising.length === 0

  return (
    <DiscoverSectionShell
      eyebrow={t('discover.featuredEyebrow')}
      title={t('discover.featuredTitle')}
      subtitle={t('discover.featuredSubtitle')}
    >
      {allEmpty ? (
        <div className="card-surface rounded-2xl border-dashed p-8 text-center">
          <HandHeart className="mx-auto h-10 w-10 text-muted" aria-hidden />
          <p className="mt-3 text-sm font-medium text-primary">{t('discover.featuredEmpty')}</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <FeaturedColumn
            title={t('discover.featuredVolunteer')}
            icon={HandHeart}
            items={volunteer}
            emptyLabel={t('discover.featuredVolunteerEmpty')}
          />
          <FeaturedColumn
            title={t('discover.featuredCivic')}
            icon={Scale}
            items={civic}
            emptyLabel={t('discover.featuredCivicEmpty')}
          />
          <FeaturedColumn
            title={t('discover.featuredRising')}
            icon={Lightbulb}
            items={rising}
            emptyLabel={t('discover.featuredRisingEmpty')}
          />
        </div>
      )}
    </DiscoverSectionShell>
  )
}
