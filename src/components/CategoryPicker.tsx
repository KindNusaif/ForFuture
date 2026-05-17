import { CATEGORIES, type Category } from '../types'

const categoryHints: Record<Category, string> = {
  Education: 'Schools, literacy, skills',
  Environment: 'Climate, nature, sustainability',
  Health: 'Wellness, healthcare access',
  Justice: 'Rights, fairness, accountability',
  Technology: 'Digital, innovation, STEM',
  Community: 'Local action, volunteering',
  Economy: 'Jobs, entrepreneurship',
  Other: 'Everything else',
}

interface CategoryPickerProps {
  value: Category | ''
  onChange: (category: Category) => void
  error?: string
  disabled?: boolean
}

export default function CategoryPicker({ value, onChange, error, disabled }: CategoryPickerProps) {
  return (
    <fieldset id="category" disabled={disabled}>
      <legend className={`text-sm font-medium ${error ? 'text-red-700' : 'text-secondary'}`}>
        Category <span className="text-red-600">*</span>
      </legend>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const selected = value === cat
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                selected
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/30'
                  : 'border-default bg-surface hover:border-brand-300 hover:bg-muted'
              } ${error && !selected ? 'border-red-300' : ''}`}
              aria-pressed={selected}
            >
              <span className="block text-sm font-semibold text-primary">{cat}</span>
              <span className="mt-0.5 block text-xs text-muted">{categoryHints[cat]}</span>
            </button>
          )
        })}
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}
