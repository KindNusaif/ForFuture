import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AsyncLoadHint from '../components/AsyncLoadHint'
import Toast from '../components/Toast'
import MyReportsSection from '../components/MyReportsSection'
import AppearanceSettings from '../components/appearance/AppearanceSettings'
import DeleteMovementDialog from '../components/profile/DeleteMovementDialog'
import MyMovementsSection from '../components/profile/MyMovementsSection'
import FollowedMovementsSection from '../components/profile/FollowedMovementsSection'
import ProfileDashboardHeader, {
  type BioSaveStatus,
} from '../components/profile/ProfileDashboardHeader'
import ProfileImpactSection, {
  type ProfileImpactStats,
} from '../components/profile/ProfileImpactSection'
import { ProfileHeaderSkeleton } from '../components/Skeleton'
import { MODERATION_FEATURE_BLURB } from '../lib/moderation'
import { useAuth } from '../hooks/useAuth'
import { useLoadingProgress } from '../hooks/useLoadingProgress'
import { updateProfileBio } from '../lib/auth'
import { deletePost, fetchPostsByUser, PROFILE_MOVEMENTS_PAGE_SIZE } from '../lib/posts'
import { getTotalPollVotesReceived } from '../lib/polls'
import { formatError } from '../lib/errors'
import { isRequestAborted } from '../lib/supabaseRequest'
import type { Post } from '../types'

function ProfileContent({ userId, email }: { userId: string; email?: string | null }) {
  const { t } = useTranslation()
  const { profile, refreshProfile } = useAuth()

  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [visibleCount, setVisibleCount] = useState(PROFILE_MOVEMENTS_PAGE_SIZE)
  const [movementsLoading, setMovementsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [movementsError, setMovementsError] = useState<string | null>(null)

  const posts = useMemo(() => allPosts.slice(0, visibleCount), [allPosts, visibleCount])
  const hasMore = visibleCount < allPosts.length

  const [bioOverride, setBioOverride] = useState<string | null>(null)
  const [bioSaveStatus, setBioSaveStatus] = useState<BioSaveStatus>('idle')
  const [bioError, setBioError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ variant: 'success' | 'error'; message: string } | null>(
    null,
  )

  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)
  const { showSlowHint, showRecovery } = useLoadingProgress(movementsLoading || refreshing)

  const bioDraft = bioOverride ?? profile?.bio ?? ''

  const impactStats = useMemo<ProfileImpactStats | null>(() => {
    if (movementsLoading) return null
    return {
      movementsPosted: allPosts.length,
      engagementsReceived: allPosts.reduce((sum, p) => sum + (p.support_count ?? 0), 0),
      pollsCreated: allPosts.filter((p) => p.movement_type === 'quick_youth_poll').length,
      pollVotesReceived: getTotalPollVotesReceived(allPosts),
      petitionsCreated: allPosts.filter((p) => p.movement_type === 'youth_petition').length,
    }
  }, [allPosts, movementsLoading])

  const reloadMovements = useCallback(async (isRefresh = false) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = ++requestIdRef.current

    if (isRefresh) setRefreshing(true)
    else setMovementsLoading(true)
    setMovementsError(null)

    try {
      const userPosts = await fetchPostsByUser(userId, controller.signal)
      if (requestId !== requestIdRef.current || controller.signal.aborted) return
      setAllPosts(userPosts)
      setVisibleCount(PROFILE_MOVEMENTS_PAGE_SIZE)
    } catch (err) {
      if (requestId !== requestIdRef.current || isRequestAborted(err)) return
      setMovementsError(formatError(err))
    } finally {
      if (requestId === requestIdRef.current) {
        setMovementsLoading(false)
        setRefreshing(false)
      }
    }
  }, [userId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reloadMovements(false)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [reloadMovements])

  async function saveBio() {
    if (bioSaveStatus === 'saving') return
    setBioSaveStatus('saving')
    setBioError(null)
    try {
      await updateProfileBio(userId, bioDraft)
      setBioOverride(null)
      await refreshProfile()
      setBioSaveStatus('saved')
      window.setTimeout(() => setBioSaveStatus('idle'), 2500)
    } catch (err) {
      setBioError(formatError(err))
      setBioSaveStatus('error')
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      await deletePost(deleteTarget.id, userId)
      setAllPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
      setToast({ variant: 'success', message: t('profile.deleteSuccess') })
    } catch {
      setToast({ variant: 'error', message: t('profile.deleteFailed') })
    } finally {
      setDeleting(false)
    }
  }

  function handleLoadMore() {
    setVisibleCount((n) => Math.min(n + PROFILE_MOVEMENTS_PAGE_SIZE, allPosts.length))
  }

  if (!profile) {
    return <ProfileHeaderSkeleton />
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-600">
          {t('profile.title')}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void reloadMovements(true)}
            disabled={movementsLoading || refreshing}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-default bg-surface px-3 py-2 text-sm font-medium text-secondary transition hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
            {t('profile.refresh')}
          </button>
          <Link to="/create" className="btn-primary min-h-10! py-2!">
            <Plus className="h-4 w-4" aria-hidden />
            {t('profile.createMovement')}
          </Link>
        </div>
      </div>

      {toast && (
        <div className="mb-4">
          <Toast
            variant={toast.variant}
            message={toast.message}
            onDismiss={() => setToast(null)}
          />
        </div>
      )}

      <ProfileDashboardHeader
        profile={profile}
        email={email}
        bioDraft={bioDraft}
        onBioChange={setBioOverride}
        onSaveBio={saveBio}
        bioSaveStatus={bioSaveStatus}
        bioError={bioError}
      />

      <ProfileImpactSection stats={impactStats} loading={movementsLoading} />

      <AsyncLoadHint
        className="mt-4"
        showSlowHint={movementsLoading && showSlowHint && !movementsError}
        showRecovery={movementsLoading && showRecovery && !movementsError}
        error={movementsError}
        onRetry={() => void reloadMovements(true)}
        slowMessage={t('loading.movements')}
      />

      <MyMovementsSection
        posts={posts}
        totalCount={allPosts.length}
        loading={movementsLoading}
        loadingMore={false}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onDelete={setDeleteTarget}
      />

      <FollowedMovementsSection userId={userId} />

      <AppearanceSettings />

      <details className="mt-10 rounded-xl border border-default bg-muted/50 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-primary">
          Safe Reporting &amp; Fair Moderation
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-secondary">{MODERATION_FEATURE_BLURB}</p>
      </details>

      <MyReportsSection userId={userId} />

      <DeleteMovementDialog
        open={deleteTarget !== null}
        postTitle={deleteTarget?.title ?? ''}
        deleting={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null)
        }}
      />
    </>
  )
}

export default function Profile() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <section className="mx-auto min-w-0 max-w-4xl px-4 py-8 sm:px-6">
        <ProfileHeaderSkeleton />
      </section>
    )
  }

  if (!user) return null

  return (
    <section className="mx-auto min-w-0 max-w-4xl px-4 py-8 sm:px-6">
      <ProfileContent key={user.id} userId={user.id} email={user.email} />
    </section>
  )
}
