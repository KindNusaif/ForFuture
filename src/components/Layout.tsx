import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PublicNav from './PublicNav'

export default function Layout() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-default bg-nav py-10">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <p className="text-sm font-semibold text-accent-800">{t('landing.eyebrow')}</p>
          <p className="mt-2 text-sm text-slate-500">{t('landing.whySubtitle')}</p>
        </div>
      </footer>
    </div>
  )
}
