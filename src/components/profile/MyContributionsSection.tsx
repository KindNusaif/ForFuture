import { useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import CreateMovementCta from '../create/CreateMovementCta'
import { useTranslation } from 'react-i18next'
import ContributionCard from './ContributionCard'
import { MyMovementCardSkeleton } from '../Skeleton'
import {
  countContributionsByFilter,
  filterContributions,
  type ContributionFilter,
} from '../../lib/postOwnership'
import type { Post } from '../../types'

const FILTERS: ContributionFilter[] = [
  'all',
  'youth_voice',
  'petition',
  'poll',
  'volunteer',
  'relief',
  'other',
]

interface MyContributionsSectionProps {
  allPosts: Post[]
  visibleCount: number
  loading: boolean
  loadingMore: boolean
  onLoadMore: () => void
  onDelete: (post: Post) => void
}

export default function MyContributionsSection({
  allPosts,
  visibleCount,
  loading,
  loadingMore,
  onLoadMore,
  onDelete,
}: MyContributionsSectionProps) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<ContributionFilter>('all')

  const counts = useMemo(() => countContributionsByFilter(allPosts), [allPosts])
  const filtered = useMemo(() => {
    const matched = filterContributions(allPosts, filter)
    if (filter === 'all') return matched.slice(0, visibleCount)
    return matched
  }, [allPosts, filter, visibleCount])
  const hasMore = filter === 'all' && visibleCount < allPosts.length

  const filterLabel = (key: ContributionFilter) => {
    const labels: Record<ContributionFilter, string> = {
      all: t('contentOwner.filterAll'),
      youth_voice: t('contentOwner.filterYouthVoice'),
      petition: t('contentOwner.filterPetition'),
      poll: t('contentOwner.filterPoll'),
      volunteer: t('contentOwner.filterVolunteer'),
      relief: t('contentOwner.filterRelief'),
      other: t('contentOwner.filterOther'),
    }
    return labels[key]
  }

  return (
    <section className="mt-10" aria-labelledby="my-contributions-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="my-contributions-heading" className="section-title text-lg! sm:text-xl!">
            {t('contentOwner.myContributions')}
          </h3>
          <p className="mt-1 max-w-xl text-sm text-secondary">{t('contentOwner.myContributionsDesc')}</p>
          {!loading && allPosts.length > 0 && (
            <p className="mt-1 text-sm text-muted">
              {t('contentOwner.contributionCount', { count: allPosts.length })}
            </p>
          )}
        </div>
      </div>

      {!loading && allPosts.length > 0 && (
        <div
          className="contribution-filters mb-4 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label={t('contentOwner.filterLabel')}
        >
          {FILTERS.map((key) => {
            const count = counts[key]
            if (key !== 'all' && count === 0) return null
            const active = filter === key
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(key)}
                className={active ? 'contribution-filter contribution-filter-active' : 'contribution-filter'}
              >
                {filterLabel(key)}
                <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <ul className="space-y-3">
          {[1, 2, 3].map((i) => (
            <li key={i}>
              <MyMovementCardSkeleton />
            </li>
          ))}
        </ul>
      ) : allPosts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-default bg-linear-to-br from-slate-50/80 via-white to-accent-50/30 px-6 py-10 text-center dark:from-slate-900/40 dark:via-surface dark:to-accent-950/20">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-700 dark:bg-accent-950/50 dark:text-accent-300">
            <FileText className="h-6 w-6" aria-hidden />
          </span>
          <h4 className="mt-4 text-lg font-bold text-primary">{t('profile.emptyMovementsTitle')}</h4>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-secondary">
            {t('profile.emptyMovementsDesc')}
          </p>
          <CreateMovementCta className="mt-6" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-default bg-muted/30 px-4 py-8 text-center text-sm text-secondary">
          {t('contentOwner.emptyFilter')}
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {filtered.map((post) => (
              <li key={post.id}>
                <ContributionCard post={post} onDelete={onDelete} />
              </li>
            ))}
          </ul>
          {hasMore && filter === 'all' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="btn-secondary"
              >
                {loadingMore ? t('profile.loadingMore') : t('profile.loadMore')}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
