import { useCallback, useEffect, useState } from 'react'
import { Building2, RefreshCw } from 'lucide-react'
import {
  adminFetchOrgVerificationQueue,
  adminUpdateOrgVerification,
  profileTypeForOrgApplication,
  type OrgVerificationStatus,
  type OrganizationVerificationRequest,
} from '../../lib/organizationVerification'
import { formatError } from '../../lib/errors'

const STATUS_OPTIONS: { value: OrgVerificationStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'needs_changes', label: 'Needs changes' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function AdminOrgVerificationQueue() {
  const [statusFilter, setStatusFilter] = useState<OrgVerificationStatus | ''>('submitted')
  const [queue, setQueue] = useState<OrganizationVerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const items = await adminFetchOrgVerificationQueue(statusFilter)
      setQueue(items)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  async function handleUpdate(
    item: OrganizationVerificationRequest,
    status: OrgVerificationStatus,
  ) {
    setUpdatingId(item.id)
    setError(null)
    try {
      await adminUpdateOrgVerification(item.id, status, {
        adminNote: notes[item.id],
        grantVerification: status === 'approved',
        verificationType: profileTypeForOrgApplication(item.organization_type),
      })
      await load(true)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <section className="card-surface mt-8 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-default bg-sky-50/50 px-4 py-4 sm:px-6 dark:bg-sky-950/20">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary">
            <Building2 className="h-5 w-5 text-sky-700 dark:text-sky-400" aria-hidden />
            Organization verification applications
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Review NGO and charity applications. Approving grants verified organizer status on the applicant profile.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={loading || refreshing}
          className="btn-secondary inline-flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
          Refresh
        </button>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-primary">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrgVerificationStatus | '')}
            className="rounded-lg border border-default px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-secondary">Loading applications…</p>
        ) : queue.length === 0 ? (
          <p className="text-sm text-secondary">No applications match this filter.</p>
        ) : (
          <ul className="space-y-4">
            {queue.map((item) => (
              <li key={item.id} className="rounded-xl border border-default p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-primary">{item.organization_name}</p>
                    <p className="text-xs text-muted capitalize">
                      {item.organization_type.replace(/_/g, ' ')} · {item.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <time className="text-xs text-muted" dateTime={item.created_at}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </time>
                </div>
                <p className="mt-3 text-sm text-secondary line-clamp-3">{item.mission}</p>
                <dl className="mt-3 grid gap-1 text-xs text-muted sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-secondary">Contact</dt>
                    <dd>
                      {item.contact_name} · {item.contact_email}
                    </dd>
                  </div>
                  {item.operating_area && (
                    <div>
                      <dt className="font-medium text-secondary">Area</dt>
                      <dd>{item.operating_area}</dd>
                    </div>
                  )}
                  {item.registration_reference && (
                    <div className="sm:col-span-2">
                      <dt className="font-medium text-secondary">Registration ref</dt>
                      <dd>{item.registration_reference}</dd>
                    </div>
                  )}
                </dl>
                <label className="mt-4 block text-sm">
                  <span className="font-medium text-secondary">Internal note (optional)</span>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-default px-3 py-2 text-sm"
                    rows={2}
                    value={notes[item.id] ?? ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  />
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(['approved', 'needs_changes', 'rejected', 'under_review'] as const).map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={updatingId === item.id}
                      onClick={() => void handleUpdate(item, action)}
                      className={
                        action === 'approved'
                          ? 'rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50'
                          : action === 'rejected'
                            ? 'rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300'
                            : 'rounded-lg border border-default px-3 py-1.5 text-xs font-semibold text-primary hover:bg-muted/50 disabled:opacity-50'
                      }
                    >
                      {action.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
