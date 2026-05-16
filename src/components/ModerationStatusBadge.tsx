import { CONTENT_REPORT_PRIORITY_LABELS, CONTENT_REPORT_STATUS_LABELS } from '../lib/moderation'
import type { ContentReportPriority, ContentReportStatus } from '../lib/moderation'

const statusStyles: Record<ContentReportStatus, string> = {
  submitted: 'bg-slate-100 text-slate-700 ring-slate-200',
  under_review: 'bg-amber-50 text-amber-900 ring-amber-200',
  action_taken: 'bg-brand-50 text-brand-900 ring-brand-200',
  no_violation_found: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  dismissed: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const priorityStyles: Record<ContentReportPriority, string> = {
  high: 'bg-red-50 text-red-800 ring-red-200',
  medium: 'bg-orange-50 text-orange-900 ring-orange-200',
  normal: 'bg-slate-50 text-slate-700 ring-slate-200',
}

export function ModerationStatusBadge({ status }: { status: ContentReportStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${statusStyles[status]}`}
    >
      {CONTENT_REPORT_STATUS_LABELS[status]}
    </span>
  )
}

export function ModerationPriorityBadge({ priority }: { priority: ContentReportPriority }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${priorityStyles[priority]}`}
    >
      {CONTENT_REPORT_PRIORITY_LABELS[priority]}
    </span>
  )
}
