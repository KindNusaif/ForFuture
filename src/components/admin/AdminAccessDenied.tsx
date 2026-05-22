import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function AdminAccessDenied() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
        <ShieldOff className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="text-xl font-semibold text-primary">
        {t('admin.accessDenied.title', { defaultValue: 'Access denied' })}
      </h1>
      <p className="max-w-md text-sm text-muted">
        {t('admin.accessDenied.message', {
          defaultValue: "You don't have permission to view the admin dashboard.",
        })}
      </p>
      <Link to="/feed" className="btn-primary mt-2">
        {t('admin.accessDenied.backToFeed', { defaultValue: 'Back to Feed' })}
      </Link>
    </div>
  )
}
