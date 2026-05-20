import { useEffect, useRef, useState } from 'react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../hooks/useTheme'
import type { AppearanceMode } from '../../lib/theme/types'

interface ThemeMenuProps {
  variant?: 'compact' | 'nav' | 'landing'
  className?: string
}

const MODES: { mode: AppearanceMode; icon: typeof Sun; labelKey: string }[] = [
  { mode: 'light', icon: Sun, labelKey: 'appearance.light' },
  { mode: 'dark', icon: Moon, labelKey: 'appearance.dark' },
  { mode: 'system', icon: Monitor, labelKey: 'appearance.system' },
]

export default function ThemeMenu({ variant = 'compact', className = '' }: ThemeMenuProps) {
  const { t } = useTranslation()
  const { preferences, setAppearanceMode } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const current = MODES.find((m) => m.mode === preferences.appearanceMode) ?? MODES[2]
  const CurrentIcon = current.icon

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const triggerClass =
    variant === 'nav'
      ? 'rounded-lg px-3 py-2 text-sm font-medium text-secondary transition hover:bg-muted hover:text-primary'
      : variant === 'landing'
        ? 'lovable-nav-icon-btn'
        : 'rounded-xl p-2.5 text-secondary ring-1 ring-default transition hover:bg-muted hover:text-primary'

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
        aria-label={t('appearance.themeMenu')}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <CurrentIcon className={variant === 'landing' ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden />
      </button>

      {open && (
        <div className="theme-menu" role="menu" aria-label={t('appearance.themeMenu')}>
          {MODES.map(({ mode, icon: Icon, labelKey }) => {
            const active = preferences.appearanceMode === mode
            return (
              <button
                key={mode}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={`theme-menu-item ${active ? 'theme-menu-item-active' : ''}`}
                onClick={() => {
                  setAppearanceMode(mode)
                  setOpen(false)
                }}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="flex-1">{t(labelKey)}</span>
                {active && <Check className="h-4 w-4 shrink-0" aria-hidden />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
