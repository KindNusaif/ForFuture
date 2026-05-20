import { Droplet, HeartHandshake, Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ReliefCreateSubtype } from '../../lib/reliefHub'

const OPTIONS: {
  value: ReliefCreateSubtype
  icon: typeof Droplet
  accent: string
}[] = [
  { value: 'blood_donation', icon: Droplet, accent: 'border-rose-200 bg-rose-50/80 hover:border-rose-300' },
  { value: 'item_donation', icon: Package, accent: 'border-amber-200 bg-amber-50/80 hover:border-amber-300' },
  {
    value: 'fundraising',
    icon: HeartHandshake,
    accent: 'border-sky-200 bg-sky-50/80 hover:border-sky-300',
  },
]

interface ReliefSubtypePickerProps {
  value: ReliefCreateSubtype | null
  onChange: (value: ReliefCreateSubtype) => void
  disabled?: boolean
  /** Subtypes the user cannot select (e.g. fundraising without verified org). */
  lockedSubtypes?: ReliefCreateSubtype[]
}

export default function ReliefSubtypePicker({
  value,
  onChange,
  disabled,
  lockedSubtypes = [],
}: ReliefSubtypePickerProps) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {OPTIONS.map(({ value: v, icon: Icon, accent }) => {
        const selected = value === v
        const locked = lockedSubtypes.includes(v)
        return (
          <button
            key={v}
            type="button"
            disabled={disabled || locked}
            title={locked ? t('reliefHub.fundraisingLocked') : undefined}
            onClick={() => onChange(v)}
            className={`flex min-w-0 flex-col items-start rounded-2xl border-2 p-4 text-left transition ${
              selected
                ? 'border-accent-500 bg-accent-50/90 ring-2 ring-accent-500/20'
                : `${accent} border-transparent`
            } disabled:opacity-50`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm ring-1 ring-default">
              <Icon className="h-5 w-5 text-secondary" aria-hidden />
            </span>
            <span className="mt-3 text-sm font-bold text-primary">
              {t(`relief.subtypes.${v}.title`)}
            </span>
            <span className="mt-1 text-xs leading-relaxed text-secondary">
              {t(`relief.subtypes.${v}.description`)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
