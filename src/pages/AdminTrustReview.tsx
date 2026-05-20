import { useCallback, useEffect, useState } from 'react'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { Link } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, RefreshCw, ShieldCheck } from 'lucide-react'
import AsyncLoadHint from '../components/AsyncLoadHint'
import { PostCardSkeleton } from '../components/Skeleton'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { withAutoRetry } from '../lib/supabaseRequest'
import { formatError } from '../lib/errors'
import {
  inferReviewedCampaignTypeFromMovement,
  type CampaignReviewStatus,
  type OrganizerVerificationType,
  type ReviewedCampaignType,
} from '../lib/trust'
import {
  CAMPAIGN_REVIEW_STATUS_OPTIONS,
  fetchCampaignReviewQueue,
  ORGANIZER_VERIFICATION_OPTIONS,
  REVIEWED_CAMPAIGN_TYPE_OPTIONS,
  searchProfilesForTrust,
  updateCampaignReview,
  updateOrganizerVerification,
  type CampaignReviewQueueItem,
  type TrustProfileSearchResult,
} from '../lib/trustAdmin'
import type { MovementType } from '../types'
import AdminOrgVerificationQueue from '../components/admin/AdminOrgVerificationQueue'

const MOVEMENT_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All movement types' },
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'volunteer_drive', label: 'Volunteer Drive' },
  { value: 'peaceful_civic_action', label: 'Peaceful Civic Action' },
  { value: 'youth_petition', label: 'Youth Petition' },
  { value: 'idea_for_change', label: 'Idea for Change' },
  { value: 'raise_voice', label: 'Raise Your Voice' },
]

function movementTypeLabel(type: string) {
  return MOVEMENT_FILTER_OPTIONS.find((o) => o.value === type)?.label ?? type
}

export default function AdminTrustReview() {
  const [profileQuery, setProfileQuery] = useState('')
  const [profileResults, setProfileResults] = useState<TrustProfileSearchResult[]>([])
  const [selectedProfile, setSelectedProfile] = useState<TrustProfileSearchResult | null>(null)
  const [organizerType, setOrganizerType] = useState<OrganizerVerificationType>('organization')

  const [queueStatus, setQueueStatus] = useState<CampaignReviewStatus | ''>('')
  const [queueMovement, setQueueMovement] = useState('')
  const [queue, setQueue] = useState<CampaignReviewQueueItem[]>([])
  const [queueLoading, setQueueLoading] = useState(true)
  const [queueRefreshing, setQueueRefreshing] = useState(false)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [reviewTypes, setReviewTypes] = useState<Record<string, ReviewedCampaignType>>({})
  const [updatingPostId, setUpdatingPostId] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [runProfileSearch, profileLoading] = useAsyncAction(
    useCallback(async () => {
      const results = await searchProfilesForTrust(profileQuery)
      setProfileResults(results)
      if (results.length === 1) {
        setSelectedProfile(results[0])
        if (results[0].organizer_verification_type) {
          setOrganizerType(results[0].organizer_verification_type)
        }
      }
    }, [profileQuery]),
  )

  const [runOrganizerUpdate, profileSaving] = useAsyncAction(
    useCallback(
      async (isVerified: boolean) => {
        if (!selectedProfile) return
        await updateOrganizerVerification(
          selectedProfile.id,
          isVerified,
          isVerified ? organizerType : null,
        )
        const results = await searchProfilesForTrust(selectedProfile.id)
        const updated = results.find((p) => p.id === selectedProfile.id) ?? null
        setSelectedProfile(updated)
        setProfileResults(results.length ? results : profileResults)
      },
      [selectedProfile, organizerType, profileResults],
    ),
  )

  const { showSlowHint, showRecovery } = useLoadingProgress(
    profileLoading || queueLoading || queueRefreshing,
  )

  const loadQueue = useCallback(async (isRefresh = false) => {
    if (isRefresh) setQueueRefreshing(true)
    else setQueueLoading(true)
    setError(null)
    try {
      const items = await withAutoRetry(() =>
        fetchCampaignReviewQueue(
          queueStatus || null,
          (queueMovement || null) as MovementType | null,
        ),
      )
      setQueue(items)
      setReviewTypes((prev) => {
        const next = { ...prev }
        for (const item of items) {
          if (!next[item.post_id]) {
            next[item.post_id] =
              item.reviewed_campaign_type ??
              inferReviewedCampaignTypeFromMovement(item.movement_type as MovementType) ??
              'general_campaign'
          }
        }
        return next
      })
    } catch (err) {
      setError(formatError(err))
    } finally {
      setQueueLoading(false)
      setQueueRefreshing(false)
    }
  }, [queueStatus, queueMovement])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQueue()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadQueue])

  function handleProfileSearch(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    void runProfileSearch().catch((err) => setError(formatError(err)))
  }

  function handleOrganizerUpdate(isVerified: boolean) {
    if (!selectedProfile) return
    setError(null)
    void runOrganizerUpdate(isVerified).catch((err) => setError(formatError(err)))
  }

  async function handleCampaignReview(
    item: CampaignReviewQueueItem,
    status: CampaignReviewStatus,
  ) {
    setUpdatingPostId(item.post_id)
    setError(null)
    try {
      const reviewedType =
        status === 'reviewed'
          ? reviewTypes[item.post_id] ??
            inferReviewedCampaignTypeFromMovement(item.movement_type as MovementType) ??
            'general_campaign'
          : null
      await updateCampaignReview(
        item.post_id,
        status,
        reviewedType,
        reviewNotes[item.post_id],
      )
      await loadQueue(true)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setUpdatingPostId(null)
    }
  }

  return (
    <section className="mx-auto min-w-0 max-w-5xl px-4 py-8 sm:px-6">
      <Link to="/feed" className="btn-ghost mb-6 min-h-10! px-0!">
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Link>

      <header className="card-surface overflow-hidden border border-emerald-200/60 bg-linear-to-br from-emerald-950 via-slate-900 to-slate-900 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-200">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Internal trust management only
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Trust &amp; Verification Review
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              Verify organizers separately from campaign review. A verified organizer does not
              automatically make every campaign trusted.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadQueue(true)}
            disabled={queueLoading || queueRefreshing}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/20 bg-surface/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-surface/15 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${queueRefreshing ? 'animate-spin' : ''}`} />
            Refresh queue
          </button>
        </div>
      </header>

      <AsyncLoadHint
        className="mt-4"
        showSlowHint={(profileLoading || queueLoading) && showSlowHint && !error}
        showRecovery={(profileLoading || queueLoading) && showRecovery && !error}
        error={error}
        onRetry={() => void loadQueue(true)}
        slowMessage="Loading trust review tools…"
      />

      <AdminOrgVerificationQueue />

      <section className="card-surface mt-8 overflow-hidden">
        <div className="border-b border-default bg-emerald-50/50 px-4 py-4 sm:px-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary">
            <BadgeCheck className="h-5 w-5 text-emerald-700" aria-hidden />
            Manual organizer verification
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Search by display name, Youth Voice ID, or profile UUID.
          </p>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <form onSubmit={(e) => void handleProfileSearch(e)} className="flex flex-wrap gap-2">
            <input
              type="search"
              value={profileQuery}
              onChange={(e) => setProfileQuery(e.target.value)}
              placeholder="Search profiles…"
              className="min-w-[200px] flex-1 rounded-xl border border-default px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={profileLoading}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {profileLoading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {profileResults.length > 0 && (
            <ul className="space-y-2">
              {profileResults.map((profile) => (
                <li key={profile.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProfile(profile)
                      if (profile.organizer_verification_type) {
                        setOrganizerType(profile.organizer_verification_type)
                      }
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                      selectedProfile?.id === profile.id
                        ? 'border-emerald-300 bg-emerald-50/80'
                        : 'border-default hover:border-emerald-200'
                    }`}
                  >
                    <span className="font-semibold text-primary">{profile.display_name}</span>
                    <span className="ml-2 font-mono text-xs text-muted">
                      {profile.youth_voice_id ?? profile.id.slice(0, 8)}
                    </span>
                    {profile.is_verified_organizer && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                        Verified
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedProfile && (
            <div className="rounded-xl border border-default bg-muted/50 p-4">
              <p className="text-sm font-semibold text-primary">{selectedProfile.display_name}</p>
              <p className="mt-1 font-mono text-xs text-muted">{selectedProfile.id}</p>
              <label className="mt-4 block">
                <span className="text-xs font-bold uppercase tracking-wide text-muted">
                  Verification type
                </span>
                <select
                  value={organizerType}
                  onChange={(e) =>
                    setOrganizerType(e.target.value as OrganizerVerificationType)
                  }
                  className="mt-1 w-full rounded-xl border border-default px-3 py-2 text-sm"
                >
                  {ORGANIZER_VERIFICATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={profileSaving}
                  onClick={() => void handleOrganizerUpdate(true)}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {profileSaving ? 'Saving…' : 'Mark verified'}
                </button>
                <button
                  type="button"
                  disabled={profileSaving || !selectedProfile.is_verified_organizer}
                  onClick={() => void handleOrganizerUpdate(false)}
                  className="rounded-lg border border-default bg-surface px-3 py-2 text-xs font-semibold text-secondary hover:bg-muted disabled:opacity-50"
                >
                  Remove verification
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Review status
            </span>
            <select
              value={queueStatus}
              onChange={(e) => setQueueStatus(e.target.value as CampaignReviewStatus | '')}
              className="mt-1 block rounded-xl border border-default px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {CAMPAIGN_REVIEW_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Movement type
            </span>
            <select
              value={queueMovement}
              onChange={(e) => setQueueMovement(e.target.value)}
              className="mt-1 block rounded-xl border border-default px-3 py-2 text-sm"
            >
              {MOVEMENT_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {queueLoading ? (
          <ul className="space-y-4" aria-busy="true">
            {[1, 2].map((i) => (
              <li key={i}>
                <PostCardSkeleton />
              </li>
            ))}
          </ul>
        ) : queue.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <p className="text-lg font-bold text-primary">No campaigns match this filter</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {queue.map((item) => (
              <li key={item.post_id} className="card-surface overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 border-b border-default bg-muted/80 px-4 py-3 sm:px-5">
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-900">
                    {item.review_status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-medium text-muted">
                    {movementTypeLabel(item.movement_type)}
                  </span>
                  <time className="ml-auto text-xs text-muted">
                    {item.reviewed_at
                      ? `Reviewed ${new Date(item.reviewed_at).toLocaleString()}`
                      : 'Not reviewed yet'}
                  </time>
                </div>

                <div className="space-y-4 p-4 sm:p-5">
                  <div>
                    <p className="text-base font-bold text-primary">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      Public:{' '}
                      {item.posting_identity === 'youth_voice'
                        ? `Youth Voice ${item.youth_voice_id ?? 'ID'}`
                        : item.author_name ?? 'Profile'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-xs text-amber-950/90">
                    <p className="font-bold uppercase tracking-wide text-amber-900">
                      Internal owner (never shown on Youth Voice posts)
                    </p>
                    <p className="mt-1">
                      {item.owner_display_name ?? '—'} · {item.owner_youth_voice_id ?? item.owner_user_id ?? '—'}
                      {item.owner_is_verified_organizer && ' · Verified organizer'}
                    </p>
                  </div>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">
                      Reviewed campaign type (when marking reviewed)
                    </span>
                    <select
                      value={reviewTypes[item.post_id] ?? 'general_campaign'}
                      onChange={(e) =>
                        setReviewTypes((prev) => ({
                          ...prev,
                          [item.post_id]: e.target.value as ReviewedCampaignType,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-default px-3 py-2 text-sm"
                    >
                      {REVIEWED_CAMPAIGN_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">
                      Internal review note
                    </span>
                    <textarea
                      value={reviewNotes[item.post_id] ?? item.review_note ?? ''}
                      onChange={(e) =>
                        setReviewNotes((prev) => ({
                          ...prev,
                          [item.post_id]: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Optional — not shown publicly"
                      className="wrap-user-text mt-1.5 w-full rounded-xl border border-default px-3 py-2 text-sm"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {CAMPAIGN_REVIEW_STATUS_OPTIONS.filter((a) => a.value !== 'unreviewed').map(
                      (action) => (
                        <button
                          key={action.value}
                          type="button"
                          disabled={
                            updatingPostId === item.post_id ||
                            item.review_status === action.value
                          }
                          onClick={() => void handleCampaignReview(item, action.value)}
                          className="rounded-lg border border-default bg-surface px-3 py-2 text-xs font-semibold text-secondary transition hover:border-sky-300 hover:bg-sky-50 disabled:opacity-50"
                        >
                          {updatingPostId === item.post_id ? 'Updating…' : action.label}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      disabled={updatingPostId === item.post_id || item.review_status === 'unreviewed'}
                      onClick={() => void handleCampaignReview(item, 'unreviewed')}
                      className="rounded-lg border border-default bg-surface px-3 py-2 text-xs font-semibold text-muted hover:bg-muted disabled:opacity-50"
                    >
                      Reset to unreviewed
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
