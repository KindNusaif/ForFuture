import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDataSync } from '../../hooks/useDataSync'
import { useRouteFocusRefetch } from '../../hooks/useRouteFocusRefetch'
import { useVisibilityRefetch } from '../../hooks/useVisibilityRefetch'
import { fetchFollowedMovementIds } from '../../lib/movementFollows'
import { fetchPostById, fetchPostsPage } from '../../lib/posts'
import { upsertById } from '../../lib/listUtils'
import { formatError } from '../../lib/errors'
import type { Post } from '../../types'

interface FollowedMovementsSectionProps {
  userId: string
}

export default function FollowedMovementsSection({ userId }: FollowedMovementsSectionProps) {
  const { t } = useTranslation()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const postsRef = useRef(posts)

  useEffect(() => {
    postsRef.current = posts
  }, [posts])

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true)
    setError(null)
    try {
      const ids = await fetchFollowedMovementIds(userId)
      if (ids.length === 0) {
        setPosts([])
        return
      }
      const slice = ids.slice(0, 6)
      const { posts: loaded } = await fetchPostsPage({
        viewerUserId: userId,
        movementIds: slice,
        limit: 6,
      })
      setPosts(loaded)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  useDataSync((event) => {
    if (event.type === 'follows:invalidate') {
      void load({ silent: postsRef.current.length > 0 })
      return
    }
    if (event.type === 'post:created') {
      void load({ silent: postsRef.current.length > 0 })
      return
    }
    if (event.type === 'post:deleted') {
      setPosts((prev) => prev.filter((p) => p.id !== event.postId))
      return
    }
    if (event.type === 'post:updated') {
      const inList = postsRef.current.some((p) => p.id === event.postId)
      if (!inList) return
      void (async () => {
        try {
          const updated = await fetchPostById(event.postId, userId)
          if (updated) {
            setPosts((prev) => upsertById(prev, updated))
          }
        } catch {
          /* keep preview row */
        }
      })()
    }
  })

  const silentReload = useCallback(() => {
    void load({ silent: postsRef.current.length > 0 })
  }, [load])

  useVisibilityRefetch(silentReload, { enabled: !loading })
  useRouteFocusRefetch(silentReload, { pathPrefixes: ['/profile'], enabled: !loading })

  return (
    <section className="card-surface mt-8 p-5 sm:p-6" aria-labelledby="followed-movements-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="followed-movements-heading" className="text-lg font-bold text-primary">
            {t('follow.profileSectionTitle')}
          </h2>
          <p className="mt-1 text-sm text-secondary">{t('follow.profileSectionSubtitle')}</p>
        </div>
        <Link to="/feed?tab=following" className="btn-secondary text-sm">
          {t('follow.viewFollowingFeed')}
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-accent-600" aria-hidden />
        </div>
      ) : error ? (
        <p className="form-error mt-4">{error}</p>
      ) : posts.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-default px-4 py-6 text-center">
          <p className="text-sm font-medium text-primary">
            {t('guidance.empty.followingTitle', {
              defaultValue: "You're not following any movements yet",
            })}
          </p>
          <p className="mt-2 text-sm text-secondary">
            {t('guidance.empty.followingDescription', {
              defaultValue:
                'Follow movements to receive updates and track the causes you care about.',
            })}
          </p>
          <Link to="/discover" className="btn-primary mt-4 inline-flex text-sm">
            {t('guidance.empty.followingCta', { defaultValue: 'Explore Movements' })}
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                to={`/feed/${post.id}`}
                className="flex items-center gap-3 rounded-xl border border-default px-3 py-2.5 transition hover:border-accent-300/50 hover:bg-muted"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-700 dark:bg-accent-950/50 dark:text-accent-300">
                  <BellRing className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-primary">{post.title}</span>
                  <span className="block text-xs text-muted">{post.category}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
