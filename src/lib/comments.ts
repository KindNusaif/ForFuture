import { mapDuplicateActionError } from './duplicateErrors'
import { enhanceSupabaseError, isMissingRelation } from './supabaseErrors'
import { requireSupabase } from './supabase'
import { chunkIds, DEFAULT_REQUEST_TIMEOUT_MS, withTimeout } from './supabaseRequest'

export const COMMENT_MAX_LENGTH = 1000
export const COMMENT_PAGE_SIZE = 20

export type CommentStatus = 'visible' | 'hidden' | 'removed'

export type CommentReportReason =
  | 'harassment_abuse'
  | 'hate_offensive'
  | 'spam'
  | 'misinformation'
  | 'other'

export type CommentReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed'

export interface Comment {
  id: string
  content_type: string
  content_id: string
  user_id: string
  author_display_name: string
  body: string
  status: CommentStatus
  created_at: string
  updated_at: string
}

export interface CommentReport {
  id: string
  comment_id: string
  reporter_id: string
  reason: CommentReportReason
  details: string | null
  status: CommentReportStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface CommentModerationQueueItem {
  id: string
  reporter_id: string
  comment_id: string
  reason: CommentReportReason
  details: string | null
  status: CommentReportStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  comment_body: string | null
  comment_status: CommentStatus | null
  comment_author_display_name: string | null
  comment_created_at: string | null
  content_id: string | null
  content_title: string | null
  content_movement_type: string | null
  content_posting_identity: string | null
}

export const COMMENT_REPORT_REASONS: {
  value: CommentReportReason
  label: string
}[] = [
  { value: 'harassment_abuse', label: 'Harassment or abuse' },
  { value: 'hate_offensive', label: 'Hate or offensive content' },
  { value: 'spam', label: 'Spam' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Other' },
]

const TABLE = 'comments'
const REPORTS_TABLE = 'comment_reports'

const COMMENT_COLUMNS =
  'id, content_type, content_id, user_id, author_display_name, body, status, created_at, updated_at'

function mapComment(row: Record<string, unknown>): Comment {
  return {
    id: row.id as string,
    content_type: row.content_type as string,
    content_id: row.content_id as string,
    user_id: row.user_id as string,
    author_display_name: row.author_display_name as string,
    body: row.body as string,
    status: row.status as CommentStatus,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

function mapCommentModerationItem(row: Record<string, unknown>): CommentModerationQueueItem {
  return {
    id: row.id as string,
    reporter_id: row.reporter_id as string,
    comment_id: row.comment_id as string,
    reason: row.reason as CommentReportReason,
    details: (row.details as string | null) ?? null,
    status: row.status as CommentReportStatus,
    reviewed_by: (row.reviewed_by as string | null) ?? null,
    reviewed_at: (row.reviewed_at as string | null) ?? null,
    created_at: row.created_at as string,
    comment_body: (row.comment_body as string | null) ?? null,
    comment_status: (row.comment_status as CommentStatus | null) ?? null,
    comment_author_display_name: (row.comment_author_display_name as string | null) ?? null,
    comment_created_at: (row.comment_created_at as string | null) ?? null,
    content_id: (row.content_id as string | null) ?? null,
    content_title: (row.content_title as string | null) ?? null,
    content_movement_type: (row.content_movement_type as string | null) ?? null,
    content_posting_identity: (row.content_posting_identity as string | null) ?? null,
  }
}

/** Newest-first discussion order (load-more fetches older pages). */
export type CommentContentType = 'movement' | 'inspire'

export async function fetchCommentsPage(
  contentId: string,
  options?: { limit?: number; before?: string; contentType?: CommentContentType },
): Promise<Comment[]> {
  const client = requireSupabase()
  const limit = options?.limit ?? COMMENT_PAGE_SIZE
  const contentType = options?.contentType ?? 'movement'

  try {
    let query = client
      .from(TABLE)
      .select(COMMENT_COLUMNS)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .eq('status', 'visible')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (options?.before) {
      const { data: cursor } = await withTimeout(
        client.from(TABLE).select('created_at').eq('id', options.before).single(),
        DEFAULT_REQUEST_TIMEOUT_MS,
      )
      if (cursor?.created_at) {
        query = query.lt('created_at', cursor.created_at as string)
      }
    }

    const { data, error } = await withTimeout(query, DEFAULT_REQUEST_TIMEOUT_MS)
    if (error) throw error
    return (data ?? []).map((row) => mapComment(row as unknown as Record<string, unknown>))
  } catch (err) {
    if (isMissingRelation(err)) return []
    throw enhanceSupabaseError(err)
  }
}

export async function fetchCommentCount(
  contentId: string,
  contentType: CommentContentType = 'movement',
): Promise<number> {
  const client = requireSupabase()
  try {
    const { count, error } = await withTimeout(
      client
        .from(TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .eq('status', 'visible'),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )
    if (error) throw error
    return count ?? 0
  } catch (err) {
    if (isMissingRelation(err)) return 0
    throw enhanceSupabaseError(err)
  }
}

export async function fetchCommentCountsForPosts(
  postIds: string[],
): Promise<Record<string, number>> {
  if (postIds.length === 0) return {}
  const client = requireSupabase()
  const counts: Record<string, number> = {}

  try {
    for (const chunk of chunkIds(postIds, 40)) {
      const { data, error } = await withTimeout(
        client
          .from(TABLE)
          .select('content_id')
          .in('content_id', chunk)
          .eq('status', 'visible'),
        DEFAULT_REQUEST_TIMEOUT_MS,
      )
      if (error) throw error
      for (const row of data ?? []) {
        const id = (row as { content_id: string }).content_id
        counts[id] = (counts[id] ?? 0) + 1
      }
    }
    return counts
  } catch (err) {
    if (isMissingRelation(err)) return {}
    throw enhanceSupabaseError(err)
  }
}

export async function createComment(
  contentId: string,
  body: string,
  contentType: CommentContentType = 'movement',
): Promise<Comment> {
  const trimmed = body.trim()
  if (!trimmed) throw new Error('Comment cannot be empty.')
  if (trimmed.length > COMMENT_MAX_LENGTH) {
    throw new Error(`Comment must be ${COMMENT_MAX_LENGTH} characters or fewer.`)
  }

  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client
      .from(TABLE)
      .insert({
        content_type: contentType,
        content_id: contentId,
        body: trimmed,
      })
      .select(COMMENT_COLUMNS)
      .single(),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (error) throw enhanceSupabaseError(error)
  return mapComment(data as unknown as Record<string, unknown>)
}

export async function updateComment(commentId: string, body: string): Promise<Comment> {
  const trimmed = body.trim()
  if (!trimmed) throw new Error('Comment cannot be empty.')
  if (trimmed.length > COMMENT_MAX_LENGTH) {
    throw new Error(`Comment must be ${COMMENT_MAX_LENGTH} characters or fewer.`)
  }

  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client
      .from(TABLE)
      .update({ body: trimmed })
      .eq('id', commentId)
      .eq('status', 'visible')
      .select(COMMENT_COLUMNS)
      .single(),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (error) throw enhanceSupabaseError(error)
  return mapComment(data as unknown as Record<string, unknown>)
}

export async function deleteComment(commentId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client.from(TABLE).update({ status: 'removed' }).eq('id', commentId),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
}

export async function submitCommentReport(
  commentId: string,
  reason: CommentReportReason,
  details?: string,
): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client.from(REPORTS_TABLE).insert({
      comment_id: commentId,
      reason,
      details: details?.trim() || null,
    }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (error) {
    if (error.code === '23505') {
      throw mapDuplicateActionError(error, 'report')
    }
    throw enhanceSupabaseError(error)
  }
}

export async function fetchCommentModerationQueue(): Promise<CommentModerationQueueItem[]> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client.rpc('admin_get_comment_moderation_queue'),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
  return (data ?? []).map((row: Record<string, unknown>) => mapCommentModerationItem(row))
}

export async function updateCommentModerationReport(
  reportId: string,
  status: CommentReportStatus,
  commentStatus?: CommentStatus,
): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client.rpc('admin_update_comment_report', {
      p_report_id: reportId,
      p_status: status,
      p_comment_status: commentStatus ?? null,
    }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )
  if (error) throw enhanceSupabaseError(error)
}

/** Allow editing own comments within 30 minutes of posting. */
export function canEditComment(comment: Comment, userId: string | undefined): boolean {
  if (!userId || comment.user_id !== userId) return false
  if (comment.status !== 'visible') return false
  const created = new Date(comment.created_at).getTime()
  return Date.now() - created < 30 * 60 * 1000
}
