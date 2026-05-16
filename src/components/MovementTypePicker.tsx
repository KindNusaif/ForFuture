import { MOVEMENT_TYPES } from '../lib/movements'
import type { MovementType } from '../types'

interface MovementTypePickerProps {
  value: MovementType
  onChange: (value: MovementType) => void
  disabled?: boolean
}

export default function MovementTypePicker({
  value,
  onChange,
  disabled,
}: MovementTypePickerProps) {
  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <div>
        <legend className="text-base font-bold text-slate-900">Choose how you want to create impact</legend>
        <p className="mt-1 text-sm text-slate-600">Select a movement type to get started.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {MOVEMENT_TYPES.map((type) => {
          const selected = value === type.value
          const Icon = type.icon
          return (
            <label
              key={type.value}
              className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-4 transition ${
                selected
                  ? 'border-accent-500 bg-accent-50/70 ring-2 ring-accent-500/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-accent-200 hover:bg-slate-50/80'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="radio"
                name="movementType"
                value={type.value}
                checked={selected}
                onChange={() => onChange(type.value)}
                className="sr-only"
              />
              <span
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ring-1 ${
                  selected
                    ? 'bg-accent-600 text-white ring-accent-600'
                    : 'bg-white text-slate-500 ring-slate-200'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-slate-900">{type.label}</span>
              <span className="mt-1 text-xs leading-relaxed text-slate-600">
                {type.description}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
