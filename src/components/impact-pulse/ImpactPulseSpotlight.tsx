import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ImpactPulseSpotlight as SpotlightData } from '../../lib/impactPulse'
import { formatImpactCountFull } from '../../lib/impactPulse'
import { buildMovementConfig } from '../../lib/movements'
import CampaignReviewBadge from '../CampaignReviewBadge'
import SectionShell from './SectionShell'
import { Skeleton } from '../Skeleton'

interface Props {
  spotlight: SpotlightData | null
  detailBase: string
  loading?: boolean
  unavailable?: boolean
}

export default function ImpactPulseSpotlight({
  spotlight,
  detailBase,
  loading,
  unavailable,
}: Props) {
  const { t } = useTranslation()

  if (unavailable && !loading) {
    return (
      <SectionShell id="spotlight" title={t('impactPulse.spotlight.title')}>
        <p className="card-surface border-dashed px-6 py-10 text-center text-sm text-secondary">
          {t('impactPulse.metricsUnavailable')}
        </p>
      </SectionShell>
    )
  }

  return (
    <SectionShell
      id="spotlight"
      title={t('impactPulse.spotlight.title')}
      subtitle={t('impactPulse.spotlight.subtitle')}
    >
      {!loading && !spotlight ? (
        <div className="card-surface border-dashed px-6 py-14 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-accent-500" aria-hidden />
          <p className="mt-4 text-sm leading-relaxed text-secondary">{t('impactPulse.spotlight.empty')}</p>
        </div>
      ) : (
        <article className="relative overflow-hidden rounded-3xl border border-accent-200/80 bg-linear-to-br from-accent-600 via-brand-700 to-slate-900 p-6 text-white shadow-xl sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-surface/10 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-brand-400/20 blur-2xl" />

          {loading ? (
            <div className="relative space-y-3">
              <Skeleton className="h-4 w-32 rounded-lg bg-surface/20" />
              <Skeleton className="h-8 w-4/5 rounded-lg bg-surface/20" />
              <Skeleton className="h-4 w-48 rounded-lg bg-surface/20" />
            </div>
          ) : spotlight ? (
            <div className="relative min-w-0">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent-100">
                <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                {t('impactPulse.spotlight.eyebrow')}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-surface/15 px-3 py-1 text-xs font-semibold">
                  {buildMovementConfig(spotlight.movement_type, t).shortLabel}
                </span>
                <span className="rounded-full bg-surface/10 px-3 py-1 text-xs font-semibold">
                  {t(`categories.${spotlight.category}`, { defaultValue: spotlight.category })}
                </span>
                {spotlight.review_status === 'reviewed' && (
                  <CampaignReviewBadge
                    movementType={spotlight.movement_type}
                    reviewedCampaignType={spotlight.reviewed_campaign_type}
                    size="sm"
                  />
                )}
              </div>
              <h3 className="mt-4 text-2xl font-extrabold tracking-tight wrap-anywhere break-words sm:text-3xl">
                {spotlight.title}
              </h3>
              <p className="mt-2 text-sm text-white/80">{spotlight.public_author_name}</p>
              <p className="mt-1 text-sm font-semibold text-accent-100">
                {t('impactPulse.spotlight.engagement', {
                  count: formatImpactCountFull(spotlight.engagement_count),
                })}
              </p>
              <Link
                to={`${detailBase}/${spotlight.id}`}
                className="btn-spotlight mt-6"
              >
                {t('impactPulse.spotlight.cta')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : null}
        </article>
      )}
    </SectionShell>
  )
}
