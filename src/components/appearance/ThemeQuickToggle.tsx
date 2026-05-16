import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../hooks/useTheme'

interface ThemeQuickToggleProps {
  variant?: 'compact' | 'nav'
  className?: string
}

export default function ThemeQuickToggle({
  variant = 'compact',
  className = '',
}: ThemeQuickToggleProps) {
  const { t } = useTranslation()
  const { preferences, cycleAppearanceMode } = useTheme()

  const Icon =
    preferences.appearanceMode === 'dark'
      ? Moon
      : preferences.appearanceMode === 'light'
        ? Sun
        : Monitor

  const label =
    preferences.appearanceMode === 'dark'
      ? t('appearance.dark')
      : preferences.appearanceMode === 'light'
        ? t('appearance.light')
        : t('appearance.system')

  const base =
    variant === 'nav'
      ? 'rounded-lg px-3 py-2 text-sm font-medium text-secondary transition hover:bg-muted hover:text-primary'
      : 'rounded-xl p-2.5 text-secondary ring-1 ring-default transition hover:bg-muted hover:text-primary'

  return (
    <button
      type="button"
      onClick={cycleAppearanceMode}
      className={`${base} ${className}`.trim()}
      aria-label={t('appearance.quickToggle', { mode: label })}
      title={t('appearance.quickToggle', { mode: label })}
    >
      <Icon className="h-5 w-5" aria-hidden />
      {variant === 'nav' && <span className="sr-only">{label}</span>}
    </button>
  )
}
