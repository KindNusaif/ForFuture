import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, Loader2, Plus } from 'lucide-react'
import EmptyState from './EmptyState'
import FeedDiscoveryBar from './FeedDiscoveryBar'
import PostCard from './PostCard'
import Toast from './Toast'
import { PostCardSkeleton } from './Skeleton'
import { useJoinMovement } from '../hooks/useJoinMovement'
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
  postsAsShell,
} from '../lib/posts'
import { withAutoRetry } from '../lib/supabaseRequest'
import { isRequestAborted } from '../lib/supabaseRequest'
import { getActionSuccessMessage } from '../lib/movements'
import { togglePostAction } from '../lib/postActions'
import { formatError } from '../lib/errors'
import type { Category, MovementType, Post } from '../types'

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
}

function serverMovementType(filter: MovementFilter): MovementType | undefined {
  return filter === 'All' ? undefined : filter
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
}: PostFeedProps) {
  const { openJoinModal } = useJoinMovement()
  const isGuest = mode === 'guest'
  const viewerUserId = isGuest ? undefined : userId

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [enriching, setEnriching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<Category | 'All'>('All')
  const [movementFilter, setMovementFilter] = useState<MovementFilter>('All')
  const [search, setSearch] = useState('')
  const [supportingId, setSupportingId] = useState<string | null>(null)
  const [petitionSigningId, setPetitionSigningId] = useState<string | null>(null)
  const [pollVotingId, setPollVotingId] = useState<string | null>(null)
  const [actionToast, setActionToast] = useState<FeedToast | null>(null)

  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const displayedToast = actionToast ?? toastProp
  const isRequestActive = loading || enriching || loadingMore
  const { showSlowHint, showRecovery } = useLoadingProgress(isRequestActive)

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const requestId = ++requestIdRef.current

      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setEnriching(false)
        setError(null)
      }

      try {
        const pageParams = {
          viewerUserId,
          offset,
          limit: DEFAULT_FEED_PAGE_SIZE,
          movementType: serverMovementType(movementFilter),
          category: serverCategory(category),
        }

        const { rows, hasMore: more, nextOffset: next } = await withAutoRetry(
          () => fetchFeedRowsPage(pageParams, controller.signal),
          { signal: controller.signal },
        )

        if (requestId !== requestIdRef.current || controller.signal.aborted) return

        if (!append) {
          setPosts(postsAsShell(rows))
          setLoading(false)
          setEnriching(true)
        }

        const enriched = await withAutoRetry(
          () => enrichPosts(rows, viewerUserId, controller.signal),
          { signal: controller.signal },
        )

        if (requestId !== requestIdRef.current || controller.signal.aborted) return

        setPosts((prev) => (append ? [...prev, ...enriched] : enriched))
        setHasMore(more)
        setNextOffset(next)
        setError(null)
      } catch (err) {
        if (requestId !== requestIdRef.current || isRequestAborted(err)) return
        setError(formatError(err))
        if (!append) setPosts([])
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
          setEnriching(false)
          setLoadingMore(false)
        }
      }
    },
    [viewerUserId, movementFilter, category],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPage(0, false)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [loadPage])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return posts

    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.author_name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        getMovementConfig(p.movement_type).label.toLowerCase().includes(q),
    )
  }, [posts, search])

  const emptyState = useMemo(() => {
    if (search) {
      return {
        title: 'No matching movements',
        description: hasMore
          ? 'Try a different search or load more movements to search further.'
          : 'Try a different search or filter.',
      }
    }
    if (movementFilter !== 'All') {
      const cfg = getMovementConfig(movementFilter)
      return { title: cfg.emptyTitle, description: cfg.emptyDescription }
    }
    if (category !== 'All') {
      return {
        title: `No ${category} movements`,
        description: 'Try another category or movement type.',
      }
    }
    return {
      title: 'No movements yet',
      description: isGuest
        ? 'Check back soon — youth leaders are organizing action every day.'
        : 'Be the first to create a youth movement on ForFuture.',
    }
  }, [search, movementFilter, category, isGuest, hasMore])

  function handleRestrictedAction(variant: 'default' | 'petition' = 'default') {
    openJoinModal(variant)
  }

  function dismissToast() {
    setActionToast(null)
    onToastDismiss?.()
  }

  function handleRetry() {
    void loadPage(0, false)
  }

  function handleLoadMore() {
    if (!hasMore || loadingMore || loading) return
    void loadPage(nextOffset, true)
  }

  async function handlePollVote(postId: string, optionId: string) {
    if (isGuest || !optionId) {
      handleRestrictedAction()
      return
    }
    if (!userId) return

    setPollVotingId(postId)
    try {
      const poll = await castPollVote(postId, optionId, userId)
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, poll } : p)))
      setActionToast({
        type: 'success',
        message: 'Vote recorded!',
        detail: 'Thanks for sharing your voice.',
      })
    } catch (err) {
      setActionToast({ type: 'error', message: formatError(err) })
    } finally {
      setPollVotingId(null)
    }
  }

  async function handlePetitionSign(postId: string) {
    if (isGuest) {
      handleRestrictedAction('petition')
      return
    }
    if (!userId) return

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
      setActionToast({
        type: 'success',
        message: 'You have supported this petition.',
        detail: 'Thank you for adding your youth voice to this call for change.',
      })
    } catch (err) {
      setActionToast({ type: 'error', message: formatError(err) })
    } finally {
      setPetitionSigningId(null)
    }
  }

  async function handleSupport(postId: string) {
    if (isGuest) {
      handleRestrictedAction()
      return
    }
    if (!userId) return

    const post = posts.find((p) => p.id === postId)
    if (!post || isPetitionMovement(post.movement_type)) return

    setSupportingId(postId)
    try {
      const nowParticipating = await togglePostAction(
        postId,
        userId,
        post.movement_type,
        Boolean(post.supported_by_me),
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
      setActionToast({
        type: 'success',
        message: getActionSuccessMessage(post.movement_type, nowParticipating),
      })
    } catch (err) {
      setActionToast({ type: 'error', message: formatError(err) })
    } finally {
      setSupportingId(null)
    }
  }

  return (
    <>
      {displayedToast && (
        <div className="mb-4">
          <Toast
            variant={displayedToast.type}
            message={displayedToast.message}
            detail={displayedToast.detail}
            onDismiss={dismissToast}
          />
        </div>
      )}

      <FeedDiscoveryBar
        search={search}
        onSearchChange={setSearch}
        movementFilter={movementFilter}
        onMovementFilterChange={setMovementFilter}
        category={category}
        onCategoryChange={setCategory}
        isGuest={isGuest}
        showCreateButton={showCreateButton}
        onGuestCreate={() => handleRestrictedAction()}
      />

      <AsyncLoadHint
        className="mt-4"
        showSlowHint={isRequestActive && showSlowHint && !error}
        showRecovery={isRequestActive && showRecovery && !error}
        error={error && !displayedToast ? error : null}
        onRetry={handleRetry}
      />

      {loading ? (
        <ul className="mt-6 min-w-0 space-y-4" aria-busy="true" aria-label="Loading movements">
          {[1, 2, 3].map((i) => (
            <li key={i} className="min-w-0">
              <PostCardSkeleton />
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 && !error && !loading ? (
        <div className="mt-8">
          <EmptyState
            icon={Inbox}
            title={emptyState.title}
            description={emptyState.description}
          />
          {hasMore && (
            <p className="mt-4 text-center">
              <button type="button" onClick={handleLoadMore} className="btn-secondary">
                Load more movements
              </button>
            </p>
          )}
          {!isGuest && movementFilter === 'All' && category === 'All' && !search && !hasMore && (
            <p className="mt-6 text-center">
              <Link to="/create" className="btn-primary">
                <Plus className="h-5 w-5" />
                Create the first movement
              </Link>
            </p>
          )}
          {isGuest && (
            <p className="mt-6 text-center">
              <button type="button" onClick={() => handleRestrictedAction()} className="btn-primary">
                Join ForFuture to take action
              </button>
            </p>
          )}
        </div>
      ) : (
        <>
          {enriching && (
            <p className="mb-3 text-center text-xs font-medium text-slate-500" role="status">
              Loading engagement counts…
            </p>
          )}
          <ul className="mt-4 min-w-0 space-y-4 sm:space-y-5">
            {filtered.map((post) => (
              <li key={post.id} className="min-w-0">
                <PostCard
                  post={post}
                  detailPath={isGuest ? `/explore/${post.id}` : `/feed/${post.id}`}
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
                />
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn-secondary min-w-[12rem]"
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
    </>
  )
}

export default function PostFeed(props: PostFeedProps) {
  const feedKey = props.mode === 'guest' ? 'guest' : (props.userId ?? 'member')
  return <PostFeedContent key={feedKey} {...props} />
}
