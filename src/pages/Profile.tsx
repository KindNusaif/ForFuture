import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, FileText, Heart, Mic, Plus, RefreshCw, User } from 'lucide-react'
import { getTotalPollVotesReceived } from '../lib/polls'
import VerifiedOrganizationBadge from '../components/VerifiedOrganizationBadge'
import EmptyState from '../components/EmptyState'
import PostCard from '../components/PostCard'
import StatCard from '../components/StatCard'
import { PostCardSkeleton, ProfileHeaderSkeleton } from '../components/Skeleton'
import Toast from '../components/Toast'
import MyReportsSection from '../components/MyReportsSection'
import { MODERATION_FEATURE_BLURB } from '../lib/moderation'
import { useAuth } from '../hooks/useAuth'
import { updateProfileBio } from '../lib/auth'
import { fetchPostsByUser } from '../lib/posts'
import { formatError } from '../lib/errors'
import type { Post } from '../types'

function ProfileContent({ userId, email }: { userId: string; email?: string | null }) {
  const { profile, refreshProfile } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bioOverride, setBioOverride] = useState<string | null>(null)
  const [savingBio, setSavingBio] = useState(false)

  const totalSupport = useMemo(
    () => posts.reduce((sum, p) => sum + (p.support_count ?? 0), 0),
    [posts],
  )

  const totalPollVotes = useMemo(() => getTotalPollVotesReceived(posts), [posts])

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return null
    return new Date(profile.created_at).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    })
  }, [profile])

  const reload = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    setError(null)
    try {
      const userPosts = await fetchPostsByUser(userId)
      setPosts(userPosts)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false

    fetchPostsByUser(userId)
      .then((userPosts) => {
        if (!cancelled) setPosts(userPosts)
      })
      .catch((err) => {
        if (!cancelled) setError(formatError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const bioDraft = bioOverride ?? profile?.bio ?? ''

  async function saveBio() {
    setSavingBio(true)
    setError(null)
    try {
      await updateProfileBio(userId, bioDraft)
      setBioOverride(null)
      await refreshProfile()
    } catch (err) {
      setError(formatError(err))
    } finally {
      setSavingBio(false)
    }
  }

  const displayName = profile?.display_name ?? 'Your profile'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-sm font-semibold uppercase tracking-wide text-accent-600">
          My Profile
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void reload(true)}
            disabled={loading || refreshing}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/create"
            className="btn-primary !min-h-[40px] !py-2"
          >
            <Plus className="h-4 w-4" />
            Create a Youth Movement
          </Link>
        </div>
      </div>

      {loading ? (
        <ProfileHeaderSkeleton />
      ) : (
        <header className="card-surface overflow-hidden bg-linear-to-br from-accent-50/50 via-white to-brand-50/30">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-accent-600 to-brand-600 text-xl font-bold text-white shadow-lg shadow-accent-600/25">
                {initials || <User className="h-8 w-8" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-bold text-slate-900">{displayName}</h2>
                  {profile?.is_verified_organization && (
                    <VerifiedOrganizationBadge
                      verificationType={profile.organization_verification_type}
                      size="md"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-600">{email}</p>
                <div className="mt-4">
                  <label htmlFor="bio" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bioDraft}
                    onChange={(e) => setBioOverride(e.target.value)}
                    rows={3}
                    maxLength={280}
                    placeholder="Tell the community what you care about…"
                    className="wrap-user-text mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => void saveBio()}
                    disabled={savingBio}
                    className="mt-2 text-sm font-semibold text-brand-700 hover:text-brand-800 disabled:opacity-50"
                  >
                    {savingBio ? 'Saving…' : 'Save bio'}
                  </button>
                </div>
                {memberSince && (
                  <p className="mt-1 text-xs text-slate-500">Member since {memberSince}</p>
                )}
                {profile?.youth_voice_id && (
                  <div className="mt-4 rounded-xl border border-accent-200 bg-white/90 px-4 py-4 shadow-sm">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent-700">
                      <Mic className="h-3.5 w-3.5" aria-hidden />
                      Youth Voice ID
                    </p>
                    <p className="wrap-user-text mt-1 font-mono text-lg font-bold tracking-wide text-accent-900">
                      {profile.youth_voice_id}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      Your Youth Voice ID lets you speak publicly without showing your real profile
                      identity.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
              <StatCard label="Movements posted" value={posts.length} icon={FileText} />
              <StatCard label="Engagements received" value={totalSupport} icon={Heart} accent />
              <StatCard
                label="Polls created"
                value={posts.filter((p) => p.movement_type === 'quick_youth_poll').length}
                icon={BarChart3}
              />
              <StatCard label="Poll votes received" value={totalPollVotes} icon={BarChart3} />
            </dl>
          </div>
        </header>
      )}

      {error && (
        <div className="mt-4">
          <Toast variant="error" message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <details className="mt-8 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">
          Safe Reporting &amp; Fair Moderation
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{MODERATION_FEATURE_BLURB}</p>
      </details>

      <MyReportsSection userId={userId} />

      <div className="mb-4 mt-10 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">My Movements</h3>
        {!loading && posts.length > 0 && (
          <span className="text-sm text-slate-500">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </span>
        )}
      </div>

      {loading ? (
        <ul className="space-y-4">
          {[1, 2].map((i) => (
            <li key={i}>
              <PostCardSkeleton />
            </li>
          ))}
        </ul>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No initiatives yet"
          description="Share your first idea with the community. It only takes a minute."
        />
      ) : (
        <ul className="min-w-0 space-y-4">
          {posts.map((post) => (
            <li key={post.id} className="min-w-0">
              <PostCard
                post={post}
                detailPath={`/feed/${post.id}`}
                showSupport={false}
                showIdentityBadge
              />
            </li>
          ))}
        </ul>
      )}

      {!loading && posts.length === 0 && (
        <div className="mt-6 text-center">
          <Link
            to="/create"
            className="btn-primary"
          >
            <Plus className="h-5 w-5" />
            Create your first initiative
          </Link>
        </div>
      )}
    </>
  )
}

export default function Profile() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <section className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:px-6">
      <ProfileContent key={user.id} userId={user.id} email={user.email} />
    </section>
  )
}
