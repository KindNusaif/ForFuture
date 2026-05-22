import { Link } from 'react-router-dom'
import { ArrowLeft, Menu, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../hooks/useTheme'

interface AdminTopbarProps {
  title: string
  onOpenMenu?: () => void
}

export default function AdminTopbar({ title, onOpenMenu }: AdminTopbarProps) {
  const { t } = useTranslation()
  const { resolvedTheme, cycleAppearanceMode } = useTheme()

  return (
    <header className="admin-topbar">
      <div className="flex min-w-0 items-center gap-3">
        {onOpenMenu ? (
          <button
            type="button"
            className="btn-ghost inline-flex md:hidden"
            onClick={onOpenMenu}
            aria-label={t('admin.openMenu', { defaultValue: 'Open admin menu' })}
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : null}
        <h1 className="truncate text-lg font-semibold text-primary">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="btn-ghost"
          onClick={cycleAppearanceMode}
          aria-label={
            resolvedTheme === 'dark'
              ? t('theme.switchToLight', { defaultValue: 'Switch to light mode' })
              : t('theme.switchToDark', { defaultValue: 'Switch to dark mode' })
          }
        >
          {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <Link to="/feed" className="btn-ghost inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">
            {t('admin.backToApp', { defaultValue: 'Back to app' })}
          </span>
        </Link>
      </div>
    </header>
  )
}
