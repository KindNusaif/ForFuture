import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { useToast } from '../../hooks/useToast'
import { useAuthGate } from '../../hooks/useAuthGate'
import { useJoinMovement } from '../../hooks/useJoinMovement'
import { canPostHaveComments } from '../../lib/commentEligibility'
import {
  COMMENT_PAGE_SIZE,
  createComment,
  fetchCommentCount,
  fetchCommentsPage,
  type Comment,
} from '../../lib/comments'
import { authStateFromPath, buildAuthReturn } from '../../lib/authReturn'
import { formatError } from '../../lib/errors'
import CommentComposer from './CommentComposer'
import CommentList from './CommentList'
import type { Post } from '../../types'

interface CommentsSectionProps {
  post: Post
  guestMode?: boolean
  currentUserId?: string
  onCountChange?: (count: number) => void
}

export default function CommentsSection({
  post,
  guestMode = false,
  currentUserId,
  onCountChange,
}: CommentsSectionProps) {
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

  const allowed = canPostHaveComments(post)

  const syncCount = useCallback(
    (next: number) => {
      setCount(next)
      onCountChange?.(next)
    },
    [onCountChange],
  )

  const loadInitial = useCallback(async () => {
    if (!allowed) return
    setLoading(true)
    setError(null)
    try {
      const [page, total] = await Promise.all([
        fetchCommentsPage(post.id, { limit: COMMENT_PAGE_SIZE }),
        fetchCommentCount(post.id),
      ])
      setComments(page)
      syncCount(total)
      setHasMore(page.length < total)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }, [allowed, post.id, syncCount])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  async function loadMore() {
    if (!hasMore || loadingMore || comments.length === 0) return
    const last = comments[comments.length - 1]
    setLoadingMore(true)
    try {
      const page = await fetchCommentsPage(post.id, {
        limit: COMMENT_PAGE_SIZE,
        before: last.id,
      })
      setComments((prev) => [...prev, ...page])
      setHasMore(page.length >= COMMENT_PAGE_SIZE && comments.length + page.length < count)
    } catch (err) {
      toast.error(formatError(err))
    } finally {
      setLoadingMore(false)
    }
  }

  const [runCreate, creating] = useAsyncAction(async (body: string) => {
    const created = await createComment(post.id, body)
    setComments((prev) => [created, ...prev])
    syncCount(count + 1)
  })

  function handleDeleted(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    syncCount(Math.max(0, count - 1))
  }

  function handleUpdated(updated: Comment) {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  if (!allowed) return null

  return (
    <section className="comments-section card-surface" aria-labelledby="discussion-heading">
      <header className="comments-section-header">
        <h2 id="discussion-heading" className="flex items-center gap-2 text-lg font-bold text-primary">
          <MessageCircle className="h-5 w-5 text-accent-600 dark:text-accent-400" aria-hidden />
          {t('comments.title', { defaultValue: 'Discussion' })}
          {count > 0 && (
            <span className="comments-count-badge" aria-label={t('comments.countLabel', { count })}>
              {count}
            </span>
          )}
        </h2>
      </header>

      {guestMode || !isMember ? (
        <div className="comments-guest-cta mt-4 rounded-xl border border-dashed border-default bg-muted/50 px-4 py-4">
          <p className="text-sm text-secondary">
            {t('comments.guestPrompt', {
              defaultValue: 'Create an account to join the discussion.',
            })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary text-sm"
              onClick={() => openJoinModal('comment')}
            >
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
            movementType={post.movement_type}
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
