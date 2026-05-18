import FilterScrollRail from './FilterScrollRail'
import { CATEGORIES, type Category } from '../types'

interface CategoryFilterProps {
  selected: Category | 'All'
  onChange: (category: Category | 'All') => void
  compact?: boolean
}

const options: (Category | 'All')[] = ['All', ...CATEGORIES]

export default function CategoryFilter({
  selected,
  onChange,
  compact = false,
}: CategoryFilterProps) {
  const pills = options.map((cat) => (
    <button
      key={cat}
      type="button"
      onClick={() => onChange(cat)}
      className={`filter-pill shrink-0 rounded-full font-medium transition ${
        compact ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'
      } ${selected === cat ? 'pill-active' : 'pill-inactive'}`}
    >
      {cat}
    </button>
  ))

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Category</p>
      {compact ? (
        <FilterScrollRail aria-label="Category">{pills}</FilterScrollRail>
      ) : (
        <div className="-mx-4 flex flex-wrap gap-2 px-4 pb-1 sm:mx-0 sm:px-0">{pills}</div>
      )}
    </div>
  )
}
