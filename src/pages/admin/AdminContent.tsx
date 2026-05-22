import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileText, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminLoadingSkeleton from '../../components/admin/AdminLoadingSkeleton'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge'
import AdminTable, { type AdminTableColumn } from '../../components/admin/AdminTable'
import { fetchAdminContent } from '../../lib/admin/content'
import type { AdminContentItem } from '../../lib/admin/types'
import { formatError } from '../../lib/errors'
import { withAutoRetry } from '../../lib/supabaseRequest'

const MOVEMENT_FILTERS = [
  'all',
  'standard',
  'petition',
  'youth_petition',
  'poll',
  'volunteer',
  'donation',
  'relief',
] as const

export default function AdminContent() {
  const { t } = useTranslation()
  const [items, setItems] = useState<AdminContentItem[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [movementFilter, setMovementFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(id)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await withAutoRetry(() =>
        fetchAdminContent({
          search: debouncedSearch,
          movementType: movementFilter,
        }),
      )
      setItems(rows)
    } catch (err) {
      setError(formatError(err))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, movementFilter])

  useEffect(() => {
    void load()
  }, [load])

  const columns: AdminTableColumn<AdminContentItem>[] = useMemo(
    () => [
      {
        key: 'title',
        header: t('admin.content.title', { defaultValue: 'Title' }),
        render: (row) => (
          <div className="max-w-[14rem]">
            <p className="font-medium text-primary line-clamp-2">{row.title}</p>
            <p className="text-xs text-muted line-clamp-1">{row.authorName}</p>
          </div>
        ),
      },
      {
        key: 'type',
        header: t('admin.content.type', { defaultValue: 'Type' }),
        render: (row) => <AdminStatusBadge status={row.movementType} />,
      },
      {
        key: 'status',
        header: t('admin.content.status', { defaultValue: 'Status' }),
        render: (row) => (
          <AdminStatusBadge status={row.publicationStatus ?? 'published'} />
        ),
      },
      {
        key: 'created',
        header: t('admin.content.created', { defaultValue: 'Created' }),
        render: (row) => new Date(row.createdAt).toLocaleDateString(),
      },
    ],
    [t],
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {t('admin.content.readOnlyNote', {
          defaultValue: 'Read-only content browser. Status updates are not enabled in this release.',
        })}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-primary">
            {t('admin.content.search', { defaultValue: 'Search content' })}
          </span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              className="input-field w-full pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:w-48">
          <span className="font-medium text-primary">
            {t('admin.content.filterType', { defaultValue: 'Content type' })}
          </span>
          <select
            className="input-field"
            value={movementFilter}
            onChange={(e) => setMovementFilter(e.target.value)}
          >
            {MOVEMENT_FILTERS.map((v) => (
              <option key={v} value={v}>
                {v === 'all' ? t('admin.filters.all', { defaultValue: 'All' }) : v}
              </option>
            ))}
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
      ) : items.length === 0 ? (
        <AdminEmptyState
          icon={FileText}
          title={t('admin.content.emptyTitle', { defaultValue: 'No content found' })}
          message={t('admin.content.emptyMessage', {
            defaultValue: 'Adjust filters or search to find movements and posts.',
          })}
        />
      ) : (
        <AdminTable
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          caption={t('admin.content.tableCaption', { defaultValue: 'Platform content' })}
        />
      )}
    </div>
  )
}
