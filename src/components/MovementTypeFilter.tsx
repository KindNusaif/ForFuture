import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMovementTypes } from '../hooks/useMovementConfig'
import type { MovementFilter } from '../lib/movements'

interface MovementTypeFilterProps {
  selected: MovementFilter
  onChange: (value: MovementFilter) => void
  compact?: boolean
}

export default function MovementTypeFilter({
  selected,
  onChange,
  compact = false,
}: MovementTypeFilterProps) {
  const { t } = useTranslation()
  const movementTypes = useMovementTypes()

  const filters = useMemo(
    () => [
      { value: 'All' as const, label: t('movements.all') },
      { value: 'donation_relief_hub' as const, label: t('relief.filterChip') },
      ...movementTypes.map((m) => ({
        value: m.value as MovementFilter,
        label: m.shortLabel,
      })),
    ],
    [movementTypes, t],
  )

  const chipRowClass = compact
    ? 'flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
    : '-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0'

  return (
    <div className={compact ? '' : 'space-y-2'}>
      {!compact && (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t('feed.movementType')}
        </p>
      )}
      <div className={chipRowClass}>
        {filters.map(({ value, label }) => {
          const active = selected === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className={`shrink-0 rounded-full font-medium transition ${
                compact ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'
              } ${active ? 'pill-active' : 'pill-inactive'}`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
