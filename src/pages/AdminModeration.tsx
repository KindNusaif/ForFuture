import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Shield } from 'lucide-react'
import {
  ModerationPriorityBadge,
  ModerationStatusBadge,
} from '../components/ModerationStatusBadge'
import AsyncLoadHint from '../components/AsyncLoadHint'
import { PostCardSkeleton } from '../components/Skeleton'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { withAutoRetry } from '../lib/supabaseRequest'
import {
  fetchModerationQueue,
  updateModerationReport,
  type ModerationQueueItem,
} from '../lib/contentReports'
import { CONTENT_REPORT_REASONS } from '../lib/moderation'
import type { ContentReportReason, ContentReportStatus } from '../lib/moderation'
import { formatError } from '../lib/errors'
import AdminCommentReportsPanel from '../components/admin/AdminCommentReportsPanel'

const REASON_LABELS = Object.fromEntries(
  CONTENT_REPORT_REASONS.map((r) => [r.value, r.label]),
) as Record<ContentReportReason, string>

const ADMIN_ACTIONS: { status: ContentReportStatus; label: string }[] = [
  { status: 'under_review', label: 'Mark Under Review' },
  { status: 'action_taken', label: 'Mark Action Taken' },
  { status: 'no_violation_found', label: 'Mark No Violation Found' },
  { status: 'dismissed', label: 'Dismiss Report' },
]

function contentTypeLabel(type: string) {
  if (type === 'poll') return 'Community Poll'
  if (type === 'comment') return 'Comment'
  return 'Movement'
}

export default function AdminModeration() {
  const [items, setItems] = useState<ModerationQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
  const { showSlowHint, showRecovery } = useLoadingProgress(loading || refreshing)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const queue = await withAutoRetry(() => fetchModerationQueue())
      setItems(queue)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function handleStatusUpdate(item: ModerationQueueItem, status: ContentReportStatus) {
    setUpdatingId(item.id)
    setError(null)
    try {
      await updateModerationReport(item.id, status, adminNotes[item.id])
      await load(true)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <section className="mx-auto min-w-0 max-w-5xl px-4 py-8 sm:px-6">
      <Link to="/admin" className="btn-ghost mb-6 min-h-10! px-0!">
        <ArrowLeft className="h-4 w-4" />
        Back to admin dashboard
      </Link>

      <header className="card-surface overflow-hidden border border-default bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
              <Shield className="h-4 w-4" aria-hidden />
              Internal moderation only
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Safe Reporting &amp; Fair Moderation
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              Review reported content fairly. Reports do not automatically remove posts. Use
              status updates to track decisions — content removal requires explicit future
              moderation tools.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={loading || refreshing}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/20 bg-surface/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-surface/15 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <AsyncLoadHint
        className="mt-4"
        showSlowHint={loading && showSlowHint && !error}
        showRecovery={loading && showRecovery && !error}
        error={error}
        onRetry={() => void load(true)}
        slowMessage="Loading moderation queue…"
      />

      {loading ? (
        <ul className="mt-6 space-y-4" aria-busy="true">
          {[1, 2].map((i) => (
            <li key={i}>
              <PostCardSkeleton />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="card-surface mt-6 p-10 text-center">
          <p className="text-lg font-bold text-primary">No reports in the queue</p>
          <p className="mt-2 text-sm text-secondary">
            New community reports will appear here for review.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="card-surface overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 border-b border-default bg-muted/80 px-4 py-3 sm:px-5">
                <ModerationPriorityBadge priority={item.priority} />
                <ModerationStatusBadge status={item.status} />
                <span className="text-xs font-medium text-muted">
                  {contentTypeLabel(item.content_type)}
                </span>
                {item.content_report_count > 1 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-secondary">
                    {item.content_report_count} reports on this content
                  </span>
                )}
                {item.high_priority_report_count > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                    {item.high_priority_report_count} high priority
                  </span>
                )}
                <time className="ml-auto text-xs text-muted" dateTime={item.created_at}>
                  {new Date(item.created_at).toLocaleString()}
                </time>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">
                    Report reason
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {REASON_LABELS[item.report_reason] ?? item.report_reason}
                  </p>
                  {item.report_note && (
                    <p className="wrap-user-text mt-2 text-sm text-secondary">{item.report_note}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">
                    Content preview
                  </p>
                  <p className="mt-1 text-base font-bold text-primary">
                    {item.content_title || 'Untitled content'}
                  </p>
                  {item.content_description && (
                    <p className="wrap-user-text mt-1 line-clamp-3 text-sm text-secondary">
                      {item.content_description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    Public view:{' '}
                    {item.content_posting_identity === 'youth_voice'
                      ? `Youth Voice ${item.content_youth_voice_id ?? 'ID'}`
                      : 'Public profile'}
                    {item.content_movement_type && ` · ${item.content_movement_type}`}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
                    Internal moderation only
                  </p>
                  <dl className="mt-2 grid gap-1 text-xs text-amber-950/90 sm:grid-cols-2">
                    <div>
                      <dt className="font-medium text-amber-800">Owner user ID</dt>
                      <dd className="font-mono">{item.internal_owner_user_id ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-amber-800">Owner display name</dt>
                      <dd>{item.internal_owner_display_name ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-amber-800">Owner Youth Voice ID</dt>
                      <dd className="font-mono">{item.internal_owner_youth_voice_id ?? '—'}</dd>
                    </div>
                  </dl>
                </div>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted">
                    Internal admin note
                  </span>
                  <textarea
                    value={adminNotes[item.id] ?? item.admin_note ?? ''}
                    onChange={(e) =>
                      setAdminNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    rows={2}
                    placeholder="Optional note for your team (not shown publicly)"
                    className="wrap-user-text mt-1.5 w-full rounded-xl border border-default px-3 py-2 text-sm"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  {ADMIN_ACTIONS.map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      disabled={updatingId === item.id || item.status === action.status}
                      onClick={() => void handleStatusUpdate(item, action.status)}
                      className="rounded-lg border border-default bg-surface px-3 py-2 text-xs font-semibold text-secondary transition hover:border-accent-300 hover:bg-accent-50 disabled:opacity-50"
                    >
                      {updatingId === item.id ? 'Updating…' : action.label}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminCommentReportsPanel />
    </section>
  )
}
