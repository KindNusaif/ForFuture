import { fetchCommentModerationQueue } from '../comments'
import { fetchModerationQueue } from '../contentReports'
import type { AdminReportItem } from './types'

export async function fetchAdminReports(): Promise<AdminReportItem[]> {
  const [contentResult, commentResult] = await Promise.allSettled([
    fetchModerationQueue(),
    fetchCommentModerationQueue(),
  ])

  const items: AdminReportItem[] = []

  if (contentResult.status === 'fulfilled') {
    for (const row of contentResult.value) {
      items.push({
        id: row.id,
        source: 'content',
        contentType: row.content_type,
        contentId: row.content_id,
        reportReason: row.report_reason,
        status: row.status,
        priority: row.priority,
        contentTitle: row.content_title,
        createdAt: row.created_at,
      })
    }
  }

  if (commentResult.status === 'fulfilled') {
    for (const row of commentResult.value) {
      items.push({
        id: row.id,
        source: 'comment',
        contentType: 'comment',
        contentId: row.comment_id,
        reportReason: row.reason,
        status: row.status,
        priority: null,
        contentTitle: row.comment_body,
        createdAt: row.created_at,
      })
    }
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}
