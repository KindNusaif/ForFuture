import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import MovementDetailView from '../components/movement/MovementDetailView'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import SectionErrorBoundary from '../components/SectionErrorBoundary'
import ShareButton from '../components/share/ShareButton'
import EmptyState from '../components/EmptyState'
import { MovementDetailSkeleton } from '../components/Skeleton'
import { Inbox } from 'lucide-react'
import { useMovementFollows } from '../hooks/useMovementFollows'
import { useRelatedMovements } from '../hooks/useRelatedMovements'
import { useToast } from '../hooks/useToast'
import AsyncLoadHint from '../components/AsyncLoadHint'
import { useJoinMovement } from '../hooks/useJoinMovement'
import { useAuthUser } from '../hooks/useAuthUser'
import { useDataSync } from '../hooks/useDataSync'
import { useMovementDetail } from '../hooks/useMovementDetail'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { useRouteFocusRefetch } from '../hooks/useRouteFocusRefetch'
import { useVisibilityRefetch } from '../hooks/useVisibilityRefetch'
import { usePageMeta } from '../hooks/usePageMeta'
import { castPollVote } from '../lib/polls'
import { getActionSuccessMessage } from '../lib/movements'
import { togglePostAction } from '../lib/postActions'
import { signPetition } from '../lib/petitionSignatures'
import { isPetitionMovement } from '../lib/petitions'
import { formatError } from '../lib/errors'
import { supportGateVariant } from '../lib/guestGate'

interface MovementDetailProps {
  mode: 'guest' | 'member'
  backTo: string
  backLabel?: string
}

function MovementDetailContent({
  id,
  mode,
  backTo,
  backLabel,
}: MovementDetailProps & { id: string }) {
  const { t } = useTranslation()
  const resolvedBackLabel =
    backLabel ??
    (mode === 'guest'
      ? t('explore.backToExplore', { defaultValue: 'Back to explore' })
      : t('feed.backToFeed', { defaultValue: 'Back to feed' }))
  const navigate = useNavigate()
  const { user, isMember, loading: authLoading } = useAuthUser()
  const { openJoinModal } = useJoinMovement()
  const isGuest = mode === 'guest'

  const loadEnabled = Boolean(id) && (isGuest || (!authLoading && Boolean(user)))
  const waitingForAuth = !isGuest && authLoading

  const {
    post: fetchedPost,
    loading,
    error,
    reload,
    setPost,
  } = useMovementDetail({
    postId: id,
    isGuest,
    userId: user?.id,
    enabled: loadEnabled,
  })

  const [supporting, setSupporting] = useState(false)
  const [petitionSigning, setPetitionSigning] = useState(false)
  const [pollVoting, setPollVoting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const toast = useToast()
  const movementFollows = useMovementFollows(isGuest ? undefined : user?.id)

  const post = fetchedPost
  const displayError = actionError ?? error
  const showPageLoading = waitingForAuth || loading
  const { showSlowHint, showRecovery } = useLoadingProgress(showPageLoading)

  useVisibilityRefetch(reload, { enabled: !showPageLoading && Boolean(post) })
  useRouteFocusRefetch(reload, {
    pathPrefixes: ['/feed', '/explore', '/movements'],
    enabled: !showPageLoading && Boolean(post),
  })

  useDataSync(
    (event) => {
      if (event.type !== 'follows:invalidate' || !post?.id || isGuest) return
      void movementFollows.refreshCountsForPosts([post.id])
    },
    Boolean(post) && !showPageLoading,
  )

  const relatedDetailBase = isGuest ? '/explore' : '/feed'
  const { posts: relatedPosts, loading: relatedLoading } = useRelatedMovements(
    post?.id,
    post?.category,
    user?.id,
    Boolean(post) && !showPageLoading,
  )

  const memberOnGuestRoute = !authLoading && isGuest && isMember

  useEffect(() => {
    if (!post || isGuest) return
    void movementFollows.refreshCountsForPosts([post.id])
  }, [post?.id, isGuest, movementFollows])

  usePageMeta({
    title: post?.title ?? t('movementDetail.pageTitle', { defaultValue: 'Movement' }),
    description: post?.description?.slice(0, 160),
    path: post ? `/feed/${post.id}` : '/feed',
  })

  useEffect(() => {
    if (!post || typeof window === 'undefined') return
    if (window.location.hash !== '#discussion-heading') return
    const el = document.getElementById('discussion-heading')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [post?.id])

  async function handlePetitionSign(postId: string) {
    if (isGuest) {
      openJoinModal('petition')
      return
    }
    if (!user || !post || post.supported_by_me || petitionSigning) return

    setPetitionSigning(true)
    try {
      await signPetition(postId, user.id)
      setPost({
        ...post,
        supported_by_me: true,
        support_count: (post.support_count ?? 0) + 1,
      })
      setActionError(null)
      toast.success('You have supported this petition.')
    } catch (err) {
      setActionError(formatError(err))
    } finally {
      setPetitionSigning(false)
    }
  }

  async function handleSupport(postId: string) {
    if (isGuest) {
      openJoinModal(post ? supportGateVariant(post.movement_type) : 'support')
      return
    }
    if (!user || !post || isPetitionMovement(post.movement_type) || supporting) return
    setSupporting(true)
    try {
      const nowParticipating = await togglePostAction(
        postId,
        user.id,
        post.movement_type,
        Boolean(post.supported_by_me),
        post.donation_subtype,
      )
      setPost({
        ...post,
        supported_by_me: nowParticipating,
        support_count: Math.max(0, (post.support_count ?? 0) + (nowParticipating ? 1 : -1)),
      })
      setActionError(null)
      toast.success(getActionSuccessMessage(post.movement_type, nowParticipating))
    } catch (err) {
      setActionError(formatError(err))
    } finally {
      setSupporting(false)
    }
  }

  async function handlePollVote(postId: string, optionId: string) {
    if (isGuest || !optionId) {
      openJoinModal('poll')
      return
    }
    if (!user || pollVoting) return
    setPollVoting(true)
    try {
      const poll = await castPollVote(postId, optionId, user.id)
      setPost((current) =>
        current && current.id === postId ? { ...current, poll } : current,
      )
      setActionError(null)
      toast.success('Vote recorded!', 'Thanks for sharing your voice.')
    } catch (err) {
      setActionError(formatError(err))
    } finally {
      setPollVoting(false)
    }
  }

  async function handleFollowToggle() {
    if (!post) return
    if (isGuest) {
      openJoinModal()
      return
    }
    if (movementFollows.processingId) return
    try {
      const { following } = await movementFollows.toggleFollow(post.id)
      setPost((current) =>
        current ? { ...current, followed_by_me: following } : current,
      )
      setActionError(null)
      toast.success(
        following ? 'You are now tracking this movement.' : 'You stopped tracking this movement.',
      )
    } catch (err) {
      setActionError(formatError(err))
    }
  }

  if (memberOnGuestRoute) {
    return <Navigate to={`/feed/${id}`} replace />
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t('nav.home', { defaultValue: 'Home' }), to: '/' },
          {
            label: mode === 'guest' ? t('nav.explore', { defaultValue: 'Explore' }) : t('nav.myFeed', { defaultValue: 'My Feed' }),
            to: backTo,
          },
          { label: post?.title ?? t('movementDetail.pageTitle', { defaultValue: 'Movement' }) },
        ]}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="btn-ghost min-h-10! px-0!"
        >
          <ArrowLeft className="h-4 w-4" />
          {resolvedBackLabel}
        </button>
        {post && <ShareButton post={post} variant="secondary" showLabel />}
      </div>

      <AsyncLoadHint
        className="mb-4"
        showSlowHint={showPageLoading && showSlowHint && !displayError}
        showRecovery={showPageLoading && showRecovery && !displayError}
        error={displayError}
        onRetry={reload}
      />

      {showPageLoading ? (
        <MovementDetailSkeleton />
      ) : !post && !displayError ? (
        <EmptyState
          icon={Inbox}
          title="This movement may have been removed or is no longer available."
          description="It might be private, deleted, or still syncing. Browse other movements below."
          action={{ label: 'Back to Movements', to: backTo }}
        />
      ) : post ? (
        <SectionErrorBoundary section="Movement detail">
        <MovementDetailView
          post={post}
          guestMode={isGuest}
          relatedPosts={relatedPosts}
          relatedLoading={relatedLoading}
          relatedDetailBase={relatedDetailBase}
          showFollow
          isFollowing={movementFollows.isFollowing(post.id)}
          followLoading={movementFollows.processingId === post.id}
          followerCount={movementFollows.followerCounts[post.id] ?? post.follower_count}
          onFollowToggle={() => void handleFollowToggle()}
          onSupport={isPetitionMovement(post.movement_type) ? undefined : handleSupport}
          onPetitionSign={
            isPetitionMovement(post.movement_type) ? handlePetitionSign : undefined
          }
          onPollVote={handlePollVote}
          supporting={supporting}
          petitionSigning={petitionSigning}
          pollVoting={pollVoting}
          currentUserId={user?.id}
          detailPath={isGuest ? `/explore/${post.id}` : `/feed/${post.id}`}
          onPostDeleted={() => navigate(backTo, { replace: true })}
        />
        </SectionErrorBoundary>
      ) : null}
    </>
  )
}

export default function MovementDetail(props: MovementDetailProps) {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-secondary">Invalid movement link.</p>
      </section>
    )
  }

  return (
    <section className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:px-6 lg:max-w-4xl">
      <MovementDetailContent key={`${props.mode}-${id}`} id={id} {...props} />
    </section>
  )
}
