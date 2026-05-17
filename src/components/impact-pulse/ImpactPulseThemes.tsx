import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ImpactPulseCategoryRow } from '../../lib/impactPulse'
import { formatImpactCountFull, formatShare } from '../../lib/impactPulse'
import SectionShell from './SectionShell'
import { Skeleton } from '../Skeleton'

interface Props {
  categories: ImpactPulseCategoryRow[]
  loading?: boolean
  unavailable?: boolean
}

export default function ImpactPulseThemes({ categories, loading, unavailable }: Props) {
  const { t } = useTranslation()
  const max = useMemo(() => Math.max(...categories.map((c) => c.count), 1), [categories])

  if (unavailable && !loading) {
    return (
      <SectionShell
        id="impact-themes"
        title={t('impactPulse.themes.title')}
        subtitle={t('impactPulse.themes.subtitle')}
      >
        <p className="card-surface border-dashed px-6 py-10 text-center text-sm text-secondary">
          {t('impactPulse.metricsUnavailable')}
        </p>
      </SectionShell>
    )
  }

  return (
    <SectionShell
      id="impact-themes"
      title={t('impactPulse.themes.title')}
      subtitle={t('impactPulse.themes.subtitle')}
    >
      {!loading && categories.length === 0 ? (
        <p className="card-surface border-dashed px-6 py-10 text-center text-sm text-secondary">
          {t('impactPulse.themes.empty')}
        </p>
      ) : (
        <ul className="card-surface divide-y divide-default p-4 sm:p-6" aria-label={t('impactPulse.themes.title')}>
          {(loading ? Array.from({ length: 5 }) : categories).map((row, index) => {
            if (loading) {
              return (
                <li key={index} className="py-4 first:pt-0 last:pb-0">
                  <Skeleton className="h-4 w-full rounded-lg" />
                  <Skeleton className="mt-2 h-3 w-2/3 rounded-lg" />
                </li>
              )
            }
            const item = row as ImpactPulseCategoryRow
            const label = t(`categories.${item.category}`, { defaultValue: item.category })
            const width = `${Math.max(8, (item.count / max) * 100)}%`
            const rank = index + 1
            return (
              <li key={item.category} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-primary">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        rank <= 3 ? 'metric-icon-accent' : 'card-inset text-secondary'
                      }`}
                      aria-hidden
                    >
                      {rank}
                    </span>
                    <span className="wrap-anywhere">{label}</span>
                  </span>
                  <span className="text-xs font-medium text-muted">
                    {formatImpactCountFull(item.count)} · {formatShare(item.share)}
                  </span>
                </div>
                <div
                  className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={item.count}
                  aria-valuemin={0}
                  aria-valuemax={max}
                  aria-label={`${label}: ${formatImpactCountFull(item.count)}`}
                >
                  <div
                    className="h-full rounded-full bg-linear-to-r from-accent-500 to-brand-500 transition-all"
                    style={{ width }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </SectionShell>
  )
}
