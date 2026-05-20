import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Plus, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import InspireCard from '../components/inspire/InspireCard'
import EmptyState from '../components/EmptyState'
import PageContainer from '../components/ui/PageContainer'
import SkeletonCard from '../components/ui/SkeletonCard'
import { useAuthUser } from '../hooks/useAuthUser'
import { useAuthGate } from '../hooks/useAuthGate'
import { fetchCommentCount } from '../lib/comments'
import { fetchInspirePostsPage, fetchSavedInspireIds } from '../lib/inspire'
import { INSPIRE_FILTER_CHIPS, isInspireCategory } from '../lib/inspireCategories'
import { isRequestAborted, withAutoRetry } from '../lib/supabaseRequest'
import type { InspireCategoryFilter, InspirePost } from '../types/inspire'

export default function InspireHub() {
  const { t } = useTranslation()
  const { user, isGuest } = useAuthUser()
  const { gate } = useAuthGate()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const filterParam = searchParams.get('category')
  const activeFilter: InspireCategoryFilter =
    filterParam && filterParam !== 'all' && isInspireCategory(filterParam) ? filterParam : 'all'

  const [posts, setPosts] = useState<InspirePost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const requestIdRef = useRef(0)

  const createPath = '/inspire/create'

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      const requestId = ++requestIdRef.current
      if (!append) setLoading(true)
      else setLoadingMore(true)

      try {
        const { posts: pagePosts, hasMore: more, nextOffset: next } = await withAutoRetry(() =>
          fetchInspirePostsPage({
            offset,
            category: activeFilter === 'all' ? undefined : activeFilter,
            viewerUserId: user?.id,
          }),
        )

        if (requestId !== requestIdRef.current) return

        let enriched = pagePosts
        if (user?.id) {
          const savedIds = await fetchSavedInspireIds(user.id)
          enriched = pagePosts.map((p) => ({ ...p, saved_by_me: savedIds.has(p.id) }))
        }

        setPosts((prev) => (append ? [...prev, ...enriched] : enriched))
        setHasMore(more)
        setNextOffset(next)
        setError(null)
      } catch (err) {
        if (requestId !== requestIdRef.current || isRequestAborted(err)) return
        console.error(err)
        setError(
          t('inspire.loadFailed', {
            defaultValue: 'We couldn’t load Inspire Hub stories right now. Please try again.',
          }),
        )
        if (!append) setPosts([])
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [activeFilter, user?.id, t],
  )

  useEffect(() => {
    void loadPage(0, false)
  }, [loadPage])

  useEffect(() => {
    if (posts.length === 0) return
    let cancelled = false
    void (async () => {
      const counts: Record<string, number> = {}
      await Promise.all(
        posts.map(async (p) => {
          counts[p.id] = await fetchCommentCount(p.id, 'inspire')
        }),
      )
      if (!cancelled) setCommentCounts(counts)
    })()
    return () => {
      cancelled = true
    }
  }, [posts])

  function handleFilterChange(id: InspireCategoryFilter) {
    const next = new URLSearchParams(searchParams)
    if (id === 'all') next.delete('category')
    else next.set('category', id)
    setSearchParams(next, { replace: true })
  }

  function handleCreateClick() {
    if (isGuest) {
      gate('inspire')
      return
    }
    navigate(createPath)
  }

  const showEmpty = !loading && posts.length === 0
  const emptyFiltered = activeFilter !== 'all'

  return (
    <PageContainer className="inspire-hub-page !py-6 lg:!py-8">
      <header className="inspire-hub-hero impact-page-hero relative mb-8 overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="eyebrow inline-flex items-center gap-2 uppercase tracking-widest">
              <Sparkles className="h-4 w-4" aria-hidden />
              {t('inspire.heroEyebrow', { defaultValue: 'INSPIRE HUB' })}
            </p>
            <h1 className="mt-3 font-display text-2xl font-normal tracking-tight sm:text-3xl lg:text-4xl">
              {t('inspire.heroTitle', { defaultValue: 'Share progress. Spark ideas. Inspire action.' })}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              {t('inspire.heroSubtitle', {
                defaultValue:
                  'ForFuture is not only where youth raise issues — it is where youth celebrate progress, share ideas, learn from one another, and turn inspiration into action.',
              })}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
              {t('inspire.heroSupporting', {
                defaultValue:
                  'Celebrate achievements, success stories, lessons, entrepreneurship journeys, innovation ideas, and book insights that help youth grow and move forward.',
              })}
            </p>
          </div>
          {isGuest ? (
            <button type="button" onClick={handleCreateClick} className="btn-primary shrink-0 self-start sm:self-auto">
              <Plus className="h-4 w-4" aria-hidden />
              {t('inspire.shareStory', { defaultValue: 'Share Your Story' })}
            </button>
          ) : (
            <Link to={createPath} className="btn-primary shrink-0 self-start sm:self-auto">
              <Plus className="h-4 w-4" aria-hidden />
              {t('inspire.shareStory', { defaultValue: 'Share Your Story' })}
            </Link>
          )}
        </div>
      </header>

      <nav
        className="inspire-filter-chips mb-6 flex flex-wrap gap-2 sm:flex-nowrap sm:overflow-x-auto sm:pb-1"
        aria-label={t('inspire.filtersAria', { defaultValue: 'Inspire categories' })}
      >
        {INSPIRE_FILTER_CHIPS.map(({ id, labelKey, labelDefault }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleFilterChange(id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeFilter === id
                ? 'bg-accent-600 text-white shadow-sm dark:bg-accent-500'
                : 'border border-default bg-surface text-secondary hover:bg-muted'
            }`}
            aria-pressed={activeFilter === id}
          >
            {t(labelKey, { defaultValue: labelDefault })}
          </button>
        ))}
      </nav>

      {error && (
        <div className="alert-warning mb-6 flex flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => void loadPage(0, false)} className="btn-secondary shrink-0 text-sm">
            {t('inspire.retry', { defaultValue: 'Try again' })}
          </button>
        </div>
      )}

      {loading && posts.length === 0 ? (
        <>
          <p className="sr-only">{t('inspire.loading', { defaultValue: 'Loading inspiration…' })}</p>
          <ul className="space-y-4 sm:space-y-5">
            {[0, 1, 2].map((i) => (
              <li key={i}>
                <SkeletonCard />
              </li>
            ))}
          </ul>
        </>
      ) : showEmpty ? (
        <EmptyState
          icon={Sparkles}
          title={
            emptyFiltered
              ? t('inspire.emptyFilterTitle', { defaultValue: 'No stories in this category yet' })
              : t('inspire.emptyTitle', { defaultValue: 'No stories shared yet' })
          }
          description={
            emptyFiltered
              ? t('inspire.emptyFilterDescription', {
                  defaultValue: 'Be the first to share something meaningful and help others grow.',
                })
              : t('inspire.emptyDescription', {
                  defaultValue:
                    'Be the first to celebrate progress, share an idea, or pass on a lesson that could inspire another young person.',
                })
          }
          action={
            isGuest
              ? { label: t('inspire.shareStory', { defaultValue: 'Share Your Story' }), onClick: handleCreateClick }
              : { label: t('inspire.shareStory', { defaultValue: 'Share Your Story' }), to: createPath }
          }
        />
      ) : (
        <>
          <ul className="space-y-4 sm:space-y-5">
            {posts.map((post) => (
              <li key={post.id}>
                <InspireCard
                  post={post}
                  detailPath={`/inspire/${post.id}`}
                  currentUserId={user?.id}
                  commentCount={commentCounts[post.id] ?? 0}
                  onSavedChange={(postId, saved) => {
                    setPosts((prev) =>
                      prev.map((p) => (p.id === postId ? { ...p, saved_by_me: saved } : p)),
                    )
                  }}
                />
              </li>
            ))}
          </ul>
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => void loadPage(nextOffset, true)}
                disabled={loadingMore}
                className="btn-secondary inline-flex min-h-11 items-center justify-center gap-2 px-6"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t('inspire.loadingMore', { defaultValue: 'Loading more…' })}
                  </>
                ) : (
                  t('inspire.loadMore', { defaultValue: 'Load more' })
                )}
              </button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  )
}
