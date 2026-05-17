import { useEffect, useState } from 'react'
import { Flag, Loader2 } from 'lucide-react'
import { ModerationStatusBadge } from './ModerationStatusBadge'
import { fetchMyContentReports, type ContentReport } from '../lib/contentReports'
import { CONTENT_REPORT_REASONS } from '../lib/moderation'
import { formatError } from '../lib/errors'

const reasonLabels = Object.fromEntries(
  CONTENT_REPORT_REASONS.map((r) => [r.value, r.label]),
)

function contentTypeLabel(type: ContentReport['content_type']) {
  if (type === 'poll') return 'Quick Youth Poll'
  if (type === 'comment') return 'Comment'
  return 'Movement'
}

export default function MyReportsSection({ userId }: { userId: string }) {
  const [reports, setReports] = useState<ContentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchMyContentReports(userId)
      .then((data) => {
        if (!cancelled) setReports(data)
      })
      .catch((err) => {
        if (!cancelled) setError(formatError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <Flag className="h-5 w-5 text-muted" aria-hidden />
        <h3 className="text-lg font-semibold text-primary">My Reports</h3>
      </div>
      <p className="mb-4 text-sm text-secondary">
        Track reports you have submitted. Content stays visible while our team reviews fairly.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your reports…
        </div>
      ) : error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-default bg-muted/50 px-4 py-8 text-center text-sm text-secondary">
          You have not submitted any reports yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-surface px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary">
                  {contentTypeLabel(report.content_type)}
                </p>
                <p className="mt-0.5 text-xs text-secondary">
                  {reasonLabels[report.report_reason] ?? report.report_reason} ·{' '}
                  {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
              <ModerationStatusBadge status={report.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
