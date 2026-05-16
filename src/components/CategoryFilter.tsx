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
  return (
    <div className={compact ? 'space-y-2' : 'space-y-2'}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</p>
      <div
        className={
          compact
            ? 'flex flex-wrap gap-1.5'
            : '-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0'
        }
      >
        {options.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`shrink-0 rounded-full font-medium transition ${
              compact ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'
            } ${selected === cat ? 'pill-active' : 'pill-inactive'}`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}
