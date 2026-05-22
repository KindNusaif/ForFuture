import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminLoadingSkeleton from '../../components/admin/AdminLoadingSkeleton'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge'
import AdminTable, { type AdminTableColumn } from '../../components/admin/AdminTable'
import { fetchAdminUsers } from '../../lib/admin/users'
import type { AdminUser } from '../../lib/admin/types'
import { formatError } from '../../lib/errors'
import { withAutoRetry } from '../../lib/supabaseRequest'

function displayName(user: AdminUser): string {
  return user.displayName?.trim() || user.youthVoiceId?.trim() || 'Unnamed user'
}

export default function AdminUsers() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<AdminUser | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(id)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await withAutoRetry(() => fetchAdminUsers({ search: debouncedSearch }))
      setUsers(rows)
    } catch (err) {
      setError(formatError(err))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    if (roleFilter === 'all') return users
    return users.filter((u) => u.role === roleFilter)
  }, [users, roleFilter])

  const columns: AdminTableColumn<AdminUser>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('admin.users.name', { defaultValue: 'Name' }),
        render: (row) => (
          <button
            type="button"
            className="text-left font-medium text-accent-700 hover:underline dark:text-accent-300"
            onClick={() => setSelected(row)}
          >
            {displayName(row)}
          </button>
        ),
      },
      {
        key: 'role',
        header: t('admin.users.role', { defaultValue: 'Role' }),
        render: (row) => <AdminStatusBadge status={row.role} />,
      },
      {
        key: 'status',
        header: t('admin.users.status', { defaultValue: 'Status' }),
        render: (row) => <AdminStatusBadge status={row.status} />,
      },
      {
        key: 'created',
        header: t('admin.users.created', { defaultValue: 'Joined' }),
        render: (row) =>
          row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—',
      },
    ],
    [t],
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {t('admin.users.readOnlyNote', {
          defaultValue: 'Read-only user list. Email is not exposed from the browser.',
        })}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-primary">
            {t('admin.users.search', { defaultValue: 'Search users' })}
          </span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              className="input-field w-full pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.users.searchPlaceholder', {
                defaultValue: 'Name or Youth Voice ID',
              })}
            />
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:w-40">
          <span className="font-medium text-primary">
            {t('admin.users.filterRole', { defaultValue: 'Role' })}
          </span>
          <select
            className="input-field"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          >
            <option value="all">{t('admin.filters.all', { defaultValue: 'All' })}</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className="admin-card flex justify-between gap-3">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" className="btn-secondary text-sm" onClick={() => void load()}>
            {t('common.retry', { defaultValue: 'Retry' })}
          </button>
        </div>
      ) : null}

      {loading ? (
        <AdminLoadingSkeleton rows={8} />
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title={t('admin.users.emptyTitle', { defaultValue: 'No users found' })}
          message={t('admin.users.emptyMessage', {
            defaultValue: 'Try a different search or run admin_dashboard_rpcs.sql for full listing.',
          })}
        />
      ) : (
        <AdminTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          caption={t('admin.users.tableCaption', { defaultValue: 'Platform users' })}
        />
      )}

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-user-detail-title"
          onKeyDown={(e) => e.key === 'Escape' && setSelected(null)}
        >
          <div className="card-surface max-w-md w-full p-6 shadow-xl">
            <h2 id="admin-user-detail-title" className="text-lg font-semibold text-primary">
              {displayName(selected)}
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-muted">ID</dt>
                <dd className="font-mono text-xs break-all">{selected.id}</dd>
              </div>
              {selected.youthVoiceId ? (
                <div>
                  <dt className="text-muted">Youth Voice ID</dt>
                  <dd>{selected.youthVoiceId}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted">{t('admin.users.role', { defaultValue: 'Role' })}</dt>
                <dd>
                  <AdminStatusBadge status={selected.role} />
                </dd>
              </div>
            </dl>
            <button type="button" className="btn-secondary mt-4 w-full" onClick={() => setSelected(null)}>
              {t('common.close', { defaultValue: 'Close' })}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
