import { Link } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
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
          <h3 id="my-movements-heading" className="text-lg font-bold text-slate-900">
            {t('profile.myMovements')}
          </h3>
          {!loading && (totalCount ?? posts.length) > 0 && (
            <p className="mt-0.5 text-sm text-slate-500">
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
        <div className="rounded-2xl border border-dashed border-slate-200 bg-linear-to-br from-slate-50/80 via-white to-accent-50/30 px-6 py-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-700">
            <FileText className="h-6 w-6" aria-hidden />
          </span>
          <h4 className="mt-4 text-lg font-bold text-slate-900">{t('profile.emptyMovementsTitle')}</h4>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            {t('profile.emptyMovementsDesc')}
          </p>
          <Link to="/create" className="btn-primary mt-6 inline-flex">
            <Plus className="h-4 w-4" aria-hidden />
            {t('profile.createMovementCta')}
          </Link>
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
