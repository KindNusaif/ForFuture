import { requireSupabase } from '../supabase'
import { fetchAdminDashboardSummary } from '../adminDashboard'
import type { AdminRecentActivity, AdminStats } from './types'

const EMPTY_STATS: AdminStats = {
  totalUsers: null,
  totalPosts: null,
  totalPetitions: null,
  totalPolls: null,
  totalVolunteerDrives: null,
  totalReportsPending: null,
  statsUnavailable: true,
}

function mapRpcStats(row: Record<string, unknown>): AdminStats {
  return {
    totalUsers: typeof row.total_users === 'number' ? row.total_users : Number(row.total_users ?? 0),
    totalPosts: typeof row.total_posts === 'number' ? row.total_posts : Number(row.total_posts ?? 0),
    totalPetitions:
      typeof row.total_petitions === 'number'
        ? row.total_petitions
        : Number(row.total_petitions ?? 0),
    totalPolls: typeof row.total_polls === 'number' ? row.total_polls : Number(row.total_polls ?? 0),
    totalVolunteerDrives:
      typeof row.total_volunteer_drives === 'number'
        ? row.total_volunteer_drives
        : Number(row.total_volunteer_drives ?? 0),
    totalReportsPending:
      typeof row.total_reports_pending === 'number'
        ? row.total_reports_pending
        : Number(row.total_reports_pending ?? 0),
    statsUnavailable: false,
  }
}

/** Platform-wide counts via admin RPC; falls back to queue-only counts if RPC missing. */
export async function fetchAdminPlatformStats(): Promise<AdminStats> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_get_platform_stats')

  if (!error && data && typeof data === 'object') {
    return mapRpcStats(data as Record<string, unknown>)
  }

  const summary = await fetchAdminDashboardSummary()
  const pending =
    (summary.contentReportsPending ?? 0) + (summary.commentReportsPending ?? 0)

  return {
    ...EMPTY_STATS,
    totalReportsPending: pending > 0 ? pending : summary.contentReportsPending,
    statsUnavailable: true,
  }
}

export async function fetchAdminRecentActivity(limit = 10): Promise<AdminRecentActivity[]> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_get_recent_activity', { p_limit: limit })

  if (error || !Array.isArray(data)) {
    return []
  }

  return data.map((row: Record<string, unknown>) => ({
    activityType: String(row.activity_type ?? 'unknown'),
    activityId: String(row.activity_id ?? ''),
    title: String(row.title ?? 'Activity'),
    createdAt: String(row.created_at ?? ''),
  }))
}
