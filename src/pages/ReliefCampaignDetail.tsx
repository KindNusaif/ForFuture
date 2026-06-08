import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import MovementDetailView from '../components/movement/MovementDetailView'
import ReliefCampaignTrustPanel from '../components/relief/ReliefCampaignTrustPanel'
import ReliefUpdatesTimeline from '../components/relief/ReliefUpdatesTimeline'
import { useAuth } from '../hooks/useAuth'
import { useDataSync } from '../hooks/useDataSync'
import { useRouteFocusRefetch } from '../hooks/useRouteFocusRefetch'
import { useVisibilityRefetch } from '../hooks/useVisibilityRefetch'
import { fetchPostById } from '../lib/posts'
import { fetchReliefCampaignUpdates } from '../lib/reliefUpdates'
import { isReliefPost, getReliefDisplaySubtype } from '../lib/reliefHub'
import { campaignSupportActions } from '../lib/reliefCampaignPublic'
import ShareButton from '../components/share/ShareButton'
import type { Post } from '../types'

interface ReliefCampaignDetailProps {
  mode?: 'guest' | 'member'
}

export default function ReliefCampaignDetail({ mode = 'member' }: ReliefCampaignDetailProps) {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isGuest = mode === 'guest'
  const backTo = isGuest ? '/explore/relief' : '/relief'
  const detailBase = isGuest ? '/explore/relief' : '/relief'

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updates, setUpdates] = useState<Awaited<ReturnType<typeof fetchReliefCampaignUpdates>>>([])

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!id) return
    if (!options?.silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const row = await fetchPostById(id, user?.id)
      if (!row || !isReliefPost(row)) {
        setError(t('reliefHub.campaignNotFound'))
        setPost(null)
        return
      }
      setPost(row)
      const timeline = await fetchReliefCampaignUpdates(id).catch(() => [])
      setUpdates(timeline)
    } catch {
      if (!options?.silent) setError(t('reliefHub.loadError'))
    } finally {
      if (!options?.silent) setLoading(false)
    }
  }, [id, user?.id, t])

  useEffect(() => {
    void load()
  }, [load])

  const silentReload = useCallback(() => {
    void load({ silent: true })
  }, [load])

  useDataSync((event) => {
    if (!id) return
    if (event.type === 'post:updated' && event.postId === id) {
      silentReload()
      return
    }
    if (event.type === 'post:deleted' && event.postId === id) {
      setPost(null)
      setError(t('reliefHub.campaignNotFound'))
    }
  })

  useVisibilityRefetch(silentReload, { enabled: Boolean(id) && !loading })
  useRouteFocusRefetch(silentReload, {
    pathPrefixes: ['/relief', '/explore/relief'],
    enabled: Boolean(id) && !loading,
  })

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" aria-hidden />
      </div>
    )
  }

  if (error || !post) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-secondary">{error ?? t('reliefHub.campaignNotFound')}</p>
        <Link to={backTo} className="btn-primary mt-6 inline-flex">
          {t('reliefHub.backToRelief')}
        </Link>
      </section>
    )
  }

  const actions = campaignSupportActions(post)
  const subtype = getReliefDisplaySubtype(post)
  const externalUrl = post.external_donation_url?.trim()

  return (
    <div className="mx-auto min-w-0 max-w-5xl px-4 py-6 sm:px-6">
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('reliefHub.backToRelief')}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_minmax(0,18rem)]">
        <div className="min-w-0 space-y-8">
          <MovementDetailView
            post={post}
            guestMode={isGuest}
            detailPath={`${detailBase}/${post.id}`}
            relatedDetailBase={detailBase}
            currentUserId={user?.id}
            onPostDeleted={() => navigate(backTo)}
          />

          <section className="card-surface p-6">
            <h2 className="text-lg font-bold text-primary">{t('reliefHub.updatesTitle')}</h2>
            <div className="mt-4">
              <ReliefUpdatesTimeline updates={updates} />
            </div>
          </section>

          {post.publication_status === 'completed' && post.impact_report && (
            <section className="card-surface p-6">
              <h2 className="text-lg font-bold text-primary">{t('reliefHub.impactReportTitle')}</h2>
              <p className="mt-3 text-sm leading-relaxed text-secondary">
                {(post.impact_report as { summary?: string }).summary ??
                  t('reliefHub.impactReportPlaceholder')}
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card-surface space-y-3 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{t('reliefHub.supportActions')}</h2>
            {actions.donate && (
              externalUrl ? (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex w-full items-center justify-center gap-2"
                >
                  {t('reliefHub.donateExternal')}
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              ) : (
                <p className="text-sm text-secondary">{t('relief.fundraisingDisclaimer')}</p>
              )
            )}
            {actions.supplies && (
              <p className="text-sm text-secondary">{t('reliefHub.suppliesHint')}</p>
            )}
            <ShareButton post={post} variant="secondary" className="w-full" showLabel />
          </div>
          <ReliefCampaignTrustPanel />
          {subtype === 'fundraising' && post.review_status !== 'reviewed' && (
            <p className="text-xs text-muted">{t('relief.fundraisingDisclaimer')}</p>
          )}
        </aside>
      </div>
    </div>
  )
}
