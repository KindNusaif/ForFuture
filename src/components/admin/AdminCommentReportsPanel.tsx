import { useCallback, useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import {
  fetchCommentModerationQueue,
  updateCommentModerationReport,
  COMMENT_REPORT_REASONS,
  type CommentModerationQueueItem,
  type CommentReportStatus,
  type CommentStatus,
} from '../../lib/comments'
import { formatError } from '../../lib/errors'
import { withAutoRetry } from '../../lib/supabaseRequest'

const REASON_LABELS = Object.fromEntries(
  COMMENT_REPORT_REASONS.map((r) => [r.value, r.label]),
)

const REPORT_ACTIONS: { status: CommentReportStatus; label: string }[] = [
  { status: 'reviewing', label: 'Mark reviewing' },
  { status: 'resolved', label: 'Resolve report' },
  { status: 'dismissed', label: 'Dismiss report' },
]

const COMMENT_ACTIONS: { status: CommentStatus; label: string }[] = [
  { status: 'hidden', label: 'Hide comment' },
  { status: 'removed', label: 'Remove comment' },
]

export default function AdminCommentReportsPanel() {
  const [items, setItems] = useState<CommentModerationQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const queue = await withAutoRetry(() => fetchCommentModerationQueue())
      setItems(queue)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleReportUpdate(
    item: CommentModerationQueueItem,
    status: CommentReportStatus,
    commentStatus?: CommentStatus,
  ) {
    setUpdatingId(item.id)
    try {
      await updateCommentModerationReport(item.id, status, commentStatus, {
        contentId: item.content_id,
      })
      await load()
    } catch (err) {
      setError(formatError(err))
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <p className="mt-8 text-sm text-muted" aria-busy="true">
        Loading comment reports…
      </p>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <section className="mt-10" aria-labelledby="comment-reports-heading">
      <h2
        id="comment-reports-heading"
        className="flex items-center gap-2 text-xl font-bold text-primary"
      >
        <MessageSquare className="h-5 w-5 text-accent-600" aria-hidden />
        Comment reports
      </h2>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={item.id} className="card-surface overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-default bg-muted/80 px-4 py-3">
              <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[11px] font-semibold text-accent-800 dark:bg-accent-950 dark:text-accent-200">
                {item.status}
              </span>
              <time className="ml-auto text-xs text-muted" dateTime={item.created_at}>
                {new Date(item.created_at).toLocaleString()}
              </time>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Reason</p>
                <p className="mt-1 text-sm font-semibold text-primary">
                  {REASON_LABELS[item.reason] ?? item.reason}
                </p>
                {item.details && (
                  <p className="wrap-user-text mt-1 text-sm text-secondary">{item.details}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Comment</p>
                <p className="wrap-user-text mt-1 text-sm text-secondary">{item.comment_body}</p>
                <p className="mt-1 text-xs text-muted">
                  by {item.comment_author_display_name} · status: {item.comment_status}
                </p>
              </div>
              {item.content_title && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">On movement</p>
                  <p className="mt-1 text-sm font-semibold text-primary">{item.content_title}</p>
                  {item.content_movement_type && (
                    <p className="text-xs text-muted">{item.content_movement_type}</p>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {REPORT_ACTIONS.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    disabled={updatingId === item.id || item.status === action.status}
                    onClick={() => void handleReportUpdate(item, action.status)}
                    className="rounded-lg border border-default px-3 py-2 text-xs font-semibold text-secondary hover:bg-muted disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
                {COMMENT_ACTIONS.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    disabled={updatingId === item.id}
                    onClick={() =>
                      void handleReportUpdate(item, 'resolved', action.status)
                    }
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
