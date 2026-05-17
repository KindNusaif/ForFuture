import type { ReactNode } from 'react'
import { Flame, Layers, Tag, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ImpactPulseDashboard } from '../../lib/impactPulse'
import { formatImpactCountFull } from '../../lib/impactPulse'
import { buildMovementConfig } from '../../lib/movements'
import SectionShell from './SectionShell'
import { Skeleton } from '../Skeleton'

interface Props {
  weekly: ImpactPulseDashboard['weekly']
  loading?: boolean
  unavailable?: boolean
}

export default function ImpactPulseWeekly({ weekly, loading, unavailable }: Props) {
  const { t } = useTranslation()

  const hasWeekly =
    !unavailable &&
    (weekly.most_supported ||
      weekly.fastest_petition ||
      weekly.top_movement_type ||
      weekly.top_category)

  if (unavailable && !loading) {
    return (
      <SectionShell
        id="weekly-momentum"
        title={t('impactPulse.weekly.title')}
        subtitle={t('impactPulse.weekly.subtitle')}
      >
        <p className="card-surface border-dashed px-6 py-10 text-center text-sm text-secondary">
          {t('impactPulse.metricsUnavailable')}
        </p>
      </SectionShell>
    )
  }

  return (
    <SectionShell
      id="weekly-momentum"
      title={t('impactPulse.weekly.title')}
      subtitle={t('impactPulse.weekly.subtitle')}
    >
      {!loading && !hasWeekly ? (
        <div className="card-surface border-dashed px-6 py-12 text-center">
          <Flame className="mx-auto h-10 w-10 text-accent-500" aria-hidden />
          <p className="mt-4 text-sm leading-relaxed text-secondary">{t('impactPulse.weekly.empty')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <WeeklyCard
            icon={TrendingUp}
            label={t('impactPulse.weekly.mostSupported')}
            loading={loading}
            featured={Boolean(weekly.most_supported)}
          >
            {weekly.most_supported ? (
              <>
                <p className="text-lg font-bold text-primary wrap-anywhere break-words">
                  {weekly.most_supported.title}
                </p>
                <p className="mt-2 text-sm text-secondary">
                  {t('impactPulse.weekly.supportCount', {
                    count: formatImpactCountFull(weekly.most_supported.engagement_count),
                  })}
                </p>
                <span className="mt-3 inline-flex rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-800 ring-1 ring-accent-200/80">
                  {buildMovementConfig(weekly.most_supported.movement_type, t).shortLabel}
                </span>
              </>
            ) : (
              <p className="text-sm text-muted">{t('impactPulse.weekly.noPickYet')}</p>
            )}
          </WeeklyCard>

          <WeeklyCard
            icon={Flame}
            label={t('impactPulse.weekly.fastestPetition')}
            loading={loading}
            featured={Boolean(weekly.fastest_petition)}
          >
            {weekly.fastest_petition ? (
              <>
                <p className="text-lg font-bold text-primary wrap-anywhere break-words">
                  {weekly.fastest_petition.title}
                </p>
                <p className="mt-2 text-sm text-secondary">
                  {t('impactPulse.weekly.weekSignatures', {
                    count: formatImpactCountFull(weekly.fastest_petition.week_signatures),
                  })}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">{t('impactPulse.weekly.noPickYet')}</p>
            )}
          </WeeklyCard>

          <WeeklyCard
            icon={Layers}
            label={t('impactPulse.weekly.topType')}
            loading={loading}
            featured={Boolean(weekly.top_movement_type)}
          >
            {weekly.top_movement_type ? (
              <p className="text-lg font-bold text-primary">
                {buildMovementConfig(weekly.top_movement_type, t).label}
              </p>
            ) : (
              <p className="text-sm text-muted">{t('impactPulse.weekly.noPickYet')}</p>
            )}
          </WeeklyCard>

          <WeeklyCard
            icon={Tag}
            label={t('impactPulse.weekly.topCategory')}
            loading={loading}
            featured={Boolean(weekly.top_category)}
          >
            {weekly.top_category ? (
              <p className="text-lg font-bold text-primary">
                {t(`categories.${weekly.top_category}`, { defaultValue: weekly.top_category })}
              </p>
            ) : (
              <p className="text-sm text-muted">{t('impactPulse.weekly.noPickYet')}</p>
            )}
          </WeeklyCard>
        </div>
      )}
    </SectionShell>
  )
}

function WeeklyCard({
  icon: Icon,
  label,
  children,
  loading,
  featured,
}: {
  icon: typeof TrendingUp
  label: string
  children: ReactNode
  loading?: boolean
  featured?: boolean
}) {
  return (
    <article
      className={`card-surface min-w-0 p-5 transition ${
        featured ? 'ring-2 ring-accent-200/90 shadow-md shadow-accent-900/5' : ''
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-600 dark:text-accent-300">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {label}
      </div>
      <div className="mt-4 min-w-0">
        {loading ? (
          <>
            <Skeleton className="h-6 w-4/5 rounded-lg" />
            <Skeleton className="mt-2 h-4 w-1/2 rounded-lg" />
          </>
        ) : (
          children
        )}
      </div>
    </article>
  )
}
