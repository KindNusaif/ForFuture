import { MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ImpactPulseDistrictRow } from '../../lib/impactPulse'
import { safeArray } from '../../lib/safeData'
import { formatImpactCountFull } from '../../lib/impactPulse'
import SectionShell from './SectionShell'
import { Skeleton } from '../Skeleton'

interface Props {
  districts: ImpactPulseDistrictRow[]
  loading?: boolean
  unavailable?: boolean
}

export default function ImpactPulseDistricts({ districts, loading, unavailable }: Props) {
  const { t } = useTranslation()
  const rows = safeArray<ImpactPulseDistrictRow>(districts)

  if (unavailable && !loading) {
    return (
      <SectionShell
        id="district-energy"
        title={t('impactPulse.districts.title')}
        subtitle={t('impactPulse.districts.subtitle')}
      >
        <p className="card-surface border-dashed px-6 py-10 text-center text-sm text-secondary">
          {t('impactPulse.metricsUnavailable')}
        </p>
      </SectionShell>
    )
  }

  return (
    <SectionShell
      id="district-energy"
      title={t('impactPulse.districts.title')}
      subtitle={t('impactPulse.districts.subtitle')}
    >
      {!loading && rows.length === 0 ? (
        <p className="card-surface border-dashed px-6 py-10 text-center text-sm text-secondary">
          {t('impactPulse.districts.empty')}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {(loading ? Array.from({ length: 4 }) : rows).map((row, index) => {
            if (loading) {
              return (
                <li key={index} className="card-surface p-4">
                  <Skeleton className="h-5 w-32 rounded-lg" />
                  <Skeleton className="mt-2 h-4 w-24 rounded-lg" />
                </li>
              )
            }
            const item = row as ImpactPulseDistrictRow
            const rank = index + 1
            return (
              <li
                key={item.district}
                className={`card-surface flex min-w-0 items-center gap-3 p-4 ${
                  rank === 1 ? 'ring-2 ring-brand-200/80' : ''
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    rank <= 3 ? 'metric-icon-brand' : 'card-inset text-secondary'
                  }`}
                >
                  {rank <= 3 ? (
                    <span className="text-sm font-extrabold">{rank}</span>
                  ) : (
                    <MapPin className="h-5 w-5" aria-hidden />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-primary wrap-anywhere">{item.district}</p>
                  <p className="text-sm text-secondary">
                    {t('impactPulse.districts.activeMovements', {
                      count: formatImpactCountFull(item.count),
                    })}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </SectionShell>
  )
}
