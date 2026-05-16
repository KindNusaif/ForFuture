import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import PostCard from '../components/PostCard'
import Toast from '../components/Toast'
import AsyncLoadHint from '../components/AsyncLoadHint'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { isRequestAborted, withAutoRetry } from '../lib/supabaseRequest'
import { useJoinMovement } from '../hooks/useJoinMovement'
import { useAuthUser } from '../hooks/useAuthUser'
import { fetchPostById } from '../lib/posts'
import { castPollVote } from '../lib/polls'
import { getActionSuccessMessage } from '../lib/movements'
import { togglePostAction } from '../lib/postActions'
import { signPetition } from '../lib/petitionSignatures'
import { isPetitionMovement } from '../lib/petitions'
import { formatError } from '../lib/errors'
import type { Post } from '../types'

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

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supporting, setSupporting] = useState(false)
  const [petitionSigning, setPetitionSigning] = useState(false)
  const [pollVoting, setPollVoting] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { showSlowHint, showRecovery } = useLoadingProgress(loading)

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    let cancelled = false

    // eslint-disable-next-line react-hooks/set-state-in-effect -- load movement on route change
    setLoading(true)
    setError(null)

    withAutoRetry(
      () => fetchPostById(id, isGuest ? undefined : user?.id, controller.signal),
      { signal: controller.signal },
    )
      .then((data) => {
        if (!cancelled && !controller.signal.aborted) setPost(data)
      })
      .catch((err) => {
        if (!cancelled && !isRequestAborted(err)) setError(formatError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [id, isGuest, user?.id])

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
      setError(null)
      setActionMessage('You have supported this petition.')
    } catch (err) {
      setError(formatError(err))
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
      setError(null)
      setActionMessage(getActionSuccessMessage(post.movement_type, nowParticipating))
    } catch (err) {
      setError(formatError(err))
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
      setPost((p) => (p && p.id === postId ? { ...p, poll } : p))
    } catch (err) {
      setError(formatError(err))
    } finally {
      setPollVoting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="btn-ghost mb-6 !min-h-[40px] !px-0"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </button>

      <AsyncLoadHint
        className="mb-4"
        showSlowHint={loading && showSlowHint && !error}
        showRecovery={loading && showRecovery && !error}
        error={error}
        onRetry={() => {
          setLoading(true)
          setError(null)
          void fetchPostById(id, isGuest ? undefined : user?.id)
            .then((data) => setPost(data))
            .catch((err) => setError(formatError(err)))
            .finally(() => setLoading(false))
        }}
      />

      {actionMessage && !error && (
        <div className="mb-4">
          <Toast
            variant="success"
            message={actionMessage}
            onDismiss={() => setActionMessage(null)}
          />
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-10 w-10 animate-spin text-accent-600" />
          <p className="text-sm text-slate-500">Loading movement…</p>
        </div>
      ) : !post ? (
        <div className="card-surface p-10 text-center">
          <p className="text-lg font-bold text-slate-900">Movement not found</p>
          <p className="mt-2 text-sm text-slate-600">It may have been removed or is unavailable.</p>
          <Link to={backTo} className="btn-primary mt-6">
            {backLabel}
          </Link>
        </div>
      ) : (
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
        />
      )}
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
