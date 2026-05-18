import { FileText } from 'lucide-react'
import CreateMovementCta from '../create/CreateMovementCta'
import { useTranslation } from 'react-i18next'
import MyMovementCard from './MyMovementCard'
import { MyMovementCardSkeleton } from '../Skeleton'
import type { Post } from '../../types'

interface MyMovementsSectionProps {
  posts: Post[]
  totalCount?: number
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  onLoadMore: () => void
  onDelete: (post: Post) => void
}

export default function MyMovementsSection({
  posts,
  totalCount,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onDelete,
}: MyMovementsSectionProps) {
  const { t } = useTranslation()

  return (
    <section className="mt-10" aria-labelledby="my-movements-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="my-movements-heading" className="section-title text-lg! sm:text-xl!">
            {t('profile.myMovements')}
          </h3>
          {!loading && (totalCount ?? posts.length) > 0 && (
            <p className="mt-0.5 text-sm text-muted">
              {t('profile.movementCount', { count: totalCount ?? posts.length })}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3">
          {[1, 2, 3].map((i) => (
            <li key={i}>
              <MyMovementCardSkeleton />
            </li>
          ))}
        </ul>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-default bg-linear-to-br from-slate-50/80 via-white to-accent-50/30 px-6 py-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-700">
            <FileText className="h-6 w-6" aria-hidden />
          </span>
          <h4 className="mt-4 text-lg font-bold text-primary">{t('profile.emptyMovementsTitle')}</h4>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-secondary">
            {t('profile.emptyMovementsDesc')}
          </p>
          <CreateMovementCta className="mt-6" />
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <MyMovementCard post={post} onDelete={onDelete} />
              </li>
            ))}
          </ul>
          {hasMore && (
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
