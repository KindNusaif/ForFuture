import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../hooks/useTheme'
import type { AppearanceMode } from '../../lib/theme/types'

const MODE_OPTIONS: {
  value: AppearanceMode
  icon: typeof Sun
  labelKey: 'appearance.light' | 'appearance.dark' | 'appearance.system'
}[] = [
  { value: 'light', icon: Sun, labelKey: 'appearance.light' },
  { value: 'dark', icon: Moon, labelKey: 'appearance.dark' },
  { value: 'system', icon: Monitor, labelKey: 'appearance.system' },
]

function ToggleRow({
  id,
  label,
  helper,
  checked,
  onChange,
}: {
  id: string
  label: string
  helper: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-default bg-muted/50 px-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-semibold text-primary">
          {label}
        </label>
        <p className="mt-1 text-xs leading-relaxed text-secondary">{helper}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
          checked ? 'bg-accent-600' : 'bg-muted ring-1 ring-default'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-surface shadow transition ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
          aria-hidden
        />
      </button>
    </div>
  )
}

export default function AppearanceSettings() {
  const { t } = useTranslation()
  const { preferences, setAppearanceMode, setVisualComfort, setReduceMotion } = useTheme()

  return (
    <section
      className="card-surface mt-10 p-5 sm:p-6"
      aria-labelledby="appearance-settings-heading"
    >
      <h2 id="appearance-settings-heading" className="text-lg font-bold text-primary">
        {t('appearance.title')}
      </h2>
      <p className="mt-1 text-sm text-secondary">{t('appearance.subtitle')}</p>

      <div className="mt-6">
        <p className="text-sm font-semibold text-primary">{t('appearance.themeLabel')}</p>
        <p className="mt-1 text-xs text-secondary">{t('appearance.themeHelper')}</p>
        <div
          className="mt-3 grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-label={t('appearance.themeLabel')}
        >
          {MODE_OPTIONS.map(({ value, icon: Icon, labelKey }) => {
            const selected = preferences.appearanceMode === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAppearanceMode(value)}
                className={`flex min-h-22 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
                  selected
                    ? 'border-accent-400 bg-accent-50/80 text-accent-800 ring-1 ring-accent-300/80'
                    : 'border-default bg-surface text-secondary hover:border-accent-200 hover:bg-muted/60'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {t(labelKey)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <ToggleRow
          id="visual-comfort"
          label={t('appearance.comfortLabel')}
          helper={t('appearance.comfortHelper')}
          checked={preferences.visualComfort}
          onChange={setVisualComfort}
        />
        <ToggleRow
          id="reduce-motion"
          label={t('appearance.motionLabel')}
          helper={t('appearance.motionHelper')}
          checked={preferences.reduceMotion}
          onChange={setReduceMotion}
        />
      </div>
    </section>
  )
}
