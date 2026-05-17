import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMovementConfig } from '../../lib/movements'
import { MOVEMENT_TYPES_BASE } from '../../lib/movementBase'
import { movementsFilterUrl } from '../../lib/discover'
import type { MovementType } from '../../types'
import DiscoverSectionShell from './DiscoverSectionShell'

const DISCOVER_TYPES: MovementType[] = [
  'idea_for_change',
  'raise_voice',
  'volunteer_drive',
  'fundraising',
  'peaceful_civic_action',
  'quick_youth_poll',
]

export default function DiscoverMovementTypesSection() {
  const { t } = useTranslation()

  return (
    <DiscoverSectionShell
      eyebrow={t('discover.typesEyebrow')}
      title={t('discover.typesTitle')}
      subtitle={t('discover.typesSubtitle')}
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DISCOVER_TYPES.map((type) => {
          const config = getMovementConfig(type)
          const staticMeta = MOVEMENT_TYPES_BASE.find((m) => m.value === type)
          const Icon = staticMeta?.icon ?? config.icon
          return (
            <li key={type}>
              <Link
                to={movementsFilterUrl({ type })}
                className="group card-surface flex gap-4 p-5 transition hover:border-accent-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${config.badgeClass}`}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-primary group-hover:text-accent-700">{config.label}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-secondary">
                    {config.description}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </DiscoverSectionShell>
  )
}
