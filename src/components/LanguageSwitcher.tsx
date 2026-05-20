import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AppLanguage } from '../i18n'

const OPTIONS: { code: AppLanguage; labelKey: string }[] = [
  { code: 'en', labelKey: 'language.english' },
  { code: 'ta', labelKey: 'language.tamil' },
  { code: 'si', labelKey: 'language.sinhala' },
]

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'landing' | 'sidebar'
  className?: string
}

export default function LanguageSwitcher({
  variant = 'default',
  className = '',
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const current =
    OPTIONS.find((o) => o.code === i18n.language)?.code ?? ('en' as AppLanguage)

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

  function selectLanguage(code: AppLanguage) {
    void i18n.changeLanguage(code)
    setOpen(false)
  }

  const triggerClass =
    variant === 'compact'
      ? 'menu-trigger-compact'
      : variant === 'sidebar'
        ? 'menu-trigger-sidebar'
        : variant === 'landing'
          ? 'menu-trigger-landing'
          : 'menu-trigger'

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language.select')}
      >
        <Globe
          className={`h-4 w-4 shrink-0 ${variant === 'landing' ? 'text-muted-foreground' : 'text-accent-600 dark:text-accent-400'}`}
          aria-hidden
        />
        <span
          className={
            variant === 'sidebar'
              ? 'language-switcher-label language-switcher-label--code'
              : 'language-switcher-label max-w-[7rem] truncate sm:max-w-none'
          }
        >
          {variant === 'landing' || variant === 'sidebar'
            ? current.toUpperCase()
            : variant === 'compact'
              ? t(
                  `language.${current === 'en' ? 'english' : current === 'ta' ? 'tamil' : 'sinhala'}`,
                )
              : t('language.label')}
        </span>
        {(variant === 'landing' || variant === 'sidebar') && (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        )}
      </button>

      {open && (
        <ul role="listbox" aria-label={t('language.select')} className="theme-menu">
          {OPTIONS.map(({ code, labelKey }) => {
            const selected = current === code
            return (
              <li key={code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => selectLanguage(code)}
                  className={`theme-menu-item ${selected ? 'theme-menu-item-active' : ''}`}
                >
                  {t(labelKey)}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
