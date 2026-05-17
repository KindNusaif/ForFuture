import { Minus, Plus } from 'lucide-react'
import { FormField, inputClass, inputErrorClass } from './AuthForm'
import { POLL_OPTION_MAX, POLL_OPTION_MIN } from '../lib/polls'
import { POST_LIMITS } from '../lib/validation'
import type { CreatePostFieldErrors } from '../lib/validation'

interface PollFieldsProps {
  options: string[]
  onChange: (options: string[]) => void
  errors: CreatePostFieldErrors
  disabled?: boolean
  /** Emphasize poll options directly under the question (create flow). */
  priority?: boolean
}

export default function PollFields({
  options,
  onChange,
  errors,
  disabled,
  priority,
}: PollFieldsProps) {
  function updateOption(index: number, value: string) {
    const next = [...options]
    next[index] = value
    onChange(next)
  }

  function addOption() {
    if (options.length >= POLL_OPTION_MAX) return
    onChange([...options, ''])
  }

  function removeOption(index: number) {
    if (options.length <= POLL_OPTION_MIN) return
    onChange(options.filter((_, i) => i !== index))
  }

  return (
    <div className={`space-y-4 p-4 ${priority ? 'poll-panel-inset' : 'card-inset'}`}>
      <div>
        <p className="poll-heading text-xs font-semibold uppercase tracking-wide">
          Poll options
        </p>
        <p className="poll-helper mt-1 text-xs opacity-90">
          Add between {POLL_OPTION_MIN} and {POLL_OPTION_MAX} choices. Each option must be unique.
        </p>
      </div>

      {errors.pollOptions && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {errors.pollOptions}
        </p>
      )}

      <ul className="space-y-3">
        {options.map((value, index) => (
          <li key={index}>
            <FormField
              label={`Option ${index + 1}`}
              id={`poll-option-${index}`}
              error={errors[`pollOption_${index}`]}
            >
              <div className="flex gap-2">
                <input
                  id={`poll-option-${index}`}
                  type="text"
                  value={value}
                  onChange={(e) => updateOption(index, e.target.value)}
                  maxLength={POST_LIMITS.shortMax}
                  placeholder={`Choice ${index + 1}`}
                  disabled={disabled}
                  className={`${inputClass} flex-1 ${errors[`pollOption_${index}`] ? inputErrorClass : ''}`}
                />
                {options.length > POLL_OPTION_MIN && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    disabled={disabled}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-default bg-surface text-secondary transition hover:bg-muted disabled:opacity-50"
                    aria-label={`Remove option ${index + 1}`}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </FormField>
          </li>
        ))}
      </ul>

      {options.length < POLL_OPTION_MAX && (
        <button
          type="button"
          onClick={addOption}
          disabled={disabled}
          className="poll-add-option inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add option
        </button>
      )}
    </div>
  )
}

