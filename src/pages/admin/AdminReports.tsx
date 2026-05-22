import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminLoadingSkeleton from '../../components/admin/AdminLoadingSkeleton'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge'
import AdminTable, { type AdminTableColumn } from '../../components/admin/AdminTable'
import { fetchAdminReports } from '../../lib/admin/reports'
import type { AdminReportItem } from '../../lib/admin/types'
import { formatError } from '../../lib/errors'
import { withAutoRetry } from '../../lib/supabaseRequest'

export default function AdminReports() {
  const { t } = useTranslation()
  const [reports, setReports] = useState<AdminReportItem[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await withAutoRetry(() => fetchAdminReports())
      setReports(rows)
    } catch (err) {
      setError(formatError(err))
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return reports
    return reports.filter((r) => r.status.toLowerCase().includes(statusFilter))
  }, [reports, statusFilter])

  const columns: AdminTableColumn<AdminReportItem>[] = useMemo(
    () => [
      {
        key: 'type',
        header: t('admin.reports.type', { defaultValue: 'Type' }),
        render: (row) => (
          <span className="capitalize">
            {row.source} · {row.contentType}
          </span>
        ),
      },
      {
        key: 'preview',
        header: t('admin.reports.preview', { defaultValue: 'Preview' }),
        render: (row) => (
          <p className="max-w-[12rem] truncate text-primary">
            {row.contentTitle ?? row.contentId.slice(0, 8)}
          </p>
        ),
      },
      {
        key: 'reason',
        header: t('admin.reports.reason', { defaultValue: 'Reason' }),
        render: (row) => <AdminStatusBadge status={row.reportReason} />,
      },
      {
        key: 'status',
        header: t('admin.reports.status', { defaultValue: 'Status' }),
        render: (row) => <AdminStatusBadge status={row.status} />,
      },
      {
        key: 'date',
        header: t('admin.reports.date', { defaultValue: 'Reported' }),
        render: (row) => new Date(row.createdAt).toLocaleDateString(),
      },
    ],
    [t],
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {t('admin.reports.readOnlyNote', {
          defaultValue:
            'Read-only report list. Use Full moderation to update report status when needed.',
        })}{' '}
        <Link to="/admin/moderation" className="text-accent-600 underline dark:text-accent-400">
          {t('admin.nav.fullModeration', { defaultValue: 'Full moderation' })}
        </Link>
      </p>

      <label className="flex flex-col gap-1 text-sm sm:w-48">
        <span className="font-medium text-primary">
          {t('admin.reports.filterStatus', { defaultValue: 'Status' })}
        </span>
        <select
          className="input-field"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">{t('admin.filters.all', { defaultValue: 'All' })}</option>
          <option value="open">Open</option>
          <option value="review">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismiss">Dismissed</option>
        </select>
      </label>

      {error ? (
        <div className="admin-card flex justify-between gap-3">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" className="btn-secondary text-sm" onClick={() => void load()}>
            {t('common.retry', { defaultValue: 'Retry' })}
          </button>
        </div>
      ) : null}

      {loading ? (
        <AdminLoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          icon={Flag}
          title={t('admin.reports.emptyTitle', { defaultValue: 'No reports yet' })}
          message={t('admin.reports.emptyMessage', {
            defaultValue: 'When users report content, it will appear here for review.',
          })}
        />
      ) : (
        <AdminTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => `${r.source}-${r.id}`}
          caption={t('admin.reports.tableCaption', { defaultValue: 'Content and comment reports' })}
        />
      )}
    </div>
  )
}
