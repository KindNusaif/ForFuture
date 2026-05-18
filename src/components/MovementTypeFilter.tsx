import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import FilterScrollRail from './FilterScrollRail'
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

  const chipButtons = filters.map(({ value, label }) => {
    const active = selected === value
    return (
      <button
        key={value}
        type="button"
        onClick={() => onChange(value)}
        className={`filter-pill shrink-0 rounded-full font-medium transition ${
          compact ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'
        } ${active ? 'pill-active' : 'pill-inactive'}`}
      >
        {label}
      </button>
    )
  })

  return (
    <div className={compact ? '' : 'space-y-2'}>
      {!compact && (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t('feed.movementType')}
        </p>
      )}
      {compact ? (
        <FilterScrollRail aria-label={t('feed.movementType')}>{chipButtons}</FilterScrollRail>
      ) : (
        <div className="-mx-4 flex flex-wrap gap-2 px-4 pb-1 sm:mx-0 sm:px-0">{chipButtons}</div>
      )}
    </div>
  )
}
