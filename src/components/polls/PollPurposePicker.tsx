import { useTranslation } from 'react-i18next'
import { POLL_PURPOSES, type PollPurposeId } from '../../lib/pollPurposes'

interface PollPurposePickerProps {
  value: PollPurposeId | ''
  onChange: (value: PollPurposeId) => void
  error?: string
  disabled?: boolean
}

export default function PollPurposePicker({
  value,
  onChange,
  error,
  disabled,
}: PollPurposePickerProps) {
  const { t } = useTranslation()

  return (
    <fieldset id="poll-purpose" disabled={disabled} className="space-y-2">
      <legend className={`text-sm font-medium ${error ? 'text-red-700 dark:text-red-400' : 'text-secondary'}`}>
        {t('polls.purposeLabel', { defaultValue: 'Poll purpose (optional)' })}
      </legend>
      <p className="text-xs text-muted">
        {t('polls.purposeHint', {
          defaultValue: 'Helps your community understand why you are asking.',
        })}
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {POLL_PURPOSES.map((purpose) => {
          const selected = value === purpose.id
          return (
            <button
              key={purpose.id}
              type="button"
              onClick={() => onChange(purpose.id)}
              className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
                selected
                  ? 'border-accent-500 bg-accent-50 ring-2 ring-accent-500/25 dark:bg-accent-950/40'
                  : 'border-default bg-surface text-secondary hover:border-accent-300 hover:bg-muted'
              } ${error && !selected ? 'border-red-300' : ''}`}
              aria-pressed={selected}
            >
              {t(purpose.labelKey, { defaultValue: purpose.labelDefault })}
            </button>
          )
        })}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}
