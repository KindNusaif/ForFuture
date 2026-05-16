import { useEffect, useRef, useState } from 'react'
import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AppLanguage } from '../i18n'

const OPTIONS: { code: AppLanguage; labelKey: string }[] = [
  { code: 'en', labelKey: 'language.english' },
  { code: 'ta', labelKey: 'language.tamil' },
  { code: 'si', labelKey: 'language.sinhala' },
]

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'landing'
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
      ? 'inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-accent-200 hover:bg-accent-50/50'
      : variant === 'landing'
        ? 'inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:border-accent-200 hover:bg-white'
        : 'inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-accent-200 hover:bg-accent-50/60'

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
        <Globe className="h-4 w-4 shrink-0 text-accent-600" aria-hidden />
        <span className="max-w-[7rem] truncate sm:max-w-none">
          {variant === 'compact' ? t(`language.${current === 'en' ? 'english' : current === 'ta' ? 'tamil' : 'sinhala'}`) : t('language.label')}
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('language.select')}
          className="absolute right-0 z-50 mt-2 min-w-[10.5rem] overflow-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg shadow-slate-900/10"
        >
          {OPTIONS.map(({ code, labelKey }) => {
            const selected = current === code
            return (
              <li key={code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => selectLanguage(code)}
                  className={`flex w-full items-center px-3 py-2.5 text-left text-sm transition ${
                    selected
                      ? 'bg-accent-50 font-semibold text-accent-800'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
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
