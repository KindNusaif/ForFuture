import { Link } from 'react-router-dom'
import { Activity, Map, Megaphone, Rocket } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ImpactPulseGlance } from '../../lib/impactPulse'
import { formatImpactCountFull } from '../../lib/impactPulse'
import { Skeleton } from '../Skeleton'
import DiscoverSectionShell from './DiscoverSectionShell'

interface Props {
  glance: ImpactPulseGlance
  loading: boolean
  unavailable?: boolean
}

export default function DiscoverImpactPreview({ glance, loading, unavailable }: Props) {
  const { t } = useTranslation()

  const stats = [
    { icon: Megaphone, label: t('impactPulse.glance.voices'), value: glance.youth_voices_shared },
    { icon: Rocket, label: t('impactPulse.glance.movements'), value: glance.movements_launched },
    { icon: Activity, label: t('impactPulse.glance.volunteer'), value: glance.volunteer_drives },
  ]

  return (
    <DiscoverSectionShell
      eyebrow={t('discover.impactEyebrow')}
      title={t('discover.impactTitle')}
      subtitle={t('discover.impactSubtitle')}
      className="rounded-3xl bg-muted/50 px-4 sm:px-6"
    >
      <ul className="mb-6 grid gap-3 sm:grid-cols-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <li key={label} className="card-surface flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              {loading ? (
                <Skeleton className="h-7 w-16 rounded-lg" />
              ) : (
                <p className="text-xl font-extrabold tabular-nums text-primary">
                  {unavailable ? '—' : formatImpactCountFull(value)}
                </p>
              )}
              <p className="text-xs font-semibold text-secondary">{label}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/impact" className="btn-primary w-full sm:w-auto">
          {t('discover.viewImpactDashboard')}
        </Link>
        <Link to="/impact-map" className="btn-secondary w-full sm:w-auto">
          <Map className="h-4 w-4" aria-hidden />
          {t('discover.exploreImpactMap')}
        </Link>
      </div>
    </DiscoverSectionShell>
  )
}
