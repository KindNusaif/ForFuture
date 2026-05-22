import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  FileText,
  Flag,
  HandHeart,
  LayoutList,
  RefreshCw,
  ScrollText,
  Users,
  Vote,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminLoadingSkeleton from '../../components/admin/AdminLoadingSkeleton'
import AdminStatsCard from '../../components/admin/AdminStatsCard'
import { fetchAdminPlatformStats, fetchAdminRecentActivity } from '../../lib/admin/stats'
import { fetchAdminDashboardSummary } from '../../lib/adminDashboard'
import type { AdminRecentActivity, AdminStats } from '../../lib/admin/types'
import { formatError } from '../../lib/errors'
import { withAutoRetry } from '../../lib/supabaseRequest'

function formatStat(value: number | null, unavailable: boolean): string {
  if (value === null) return unavailable ? '—' : '0'
  return String(value)
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activity, setActivity] = useState<AdminRecentActivity[]>([])
  const [queuePending, setQueuePending] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [platformStats, recent, summary] = await withAutoRetry(() =>
        Promise.all([
          fetchAdminPlatformStats(),
          fetchAdminRecentActivity(8),
          fetchAdminDashboardSummary(),
        ]),
      )
      setStats(platformStats)
      setActivity(recent)
      const pending =
        (summary.contentReportsPending ?? 0) +
        (summary.commentReportsPending ?? 0) +
        (summary.campaignsPending ?? 0) +
        (summary.orgVerificationPending ?? 0)
      setQueuePending(pending)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const unavailable = stats?.statsUnavailable ?? true

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {t('admin.overview.subtitle', {
            defaultValue: 'Monitor platform health. Read-only for launch.',
          })}
        </p>
        <button
          type="button"
          className="btn-ghost inline-flex items-center gap-2 text-sm"
          onClick={() => void load()}
          disabled={loading}
          aria-label={t('common.refresh', { defaultValue: 'Refresh' })}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh', { defaultValue: 'Refresh' })}
        </button>
      </div>

      {stats?.statsUnavailable ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {t('admin.overview.rpcHint', {
            defaultValue:
              'Run supabase/admin_dashboard_rpcs.sql in Supabase for full user and post counts.',
          })}
        </p>
      ) : null}

      {error ? (
        <div className="admin-card flex flex-wrap items-center justify-between gap-3 border-red-200 dark:border-red-900">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button type="button" className="btn-secondary text-sm" onClick={() => void load()}>
            {t('common.retry', { defaultValue: 'Retry' })}
          </button>
        </div>
      ) : null}

      <section aria-labelledby="admin-stats-heading">
        <h2 id="admin-stats-heading" className="sr-only">
          {t('admin.overview.statsHeading', { defaultValue: 'Platform statistics' })}
        </h2>
        <div className="admin-stat-grid">
          <AdminStatsCard
            icon={Users}
            label={t('admin.stats.users', { defaultValue: 'Total users' })}
            value={formatStat(stats?.totalUsers ?? null, unavailable)}
            loading={loading}
            helper={unavailable ? t('admin.stats.limited', { defaultValue: 'Limited without RPC' }) : undefined}
          />
          <AdminStatsCard
            icon={FileText}
            label={t('admin.stats.posts', { defaultValue: 'Total posts' })}
            value={formatStat(stats?.totalPosts ?? null, unavailable)}
            loading={loading}
          />
          <AdminStatsCard
            icon={ScrollText}
            label={t('admin.stats.petitions', { defaultValue: 'Petitions' })}
            value={formatStat(stats?.totalPetitions ?? null, unavailable)}
            loading={loading}
          />
          <AdminStatsCard
            icon={Vote}
            label={t('admin.stats.polls', { defaultValue: 'Polls' })}
            value={formatStat(stats?.totalPolls ?? null, unavailable)}
            loading={loading}
          />
          <AdminStatsCard
            icon={HandHeart}
            label={t('admin.stats.volunteer', { defaultValue: 'Volunteer drives' })}
            value={formatStat(stats?.totalVolunteerDrives ?? null, unavailable)}
            loading={loading}
          />
          <AdminStatsCard
            icon={Flag}
            label={t('admin.stats.reports', { defaultValue: 'Pending reports' })}
            value={formatStat(stats?.totalReportsPending ?? queuePending, false)}
            loading={loading}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-primary">
            {t('admin.overview.recentActivity', { defaultValue: 'Recent activity' })}
          </h2>
          {loading ? (
            <AdminLoadingSkeleton rows={5} />
          ) : activity.length === 0 ? (
            <AdminEmptyState
              icon={LayoutList}
              title={t('admin.overview.noActivityTitle', { defaultValue: 'No recent activity' })}
              message={t('admin.overview.noActivityMessage', {
                defaultValue: 'Activity will appear after the admin RPC is enabled or as users join.',
              })}
            />
          ) : (
            <ul className="admin-card divide-y divide-subtle p-0">
              {activity.map((item) => (
                <li key={`${item.activityType}-${item.activityId}`} className="flex gap-3 px-4 py-3 text-sm">
                  <span className="shrink-0 rounded-md bg-accent-100 px-2 py-0.5 text-xs font-medium capitalize text-accent-800 dark:bg-accent-900/50 dark:text-accent-200">
                    {item.activityType}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-primary">{item.title}</p>
                    <p className="text-xs text-muted">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-primary">
            {t('admin.overview.quickLinks', { defaultValue: 'Quick links' })}
          </h2>
          <div className="admin-card space-y-2">
            <Link to="/admin/reports" className="admin-nav-link">
              <AlertTriangle className="h-4 w-4" />
              {t('admin.nav.reports', { defaultValue: 'Reports' })}
            </Link>
            <Link to="/admin/moderation" className="admin-nav-link">
              <Flag className="h-4 w-4" />
              {t('admin.nav.fullModeration', { defaultValue: 'Full moderation' })}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
