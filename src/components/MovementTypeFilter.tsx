import type { MovementFilter } from '../lib/movements'

interface MovementTypeFilterProps {
  selected: MovementFilter
  onChange: (value: MovementFilter) => void
  compact?: boolean
}

const filters: { value: MovementFilter; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'idea_for_change', label: 'Ideas' },
  { value: 'raise_voice', label: 'Voices' },
  { value: 'volunteer_drive', label: 'Volunteer' },
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'peaceful_civic_action', label: 'Civic Action' },
  { value: 'quick_youth_poll', label: 'Polls' },
]

export default function MovementTypeFilter({
  selected,
  onChange,
  compact = false,
}: MovementTypeFilterProps) {
  const chipRowClass = compact
    ? 'flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
    : '-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0'

  return (
    <div className={compact ? '' : 'space-y-2'}>
      {!compact && (
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Movement type
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
