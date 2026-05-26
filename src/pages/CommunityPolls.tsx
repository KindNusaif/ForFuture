import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PollCard from '../components/polls/PollCard'
import PollsEmptyPanel from '../components/polls/PollsEmptyPanel'
import PollsInsightStrip from '../components/polls/PollsInsightStrip'
import EmptyState from '../components/EmptyState'
import SkeletonCard from '../components/ui/SkeletonCard'
import PageContainer from '../components/ui/PageContainer'
import PollsSidebar from '../components/polls/PollsSidebar'
import GuestModeBanner from '../components/guidance/GuestModeBanner'
import GuidanceHint from '../components/guidance/GuidanceHint'
import { useAuthUser } from '../hooks/useAuthUser'
import { useAuthGate } from '../hooks/useAuthGate'
import { useCreatePoll } from '../hooks/useCreatePoll'
import { useToast } from '../hooks/useToast'
import { castPollVote } from '../lib/polls'
import { fetchPostsPage, DEFAULT_FEED_PAGE_SIZE } from '../lib/posts'
import { fetchCommentCountsForPosts } from '../lib/comments'
import { canPostHaveComments } from '../lib/commentEligibility'
import { guestMovementDetailPath } from '../lib/guestExplore'
import { isRequestAborted, withAutoRetry } from '../lib/supabaseRequest'
import type { Post } from '../types'

type PollTab = 'all' | 'trending' | 'mine'

interface CommunityPollsProps {
  mode?: 'guest' | 'member'
}

export default function CommunityPolls({ mode = 'member' }: CommunityPollsProps) {
  const { t } = useTranslation()
  const { user, isGuest: authGuest } = useAuthUser()
  const { gate } = useAuthGate()
  const { openCreatePoll, registerPollPublishedListener } = useCreatePoll()
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const isGuestMode = mode === 'guest' || authGuest
  const userId = user?.id
  const showSidebar = !isGuestMode

  useEffect(() => {
    if (mode === 'guest' && user && !authGuest) {
      navigate('/polls', { replace: true })
    }
  }, [mode, user, authGuest, navigate])

  const [tab, setTab] = useState<PollTab>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pollVotingId, setPollVotingId] = useState<string | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})

  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const requestId = ++requestIdRef.current

      if (!append) setLoading(true)
      else setLoadingMore(true)

      try {
        const { posts: pagePosts, hasMore: more, nextOffset: next } = await withAutoRetry(
          () =>
            fetchPostsPage(
              {
                viewerUserId: userId,
                offset,
                limit: DEFAULT_FEED_PAGE_SIZE,
                movementType: 'quick_youth_poll',
              },
              controller.signal,
            ),
          { signal: controller.signal },
        )

        if (requestId !== requestIdRef.current || controller.signal.aborted) return

        setPosts((prev) => (append ? [...prev, ...pagePosts] : pagePosts))
        setHasMore(more)
        setNextOffset(next)
        setError(null)
      } catch (err) {
        if (requestId !== requestIdRef.current || isRequestAborted(err)) return
        setError(
          t('polls.loadFailed', {
            defaultValue: "We couldn't load community polls right now. Please try again.",
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
    [userId, t],
  )

  useEffect(() => {
    void loadPage(0, false)
    return () => abortRef.current?.abort()
  }, [loadPage])

  useEffect(() => {
    return registerPollPublishedListener(() => {
      setTab('mine')
      void loadPage(0, false)
    })
  }, [registerPollPublishedListener, loadPage])

  useEffect(() => {
    const navToast = (location.state as { toast?: { type: 'success' | 'error'; message: string; detail?: string } })
      ?.toast
    if (!navToast) return
    if (navToast.type === 'success') {
      toast.success(navToast.message, navToast.detail)
    } else {
      toast.error(navToast.message, navToast.detail)
    }
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, location.state, navigate, toast])

  const trendingHasEngagement = useMemo(
    () => posts.some((p) => (p.poll?.totalVotes ?? 0) > 0),
    [posts],
  )

  const filteredPosts = useMemo(() => {
    let list = [...posts]
    if (tab === 'trending') {
      list = list.filter((p) => (p.poll?.totalVotes ?? 0) > 0)
      list.sort((a, b) => (b.poll?.totalVotes ?? 0) - (a.poll?.totalVotes ?? 0))
    } else if (tab === 'mine' && userId) {
      list = list.filter((p) => p.user_id === userId)
    }
    return list
  }, [posts, tab, userId])

  const commentEligibleIds = useMemo(
    () => filteredPosts.filter((p) => canPostHaveComments(p)).map((p) => p.id),
    [filteredPosts],
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

  async function handlePollVote(postId: string, optionId: string) {
    if (!optionId) return
    if (isGuestMode || !userId) {
      gate('poll')
      return
    }
    if (pollVotingId) return

    setPollVotingId(postId)
    try {
      const poll = await castPollVote(postId, optionId, userId)
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, poll } : p)))
      toast.success(
        t('polls.voteRecordedToast', { defaultValue: 'Vote recorded' }),
        t('polls.voteRecordedDetail', { defaultValue: 'Thanks for sharing your voice.' }),
      )
    } catch {
      toast.error(
        t('polls.voteFailed', { defaultValue: 'Your vote could not be submitted. Please try again.' }),
      )
    } finally {
      setPollVotingId(null)
    }
  }

  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  function handleTabChange(id: PollTab) {
    if (id === 'mine' && isGuestMode) {
      gate('pollCreate')
      return
    }
    setTab(id)
  }

  const tabs: { id: PollTab; labelKey: string; labelDefault: string }[] = [
    { id: 'all', labelKey: 'polls.tabs.all', labelDefault: 'All Polls' },
    { id: 'trending', labelKey: 'polls.tabs.trending', labelDefault: 'Trending' },
    { id: 'mine', labelKey: 'polls.tabs.mine', labelDefault: 'My Polls' },
  ]

  const showGuestMyPolls = tab === 'mine' && isGuestMode
  const showTrendingEmpty =
    tab === 'trending' && !loading && posts.length > 0 && !trendingHasEngagement
  const showEmpty =
    !loading &&
    !showGuestMyPolls &&
    !showTrendingEmpty &&
    filteredPosts.length === 0
  const emptyVariant: 'all' | 'trending' | 'mine' =
    tab === 'mine' ? 'mine' : tab === 'trending' ? 'trending' : 'all'
  const emptyFiltered = showEmpty && tab !== 'all' && tab !== 'mine' && posts.length > 0

  return (
    <PageContainer className="community-polls-page !py-6 lg:!py-8">
      {isGuestMode ? <GuestModeBanner className="mb-4" /> : null}
      <div
        className={`community-polls-layout ${showSidebar ? 'community-polls-layout--with-sidebar' : ''}`}
      >
        <section className="community-polls-main min-w-0 flex-1">
          <header className="community-polls-hero-panel impact-page-hero mb-4 px-5 py-5 sm:px-6 sm:py-6">
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="community-polls-eyebrow eyebrow inline-flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" aria-hidden />
                  {t('polls.eyebrow', { defaultValue: 'COMMUNITY POLLS' })}
                </p>
                <h1 className="community-polls-headline mt-2 text-2xl sm:text-[1.65rem] lg:text-[1.85rem]">
                  {t('polls.pageTitle', { defaultValue: 'Let every voice shape the conversation.' })}
                </h1>
                <p className="community-polls-subtitle mt-2 max-w-2xl text-sm leading-relaxed sm:text-base">
                  {t('polls.pageSubtitle', {
                    defaultValue:
                      'Vote on local priorities, test ideas before action, and help communities understand what matters most.',
                  })}
                </p>
                <GuidanceHint className="community-polls-hero-note mt-2">
                  {t('guidance.microcopy.polls', {
                    defaultValue: 'Polls help communities listen before they act.',
                  })}
                </GuidanceHint>
              </div>
              <button
                type="button"
                onClick={openCreatePoll}
                className="btn-primary shrink-0 self-start gap-2 sm:self-auto"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t('polls.createPoll', { defaultValue: 'Create a Poll' })}
              </button>
            </div>
          </header>

          <PollsInsightStrip />

          <nav
            className="community-polls-tabs mb-5 flex gap-2 overflow-x-auto pb-1"
            aria-label={t('polls.tabsAria', { defaultValue: 'Poll filters' })}
          >
            {tabs.map(({ id, labelKey, labelDefault }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleTabChange(id)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
                  tab === id
                    ? 'bg-accent-600 text-white shadow-sm dark:bg-accent-500'
                    : 'border border-default bg-surface text-secondary hover:border-accent-300 hover:bg-muted dark:hover:border-accent-600'
                }`}
                aria-pressed={tab === id}
              >
                {t(labelKey, { defaultValue: labelDefault })}
              </button>
            ))}
          </nav>

          {error && (
            <div
              className="alert-warning mb-6 flex flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              role="alert"
            >
              <p>{error}</p>
              <button type="button" className="btn-secondary shrink-0 text-sm" onClick={() => void loadPage(0, false)}>
                {t('polls.retry', { defaultValue: 'Try again' })}
              </button>
            </div>
          )}

          {loading && posts.length === 0 ? (
            <div className="community-polls-content-zone space-y-4">
              <p className="sr-only">{t('polls.loading', { defaultValue: 'Loading community polls…' })}</p>
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} lines={4} />
              ))}
            </div>
          ) : showGuestMyPolls ? (
            <div className="community-polls-content-zone">
              <EmptyState
                icon={BarChart3}
                compact
                title={t('polls.myPollsGuestTitle', { defaultValue: 'Log in to view your polls' })}
                description={t('polls.myPollsGuestDescription', {
                  defaultValue: 'Create an account or log in to manage the polls you publish.',
                })}
                action={{
                  label: t('joinModal.createAccount', { defaultValue: 'Create account' }),
                  onClick: () => gate('pollCreate'),
                }}
              />
            </div>
          ) : showTrendingEmpty ? (
            <PollsEmptyPanel variant="trending" onCreatePoll={openCreatePoll} />
          ) : showEmpty ? (
            emptyFiltered ? (
              <div className="community-polls-content-zone">
                <EmptyState
                  icon={BarChart3}
                  compact
                  title={t('polls.emptyFilteredTitle', { defaultValue: 'No polls match this view' })}
                  description={t('polls.emptyFilteredDescription', {
                    defaultValue: 'Try another filter or create a new poll to start the conversation.',
                  })}
                />
              </div>
            ) : (
              <PollsEmptyPanel variant={emptyVariant} onCreatePoll={openCreatePoll} />
            )
          ) : (
            <div className="community-polls-content-zone space-y-4 sm:space-y-5">
              {tab === 'trending' && filteredPosts.length > 0 && (
                <p className="text-xs text-muted">
                  {t('polls.trendingHint', {
                    defaultValue: 'Sorted by total votes — most supported polls first.',
                  })}
                </p>
              )}
              <ul className="space-y-4 sm:space-y-5">
                {filteredPosts.map((post) => (
                  <li key={post.id} className="min-w-0">
                    <PollCard
                      post={post}
                      detailPath={isGuestMode ? guestMovementDetailPath(post.id) : `/feed/${post.id}`}
                      onPollVote={handlePollVote}
                      pollVoting={pollVotingId === post.id}
                      guestMode={isGuestMode}
                      currentUserId={userId}
                      commentCount={commentCounts[post.id] ?? 0}
                      onPostDeleted={handlePostDeleted}
                    />
                  </li>
                ))}
              </ul>

              {hasMore && tab === 'all' && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => void loadPage(nextOffset, true)}
                    disabled={loadingMore}
                    className="btn-secondary min-h-11 px-6"
                  >
                    {loadingMore
                      ? t('polls.loadingMore', { defaultValue: 'Loading more…' })
                      : t('polls.loadMore', { defaultValue: 'Load more polls' })}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {showSidebar && <PollsSidebar />}
      </div>
    </PageContainer>
  )
}
