import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import PostCard from '../components/PostCard'
import Toast from '../components/Toast'
import AsyncLoadHint from '../components/AsyncLoadHint'
import { useJoinMovement } from '../hooks/useJoinMovement'
import { useAuthUser } from '../hooks/useAuthUser'
import { useMovementDetail } from '../hooks/useMovementDetail'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { castPollVote } from '../lib/polls'
import { getActionSuccessMessage } from '../lib/movements'
import { togglePostAction } from '../lib/postActions'
import { signPetition } from '../lib/petitionSignatures'
import { isPetitionMovement } from '../lib/petitions'
import { formatError } from '../lib/errors'
interface MovementDetailProps {
  mode: 'guest' | 'member'
  backTo: string
  backLabel: string
}

function MovementDetailContent({
  id,
  mode,
  backTo,
  backLabel,
}: MovementDetailProps & { id: string }) {
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
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const post = fetchedPost
  const displayError = actionError ?? error
  const showPageLoading = waitingForAuth || loading
  const { showSlowHint, showRecovery } = useLoadingProgress(showPageLoading)

  if (!authLoading && isGuest && isMember) {
    return <Navigate to={`/feed/${id}`} replace />
  }

  async function handlePetitionSign(postId: string) {
    if (isGuest) {
      openJoinModal('petition')
      return
    }
    if (!user || !post || post.supported_by_me) return

    setPetitionSigning(true)
    try {
      await signPetition(postId, user.id)
      setPost({
        ...post,
        supported_by_me: true,
        support_count: (post.support_count ?? 0) + 1,
      })
      setActionError(null)
      setActionMessage('You have supported this petition.')
    } catch (err) {
      setActionError(formatError(err))
    } finally {
      setPetitionSigning(false)
    }
  }

  async function handleSupport(postId: string) {
    if (isGuest) {
      openJoinModal()
      return
    }
    if (!user || !post || isPetitionMovement(post.movement_type)) return
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
      setActionMessage(getActionSuccessMessage(post.movement_type, nowParticipating))
    } catch (err) {
      setActionError(formatError(err))
    } finally {
      setSupporting(false)
    }
  }

  async function handlePollVote(postId: string, optionId: string) {
    if (isGuest || !optionId) {
      openJoinModal()
      return
    }
    if (!user) return
    setPollVoting(true)
    try {
      const poll = await castPollVote(postId, optionId, user.id)
      setPost((current) =>
        current && current.id === postId ? { ...current, poll } : current,
      )
      setActionError(null)
      setActionMessage('Vote recorded! Thanks for sharing your voice.')
    } catch (err) {
      setActionError(formatError(err))
    } finally {
      setPollVoting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="btn-ghost mb-6 min-h-[40px]! px-0!"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </button>

      <AsyncLoadHint
        className="mb-4"
        showSlowHint={showPageLoading && showSlowHint && !displayError}
        showRecovery={showPageLoading && showRecovery && !displayError}
        error={displayError}
        onRetry={reload}
      />

      {actionMessage && !displayError && (
        <div className="mb-4">
          <Toast
            variant="success"
            message={actionMessage}
            onDismiss={() => setActionMessage(null)}
          />
        </div>
      )}

      {showPageLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-10 w-10 animate-spin text-accent-600" />
          <p className="text-sm text-slate-500">Loading movement…</p>
        </div>
      ) : !post && !displayError ? (
        <div className="card-surface p-10 text-center">
          <p className="text-lg font-bold text-slate-900">Movement not found</p>
          <p className="mt-2 text-sm text-slate-600">It may have been removed or is unavailable.</p>
          <Link to={backTo} className="btn-primary mt-6">
            {backLabel}
          </Link>
        </div>
      ) : post ? (
        <PostCard
          post={post}
          highlight
          guestMode={isGuest}
          onSupport={isPetitionMovement(post.movement_type) ? undefined : handleSupport}
          onPetitionSign={
            isPetitionMovement(post.movement_type) ? handlePetitionSign : undefined
          }
          onPollVote={handlePollVote}
          supporting={supporting}
          petitionSigning={petitionSigning}
          pollVoting={pollVoting}
          showIdentityBadge
          showEngagementHint
          showFullMedia
        />
      ) : null}
    </>
  )
}

export default function MovementDetail(props: MovementDetailProps) {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-slate-600">Invalid movement link.</p>
      </section>
    )
  }

  return (
    <section className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:px-6">
      <MovementDetailContent key={`${props.mode}-${id}`} id={id} {...props} />
    </section>
  )
}
