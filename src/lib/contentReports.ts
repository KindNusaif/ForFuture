import { enhanceSupabaseError } from './supabaseErrors'
import { requireSupabase } from './supabase'
import { DEFAULT_REQUEST_TIMEOUT_MS, withTimeout } from './supabaseRequest'
import type {
  ContentReportPriority,
  ContentReportReason,
  ContentReportStatus,
  ReportableContentType,
} from './moderation'

export interface ContentReport {
  id: string
  reporter_user_id: string
  content_type: ReportableContentType
  content_id: string
  report_reason: ContentReportReason
  report_note: string | null
  status: ContentReportStatus
  priority: ContentReportPriority
  reviewed_by: string | null
  reviewed_at: string | null
  admin_note: string | null
  created_at: string
}

export interface SubmitContentReportInput {
  contentType: ReportableContentType
  contentId: string
  reason: ContentReportReason
  note?: string
}

export interface ModerationQueueItem {
  id: string
  reporter_user_id: string
  content_type: ReportableContentType
  content_id: string
  report_reason: ContentReportReason
  report_note: string | null
  status: ContentReportStatus
  priority: ContentReportPriority
  admin_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  content_report_count: number
  high_priority_report_count: number
  content_title: string | null
  content_description: string | null
  content_movement_type: string | null
  content_posting_identity: string | null
  content_youth_voice_id: string | null
  internal_owner_user_id: string | null
  internal_owner_display_name: string | null
  internal_owner_youth_voice_id: string | null
}

function mapContentReport(row: Record<string, unknown>): ContentReport {
  return {
    id: row.id as string,
    reporter_user_id: row.reporter_user_id as string,
    content_type: row.content_type as ReportableContentType,
    content_id: row.content_id as string,
    report_reason: row.report_reason as ContentReportReason,
    report_note: (row.report_note as string | null) ?? null,
    status: row.status as ContentReportStatus,
    priority: row.priority as ContentReportPriority,
    reviewed_by: (row.reviewed_by as string | null) ?? null,
    reviewed_at: (row.reviewed_at as string | null) ?? null,
    admin_note: (row.admin_note as string | null) ?? null,
    created_at: row.created_at as string,
  }
}

function mapModerationQueueItem(row: Record<string, unknown>): ModerationQueueItem {
  return {
    id: row.id as string,
    reporter_user_id: row.reporter_user_id as string,
    content_type: row.content_type as ReportableContentType,
    content_id: row.content_id as string,
    report_reason: row.report_reason as ContentReportReason,
    report_note: (row.report_note as string | null) ?? null,
    status: row.status as ContentReportStatus,
    priority: row.priority as ContentReportPriority,
    admin_note: (row.admin_note as string | null) ?? null,
    reviewed_by: (row.reviewed_by as string | null) ?? null,
    reviewed_at: (row.reviewed_at as string | null) ?? null,
    created_at: row.created_at as string,
    content_report_count: Number(row.content_report_count ?? 1),
    high_priority_report_count: Number(row.high_priority_report_count ?? 0),
    content_title: (row.content_title as string | null) ?? null,
    content_description: (row.content_description as string | null) ?? null,
    content_movement_type: (row.content_movement_type as string | null) ?? null,
    content_posting_identity: (row.content_posting_identity as string | null) ?? null,
    content_youth_voice_id: (row.content_youth_voice_id as string | null) ?? null,
    internal_owner_user_id: (row.internal_owner_user_id as string | null) ?? null,
    internal_owner_display_name: (row.internal_owner_display_name as string | null) ?? null,
    internal_owner_youth_voice_id: (row.internal_owner_youth_voice_id as string | null) ?? null,
  }
}

export async function submitContentReport(
  reporterUserId: string,
  input: SubmitContentReportInput,
): Promise<ContentReport> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client
      .from('content_reports')
      .insert({
        reporter_user_id: reporterUserId,
        content_type: input.contentType,
        content_id: input.contentId,
        report_reason: input.reason,
        report_note: input.note?.trim() || null,
      })
      .select(
        'id, reporter_user_id, content_type, content_id, report_reason, report_note, status, priority, reviewed_by, reviewed_at, admin_note, created_at',
      )
      .single(),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already submitted a report for this content.')
    }
    throw enhanceSupabaseError(error)
  }

  return mapContentReport(data as unknown as Record<string, unknown>)
}

export async function fetchMyContentReports(userId: string): Promise<ContentReport[]> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client
      .from('content_reports')
      .select(
        'id, reporter_user_id, content_type, content_id, report_reason, report_note, status, priority, reviewed_by, reviewed_at, admin_note, created_at',
      )
      .eq('reporter_user_id', userId)
      .order('created_at', { ascending: false }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (error) throw enhanceSupabaseError(error)
  return (data ?? []).map((row) => mapContentReport(row as unknown as Record<string, unknown>))
}

export async function fetchModerationQueue(): Promise<ModerationQueueItem[]> {
  const client = requireSupabase()
  const { data, error } = await withTimeout(
    client.rpc('admin_get_moderation_queue'),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (error) throw enhanceSupabaseError(error)
  return (data ?? []).map((row: Record<string, unknown>) =>
    mapModerationQueueItem(row),
  )
}

export async function updateModerationReport(
  reportId: string,
  status: ContentReportStatus,
  adminNote?: string,
): Promise<void> {
  const client = requireSupabase()
  const { error } = await withTimeout(
    client.rpc('admin_update_content_report', {
      p_report_id: reportId,
      p_status: status,
      p_admin_note: adminNote?.trim() || null,
    }),
    DEFAULT_REQUEST_TIMEOUT_MS,
  )

  if (error) throw enhanceSupabaseError(error)
}
