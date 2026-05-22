import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Inbox, Loader2 } from 'lucide-react'
import CreateMovementCta from './create/CreateMovementCta'
import EmptyState from './EmptyState'
import FeedDiscoveryBar from './FeedDiscoveryBar'
import FeedTabs, { type FeedTab } from './FeedTabs'
import SafePostCard from './SafePostCard'
import { FeedPostListSkeleton } from './Skeleton'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useToast } from '../hooks/useToast'
import { useAuthGate } from '../hooks/useAuthGate'
import { guestMovementDetailPath } from '../lib/guestExplore'
import type { JoinMovementModalVariant } from '../context/join-movement-context'
import { supportGateVariant } from '../lib/guestGate'
import { getMovementConfig } from '../lib/movements'
import type { MovementFilter } from '../lib/movements'
import { isPollMovement } from '../lib/movements'
import { isPetitionMovement } from '../lib/petitions'
import { signPetition } from '../lib/petitionSignatures'
import { castPollVote } from '../lib/polls'
import AsyncLoadHint from './AsyncLoadHint'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import {
  DEFAULT_FEED_PAGE_SIZE,
  enrichPosts,
  fetchFeedRowsPage,
  normalizePostForDisplay,
} from '../lib/posts'
import { withAutoRetry } from '../lib/supabaseRequest'
import { isRequestAborted } from '../lib/supabaseRequest'
import { getActionSuccessMessage } from '../lib/movements'
import { togglePostAction } from '../lib/postActions'
import { formatError } from '../lib/errors'
import {
  buildMovementsSearchParams,
  parseCategoryFromUrl,
  parseMovementFilterFromUrl,
} from '../lib/feedUrlFilters'
import type { ReliefHubFilter } from '../lib/reliefHub'
import { matchesReliefTab, type ReliefHubTab } from '../lib/reliefCampaignPublic'
import { applyFollowStateToPosts } from '../lib/movementFollows'
import { canPostHaveComments } from '../lib/commentEligibility'
import { fetchCommentCountsForPosts } from '../lib/comments'
import { useMovementFollows } from '../hooks/useMovementFollows'
import {
  buildFeedCacheKey,
  getFeedCache,
  invalidateFeedCache,
  setFeedCache,
} from '../lib/feedTabCache'
import type { Category, MovementType, Post } from '../types'

export type { FeedTab }

export interface FeedToast {
  type: 'success' | 'error'
  message: string
  detail?: string
}

interface PostFeedProps {
  mode: 'guest' | 'member'
  userId?: string
  toast?: FeedToast | null
  onToastDismiss?: () => void
  showCreateButton?: boolean
  reliefHub?: boolean
  reliefSubtype?: ReliefHubFilter
  reliefHubTab?: ReliefHubTab
  reliefSearchQuery?: string
  reliefDetailBase?: string
  /** Read/write ?category= and ?type= on /explore (guest discover links). */
  syncFiltersFromUrl?: boolean
  feedTab?: FeedTab
  onFeedTabChange?: (tab: FeedTab) => void
  className?: string
}

function serverMovementType(filter: MovementFilter): MovementType | undefined {
  if (filter === 'All' || filter === 'donation_relief_hub') return undefined
  return filter
}

function serverCategory(category: Category | 'All'): Category | undefined {
  return category === 'All' ? undefined : category
}

function PostFeedContent({
  mode,
  userId,
  toast: toastProp = null,
  onToastDismiss,
  showCreateButton = true,
  reliefHub = false,
  reliefSubtype = 'all',
  reliefHubTab = 'all',
  reliefSearchQuery,
  reliefDetailBase = '/relief',
  syncFiltersFromUrl = false,
  feedTab = 'discover',
  onFeedTabChange,
  className = '',
}: PostFeedProps) {
  const { t } = useTranslation()
  const { gate, openJoinModal } = useAuthGate()
  const isGuest = mode === 'guest'
  const viewerUserId = isGuest ? undefined : userId
  const isFollowingFeed = !isGuest && feedTab === 'following'
  const movementFollows = useMovementFollows(viewerUserId)
  const [searchParams, setSearchParams] = useSearchParams()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [enriching, setEnriching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [localCategory, setLocalCategory] = useState<Category | 'All'>('All')
  const [localMovementFilter, setLocalMovementFilter] = useState<MovementFilter>('All')

  const category = syncFiltersFromUrl
    ? parseCategoryFromUrl(searchParams.get('category'))
    : localCategory
  const movementFilter = syncFiltersFromUrl
    ? parseMovementFilterFromUrl(searchParams.get('type'))
    : localMovementFilter
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [supportingId, setSupportingId] = useState<string | null>(null)
  const [petitionSigningId, setPetitionSigningId] = useState<string | null>(null)
  const [pollVotingId, setPollVotingId] = useState<string | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const toast = useToast()

  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const followsRef = useRef(movementFollows)
  useEffect(() => {
    followsRef.current = movementFollows
  }, [movementFollows])

  const followedIdsKey = useMemo(() => {
    if (!isFollowingFeed) return ''
    return [...movementFollows.followedIds].sort().join(',')
  }, [isFollowingFeed, movementFollows.followedIds])

  const isRequestActive = loading || enriching || loadingMore
  const { showSlowHint, showRecovery } = useLoadingProgress(isRequestActive)

  const feedCacheKey = useMemo(() => {
    if (isGuest || reliefHub) return ''
    return buildFeedCacheKey({
      feedTab,
      movementFilter,
      category,
      reliefHub,
      reliefSubtype,
      followedIdsKey,
    })
  }, [
    isGuest,
    reliefHub,
    feedTab,
    movementFilter,
    category,
    reliefSubtype,
    followedIdsKey,
  ])

  const loadPage = useCallback(
    async (offset: number, append: boolean, options?: { silent?: boolean }) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const requestId = ++requestIdRef.current
      const follows = followsRef.current

      if (append) {
        setLoadingMore(true)
      } else if (options?.silent) {
        setEnriching(true)
        setError(null)
      } else {
        setLoading(true)
        setEnriching(false)
        setError(null)
      }

      try {
        const hubActive = reliefHub || movementFilter === 'donation_relief_hub'
        const followedIds =
          isFollowingFeed && !follows.loading ? [...follows.followedIds] : undefined

        if (isFollowingFeed && follows.loading) {
          if (!append) {
            setLoading(true)
            setEnriching(false)
          }
          return
        }

        if (isFollowingFeed && followedIds && followedIds.length === 0) {
          if (!append) {
            setPosts([])
            setHasMore(false)
            setNextOffset(0)
            setError(null)
            setLoading(false)
            setEnriching(false)
          }
          return
        }

        const pageParams = {
          viewerUserId,
          offset,
          limit: DEFAULT_FEED_PAGE_SIZE,
          movementType:
            isFollowingFeed || hubActive ? undefined : serverMovementType(movementFilter),
          category: isFollowingFeed ? serverCategory(category) : serverCategory(category),
          reliefHub: isFollowingFeed ? false : hubActive,
          reliefSubtype: hubActive && !isFollowingFeed ? (reliefHub ? reliefSubtype : 'all') : undefined,
          movementIds: isFollowingFeed ? followedIds : undefined,
        }

        const { rows, hasMore: more, nextOffset: next } = await withAutoRetry(
          () => fetchFeedRowsPage(pageParams, controller.signal),
          { signal: controller.signal },
        )

        if (requestId !== requestIdRef.current || controller.signal.aborted) return

        if (!append) {
          setEnriching(true)
        }

        const enriched = await withAutoRetry(
          () => enrichPosts(rows, viewerUserId, controller.signal),
          { signal: controller.signal },
        )

        if (requestId !== requestIdRef.current || controller.signal.aborted) return

        const withFollow = isGuest
          ? enriched
          : applyFollowStateToPosts(enriched, follows.followedIds, follows.followerCounts)
        const normalized = withFollow.map(normalizePostForDisplay)
        setPosts((prev) => (append ? [...prev, ...normalized] : normalized))
        setHasMore(more)
        setNextOffset(next)
        setError(null)
        if (!append && feedCacheKey) {
          setFeedCache(feedCacheKey, {
            posts: withFollow,
            hasMore: more,
            nextOffset: next,
          })
        }
        if (!isGuest && withFollow.length > 0) {
          void follows.refreshCountsForPosts(withFollow.map((p) => p.id))
        }
      } catch (err) {
        if (requestId !== requestIdRef.current || isRequestAborted(err)) return
        setError(formatError(err))
        if (!append && !options?.silent) setPosts([])
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
          setEnriching(false)
          setLoadingMore(false)
        }
      }
    },
    [
      viewerUserId,
      movementFilter,
      category,
      reliefHub,
      reliefSubtype,
      isFollowingFeed,
      followedIdsKey,
      feedCacheKey,
    ],
  )

  const updateUrlFilters = useCallback(
    (nextCategory: Category | 'All', nextMovement: MovementFilter) => {
      if (!syncFiltersFromUrl) return
      const next = buildMovementsSearchParams({
        category: nextCategory,
        movementFilter: nextMovement,
      })
      const current = searchParams.toString()
      const built = next.toString()
      if (current === built) return
      setSearchParams(next, { replace: true })
    },
    [syncFiltersFromUrl, searchParams, setSearchParams],
  )

  const handleCategoryChange = useCallback(
    (value: Category | 'All') => {
      if (syncFiltersFromUrl) {
        updateUrlFilters(value, movementFilter)
      } else {
        setLocalCategory(value)
      }
    },
    [movementFilter, syncFiltersFromUrl, updateUrlFilters],
  )

  const handleMovementFilterChange = useCallback(
    (value: MovementFilter) => {
      if (syncFiltersFromUrl) {
        updateUrlFilters(category, value)
      } else {
        setLocalMovementFilter(value)
      }
    },
    [category, syncFiltersFromUrl, updateUrlFilters],
  )

  useEffect(() => {
    if (isFollowingFeed && movementFollows.loading) {
      setLoading(true)
      return
    }

    const cached = feedCacheKey ? getFeedCache(feedCacheKey) : null
    if (cached) {
      setPosts(cached.posts.map(normalizePostForDisplay))
      setHasMore(cached.hasMore)
      setNextOffset(cached.nextOffset)
      setLoading(false)
      setEnriching(false)
      setError(null)
    }

    const timer = window.setTimeout(() => {
      void loadPage(0, false, cached ? { silent: true } : undefined)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [loadPage, isFollowingFeed, movementFollows.loading, feedCacheKey])

  useEffect(() => {
    if (isGuest) return
    setPosts((prev) =>
      applyFollowStateToPosts(prev, movementFollows.followedIds, movementFollows.followerCounts),
    )
  }, [movementFollows.followerCounts, movementFollows.followedIds, isGuest])

  const filtered = useMemo(() => {
    let list = posts
    if (reliefHub) {
      list = list.filter((p) =>
        matchesReliefTab(p, reliefHubTab, { ownerUserId: userId }),
      )
    }
    const q = (reliefSearchQuery ?? debouncedSearch).trim().toLowerCase()
    if (!q) return list

    return list.filter((p) => {
      const title = (p.title ?? '').toLowerCase()
      const description = (p.description ?? '').toLowerCase()
      const summary = (p.campaign_summary ?? '').toLowerCase()
      const author = (p.author_name ?? '').toLowerCase()
      const category = (p.category ?? 'Other').toLowerCase()
      const movementLabel = getMovementConfig(p.movement_type).label.toLowerCase()
      return (
        title.includes(q) ||
        description.includes(q) ||
        summary.includes(q) ||
        author.includes(q) ||
        category.includes(q) ||
        movementLabel.includes(q)
      )
    })
  }, [posts, debouncedSearch, reliefSearchQuery, reliefHub, reliefHubTab, userId])

  const commentEligibleIds = useMemo(
    () => filtered.filter((p) => canPostHaveComments(p)).map((p) => p.id),
    [filtered],
  )

  useEffect(() => {
    if (commentEligibleIds.length === 0) {
      setCommentCounts({})
      return
    }
    let cancelled = false
    void fetchCommentCountsForPosts(commentEligibleIds).then((counts) => {
      if (!cancelled) setCommentCounts(counts)
    })
    return () => {
      cancelled = true
    }
  }, [commentEligibleIds])

  const showFeedLoading =
    loading || (isFollowingFeed && movementFollows.loading) || (enriching && posts.length === 0)

  const emptyState = useMemo(() => {
    if (isFollowingFeed) {
      return {
        title: t('feed.followingEmptyTitle'),
        description: t('feed.followingEmptyDescription'),
      }
    }
    if (debouncedSearch.trim()) {
      return {
        title: 'No movements matched your search',
        description: isGuest
          ? t('explore.guestEmptyFilter')
          : hasMore
            ? 'Try different words or load more movements to search further.'
            : 'Try different words or reset your filters.',
      }
    }
    if (reliefHub) {
      const hasFilter =
        reliefHubTab !== 'all' || Boolean((reliefSearchQuery ?? debouncedSearch).trim())
      return {
        title: t(hasFilter ? 'reliefHub.emptyFilterTitle' : 'reliefHub.emptyTitle'),
        description: t(hasFilter ? 'reliefHub.emptyFilterBody' : 'reliefHub.emptyBody'),
      }
    }
    if (movementFilter !== 'All' && movementFilter !== 'donation_relief_hub') {
      const cfg = getMovementConfig(movementFilter)
      return { title: cfg.emptyTitle, description: cfg.emptyDescription }
    }
    if (movementFilter === 'donation_relief_hub') {
      return {
        title: 'No relief requests found',
        description: 'Try another filter or explore other movement types.',
      }
    }
    if (category !== 'All') {
      return {
        title: `No ${category} movements`,
        description: isGuest
          ? t('explore.guestEmptyFilter')
          : 'Try another category or movement type.',
      }
    }
    return {
      title: 'No movements yet',
      description: isGuest
        ? t('explore.guestEmptyDefault')
        : 'Be the first to create a youth movement on ForFuture.',
    }
  }, [
    debouncedSearch,
    reliefSearchQuery,
    reliefHubTab,
    movementFilter,
    category,
    isGuest,
    hasMore,
    reliefHub,
    isFollowingFeed,
    t,
  ])

  function handleRestrictedAction(variant: JoinMovementModalVariant = 'default') {
    gate(variant)
  }

  function handleGuestTabChange(tab: FeedTab) {
    if (isGuest && tab === 'following') {
      openJoinModal('following')
      return
    }
    onFeedTabChange?.(tab)
  }

  useEffect(() => {
    if (!toastProp) return
    if (toastProp.type === 'success') {
      toast.success(toastProp.message, toastProp.detail)
    } else {
      toast.error(toastProp.message, toastProp.detail)
    }
    onToastDismiss?.()
  }, [toastProp, onToastDismiss, toast])

  function handleRetry() {
    void loadPage(0, false)
  }

  function handleLoadMore() {
    if (!hasMore || loadingMore || loading) return
    void loadPage(nextOffset, true)
  }

  function handleClearFilters() {
    setSearch('')
    if (syncFiltersFromUrl) {
      updateUrlFilters('All', 'All')
    } else {
      setLocalCategory('All')
      setLocalMovementFilter('All')
    }
  }

  const hasActiveFilters =
    search.trim().length > 0 || movementFilter !== 'All' || category !== 'All'

  async function handlePollVote(postId: string, optionId: string) {
    if (isGuest || !optionId) {
      handleRestrictedAction('poll')
      return
    }
    if (!userId || pollVotingId) return

    setPollVotingId(postId)
    try {
      const poll = await castPollVote(postId, optionId, userId)
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, poll } : p)))
      toast.success('Vote recorded!', 'Thanks for sharing your voice.')
    } catch (err) {
      toast.error(formatError(err))
    } finally {
      setPollVotingId(null)
    }
  }

  async function handlePetitionSign(postId: string) {
    if (isGuest) {
      handleRestrictedAction('petition')
      return
    }
    if (!userId || petitionSigningId) return

    const post = posts.find((p) => p.id === postId)
    if (!post || post.supported_by_me) return

    setPetitionSigningId(postId)
    try {
      await signPetition(postId, userId)
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p
          return {
            ...p,
            supported_by_me: true,
            support_count: (p.support_count ?? 0) + 1,
          }
        }),
      )
      toast.success(
        'You have supported this petition.',
        'Thank you for adding your youth voice to this call for change.',
      )
    } catch (err) {
      toast.error(formatError(err))
    } finally {
      setPetitionSigningId(null)
    }
  }

  async function handleFollowToggle(postId: string) {
    if (isGuest) {
      openJoinModal('follow')
      return
    }
    if (movementFollows.processingId) return
    try {
      const { following } = await movementFollows.toggleFollow(postId)
      setPosts((prev) =>
        prev
          .map((p) =>
            p.id === postId
              ? {
                  ...p,
                  followed_by_me: following,
                  follower_count: movementFollows.followerCounts[postId] ?? p.follower_count,
                }
              : p,
          )
          .filter((p) => !(isFollowingFeed && !following && p.id === postId)),
      )
      toast.success(following ? t('follow.followedToast') : t('follow.unfollowedToast'))
      if (isFollowingFeed) invalidateFeedCache('following')
    } catch (err) {
      toast.error(formatError(err))
    }
  }

  async function handleSupport(postId: string) {
    const post = posts.find((p) => p.id === postId)
    if (isGuest) {
      openJoinModal(post ? supportGateVariant(post.movement_type) : 'support')
      return
    }
    if (!userId || supportingId) return
    if (!post || isPetitionMovement(post.movement_type)) return

    setSupportingId(postId)
    try {
      const nowParticipating = await togglePostAction(
        postId,
        userId,
        post.movement_type,
        Boolean(post.supported_by_me),
        post.donation_subtype,
      )
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p
          const delta = nowParticipating ? 1 : -1
          return {
            ...p,
            supported_by_me: nowParticipating,
            support_count: Math.max(0, (p.support_count ?? 0) + delta),
          }
        }),
      )
      toast.success(getActionSuccessMessage(post.movement_type, nowParticipating))
    } catch (err) {
      toast.error(formatError(err))
    } finally {
      setSupportingId(null)
    }
  }

  return (
    <div className={className}>
      {!reliefHub && (isGuest || onFeedTabChange) && (
        <FeedTabs
          active={isGuest ? 'discover' : feedTab}
          onChange={isGuest ? handleGuestTabChange : onFeedTabChange!}
          followingCount={isGuest ? undefined : movementFollows.followedIds.size}
          className="mb-4"
        />
      )}

      <div
        id={`feed-panel-${feedTab}`}
        role="tabpanel"
        aria-labelledby={`feed-tab-${feedTab}`}
        className="min-w-0"
      >

      {!reliefHub && (
        <FeedDiscoveryBar
          search={search}
          onSearchChange={setSearch}
          movementFilter={movementFilter}
          onMovementFilterChange={
            syncFiltersFromUrl ? handleMovementFilterChange : setLocalMovementFilter
          }
          category={category}
          onCategoryChange={syncFiltersFromUrl ? handleCategoryChange : setLocalCategory}
          isGuest={isGuest}
          showCreateButton={showCreateButton}
          onGuestCreate={() => handleRestrictedAction('create')}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      <AsyncLoadHint
        className="mt-4"
        showSlowHint={isRequestActive && showSlowHint && !error}
        showRecovery={isRequestActive && showRecovery && !error}
        error={error}
        onRetry={handleRetry}
      />

      {isFollowingFeed && movementFollows.error && !movementFollows.loading && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <p>We couldn&apos;t load your followed movements. Please try again.</p>
          <button
            type="button"
            className="mt-2 font-semibold text-accent-600 underline dark:text-accent-400"
            onClick={() => void movementFollows.reloadFollowedIds()}
          >
            Retry
          </button>
        </div>
      )}

      {showFeedLoading ? (
        <FeedPostListSkeleton />
      ) : error ? null : filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Inbox}
            title={emptyState.title}
            description={emptyState.description}
          />
          {isFollowingFeed && (
            <p className="mt-6 text-center">
              <Link to={isGuest ? '/explore' : '/discover'} className="btn-primary">
                {t('guidance.empty.followingCta', { defaultValue: 'Explore Movements' })}
              </Link>
            </p>
          )}
          {reliefHub && !hasActiveFilters && (
            <p className="mt-6 text-center">
              <Link to={isGuest ? '/explore' : '/discover'} className="btn-primary">
                {t('guidance.empty.reliefCta', { defaultValue: 'Explore Movements' })}
              </Link>
            </p>
          )}
          {hasActiveFilters && !isFollowingFeed && (
            <p className="mt-4 text-center">
              <button type="button" onClick={handleClearFilters} className="btn-secondary">
                {t('feed.clearFilters')}
              </button>
            </p>
          )}
          {hasMore && !isFollowingFeed && (
            <p className="mt-4 text-center">
              <button type="button" onClick={handleLoadMore} className="btn-secondary">
                Load more movements
              </button>
            </p>
          )}
          {!isGuest && movementFilter === 'All' && category === 'All' && !debouncedSearch.trim() && !hasMore && (
            <p className="mt-6 flex justify-center">
              <CreateMovementCta />
            </p>
          )}
          {isGuest && (
            <p className="mt-6 text-center">
              <button
                type="button"
                onClick={() => handleRestrictedAction()}
                className="btn-primary"
                data-track="guest-locked-action-clicked"
              >
                {t('explore.guestJoin')}
              </button>
            </p>
          )}
        </div>
      ) : (
        <>
          <ul className="mt-4 min-w-0 space-y-4 sm:space-y-5">
            {filtered.map((post) => (
              <li key={post.id} className="min-w-0">
                <SafePostCard
                  post={post}
                  detailPath={
                    reliefHub
                      ? `${reliefDetailBase}/${post.id}`
                      : isGuest
                        ? guestMovementDetailPath(post.id)
                        : `/feed/${post.id}`
                  }
                  onSupport={
                    isPollMovement(post.movement_type) || isPetitionMovement(post.movement_type)
                      ? undefined
                      : handleSupport
                  }
                  onPetitionSign={
                    isPetitionMovement(post.movement_type) ? handlePetitionSign : undefined
                  }
                  onPollVote={handlePollVote}
                  supporting={supportingId === post.id}
                  petitionSigning={petitionSigningId === post.id}
                  pollVoting={pollVotingId === post.id}
                  guestMode={isGuest}
                  showFollow
                  isFollowing={Boolean(post.followed_by_me)}
                  followLoading={movementFollows.processingId === post.id}
                  followerCount={post.follower_count}
                  onFollowToggle={() => void handleFollowToggle(post.id)}
                  currentUserId={viewerUserId}
                  commentCount={commentCounts[post.id] ?? 0}
                  onPostDeleted={(postId) => {
                    setPosts((prev) => prev.filter((p) => p.id !== postId))
                    invalidateFeedCache(feedTab)
                  }}
                />
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore || loading}
                className="btn-secondary min-w-[12rem]"
                aria-busy={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Loading…
                  </>
                ) : (
                  'Load more movements'
                )}
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  )
}

export default function PostFeed(props: PostFeedProps) {
  return <PostFeedContent {...props} />
}
