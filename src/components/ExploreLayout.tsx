import type { ReactNode } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PublicNav from './PublicNav'
import PublicFooter from './PublicFooter'
import { useAuth } from '../hooks/useAuth'

export default function ExploreLayout({ children }: { children?: ReactNode }) {
  const { t } = useTranslation()
  const { isMember } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="min-w-0 flex-1 pb-16 md:pb-0">
        {children ?? <Outlet />}
      </main>
      <PublicFooter />
      {!isMember && (
        <aside className="fixed inset-x-0 bottom-0 z-30 border-t border-accent-200/80 bg-accent-50/95 px-4 py-3 backdrop-blur-md md:hidden">
          <p className="text-center text-xs text-accent-900">
            {t('explore.guestBanner')}{' '}
            <Link to="/signup" className="font-semibold underline hover:text-accent-700">
              {t('explore.guestJoin')}
            </Link>{' '}
            {t('explore.guestContribute')}
          </p>
        </aside>
      )}
    </div>
  )
}
