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
}

export default function ImpactPulseWeekly({ weekly, loading }: Props) {
  const { t } = useTranslation()

  const hasWeekly =
    weekly.most_supported ||
    weekly.fastest_petition ||
    weekly.top_movement_type ||
    weekly.top_category

  return (
    <SectionShell
      id="weekly-momentum"
      title={t('impactPulse.weekly.title')}
      subtitle={t('impactPulse.weekly.subtitle')}
    >
      {!loading && !hasWeekly ? (
        <div className="card-surface border-dashed px-6 py-12 text-center">
          <Flame className="mx-auto h-10 w-10 text-accent-500" aria-hidden />
          <p className="mt-4 text-sm leading-relaxed text-slate-600">{t('impactPulse.weekly.empty')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <WeeklyCard
            icon={TrendingUp}
            label={t('impactPulse.weekly.mostSupported')}
            loading={loading}
          >
            {weekly.most_supported ? (
              <>
                <p className="text-lg font-bold text-slate-900 [overflow-wrap:anywhere] [word-break:break-word]">
                  {weekly.most_supported.title}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {t('impactPulse.weekly.supportCount', {
                    count: formatImpactCountFull(weekly.most_supported.engagement_count),
                  })}
                </p>
                <span className="mt-3 inline-flex rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-800 ring-1 ring-accent-200/80">
                  {buildMovementConfig(weekly.most_supported.movement_type, t).shortLabel}
                </span>
              </>
            ) : (
              <p className="text-sm text-slate-500">—</p>
            )}
          </WeeklyCard>

          <WeeklyCard icon={Flame} label={t('impactPulse.weekly.fastestPetition')} loading={loading}>
            {weekly.fastest_petition ? (
              <>
                <p className="text-lg font-bold text-slate-900 [overflow-wrap:anywhere] [word-break:break-word]">
                  {weekly.fastest_petition.title}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {t('impactPulse.weekly.weekSignatures', {
                    count: formatImpactCountFull(weekly.fastest_petition.week_signatures),
                  })}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">—</p>
            )}
          </WeeklyCard>

          <WeeklyCard icon={Layers} label={t('impactPulse.weekly.topType')} loading={loading}>
            {weekly.top_movement_type ? (
              <p className="text-lg font-bold text-slate-900">
                {buildMovementConfig(weekly.top_movement_type, t).label}
              </p>
            ) : (
              <p className="text-sm text-slate-500">—</p>
            )}
          </WeeklyCard>

          <WeeklyCard icon={Tag} label={t('impactPulse.weekly.topCategory')} loading={loading}>
            {weekly.top_category ? (
              <p className="text-lg font-bold text-slate-900">
                {t(`categories.${weekly.top_category}`, { defaultValue: weekly.top_category })}
              </p>
            ) : (
              <p className="text-sm text-slate-500">—</p>
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
}: {
  icon: typeof TrendingUp
  label: string
  children: ReactNode
  loading?: boolean
}) {
  return (
    <article className="card-surface min-w-0 p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-600">
        <Icon className="h-4 w-4" aria-hidden />
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
