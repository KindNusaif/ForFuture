import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { useDataSync } from '../../hooks/useDataSync'
import { useAuthGate } from '../../hooks/useAuthGate'
import { useJoinMovement } from '../../hooks/useJoinMovement'
import { useToast } from '../../hooks/useToast'
import {
  COMMENT_PAGE_SIZE,
  createComment,
  fetchCommentCount,
  fetchCommentsPage,
  type Comment,
} from '../../lib/comments'
import { authStateFromPath, buildAuthReturn } from '../../lib/authReturn'
import { formatError } from '../../lib/errors'
import CommentComposer from '../comments/CommentComposer'
import CommentList from '../comments/CommentList'

interface InspireCommentsSectionProps {
  inspirePostId: string
  guestMode?: boolean
  currentUserId?: string
  onCountChange?: (count: number) => void
}

export default function InspireCommentsSection({
  inspirePostId,
  guestMode = false,
  currentUserId,
  onCountChange,
}: InspireCommentsSectionProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const location = useLocation()
  const { isMember } = useAuthGate()
  const { openJoinModal } = useJoinMovement()
  const authReturn = buildAuthReturn(location.pathname, location.search, location.hash)
  const loginState = authStateFromPath(authReturn)

  const [comments, setComments] = useState<Comment[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const syncCount = useCallback(
    (next: number) => {
      setCount(next)
      onCountChange?.(next)
    },
    [onCountChange],
  )

  const commentsRef = useRef(comments)
  useEffect(() => {
    commentsRef.current = comments
  }, [comments])

  const loadInitial = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true)
    setError(null)
    try {
      const [page, total] = await Promise.all([
        fetchCommentsPage(inspirePostId, { limit: COMMENT_PAGE_SIZE, contentType: 'inspire' }),
        fetchCommentCount(inspirePostId, 'inspire'),
      ])
      setComments(page)
      syncCount(total)
      setHasMore(page.length < total)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }, [inspirePostId, syncCount])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  useDataSync((event) => {
    if (event.type !== 'comments:changed') return
    if (event.postId !== inspirePostId) return
    if (event.contentType !== 'inspire') return
    void loadInitial({ silent: commentsRef.current.length > 0 })
  })

  const [runCreate, creating] = useAsyncAction(async (body: string) => {
    const created = await createComment(inspirePostId, body, 'inspire')
    setComments((prev) => [created, ...prev])
    syncCount(count + 1)
    toast.success(t('comments.posted', { defaultValue: 'Comment posted.' }))
  })

  function handleDeleted(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    syncCount(Math.max(0, count - 1))
  }

  function handleUpdated(comment: Comment) {
    setComments((prev) => prev.map((c) => (c.id === comment.id ? comment : c)))
  }

  async function loadMore() {
    if (!hasMore || loadingMore || comments.length === 0) return
    setLoadingMore(true)
    try {
      const older = await fetchCommentsPage(inspirePostId, {
        limit: COMMENT_PAGE_SIZE,
        before: comments[comments.length - 1]?.id,
        contentType: 'inspire',
      })
      setComments((prev) => [...prev, ...older])
      setHasMore(older.length === COMMENT_PAGE_SIZE)
    } catch (err) {
      toast.error(formatError(err))
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <section className="comments-section card-surface mt-8" aria-labelledby="inspire-comments-heading">
      <header className="comments-section-header">
        <h2 id="inspire-comments-heading" className="flex items-center gap-2 text-lg font-bold text-primary">
          <MessageCircle className="h-5 w-5 text-accent-600 dark:text-accent-400" aria-hidden />
          {t('comments.title', { defaultValue: 'Discussion' })}
          {count > 0 && <span className="comments-count-badge">{count}</span>}
        </h2>
      </header>

      {guestMode || !isMember ? (
        <div className="comments-guest-cta mt-4 rounded-xl border border-dashed border-default bg-muted/50 px-4 py-4">
          <p className="text-sm text-secondary">
            {t('inspire.guestCommentHint', { defaultValue: 'Create an account to join the conversation.' })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-primary text-sm" onClick={() => openJoinModal('inspire')}>
              {t('comments.createAccount', { defaultValue: 'Create account' })}
            </button>
            <Link to="/login" state={loginState} className="btn-secondary text-sm">
              {t('comments.logIn', { defaultValue: 'Log in' })}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <CommentComposer
            movementType="idea_for_change"
            submitting={creating}
            onSubmit={async (body) => {
              try {
                await runCreate(body)
              } catch (err) {
                toast.error(formatError(err))
              }
            }}
          />
        </div>
      )}

      <div className="mt-6">
        <CommentList
          comments={comments}
          loading={loading}
          error={error}
          currentUserId={currentUserId}
          onDeleted={handleDeleted}
          onUpdated={handleUpdated}
        />
        {hasMore && !loading && (
          <button
            type="button"
            className="btn-ghost mt-4 w-full text-sm"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore
              ? t('comments.loadingMore', { defaultValue: 'Loading…' })
              : t('comments.loadMore', { defaultValue: 'Load more comments' })}
          </button>
        )}
      </div>
    </section>
  )
}
