import type { ReactNode } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PublicNav from './PublicNav'
import PublicFooter from './PublicFooter'
import SkipLink from './SkipLink'
import { useAuth } from '../hooks/useAuth'

export default function ExploreLayout({ children }: { children?: ReactNode }) {
  const { t } = useTranslation()
  const { isMember } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <PublicNav />
      <main id="main-content" className="min-w-0 flex-1 page-enter pb-16 md:pb-0">
        {children ?? <Outlet />}
      </main>
      <PublicFooter />
      {!isMember && (
        <aside className="guest-banner fixed inset-x-0 bottom-0 z-30 border-t border-accent-500/25 bg-accent-500/10 px-4 py-3 backdrop-blur-md md:hidden dark:border-accent-400/20 dark:bg-accent-500/15">
          <p className="text-center text-xs text-primary">
            {t('explore.guestBanner')}{' '}
            <Link to="/signup" className="link-primary underline">
              {t('explore.guestJoin')}
            </Link>{' '}
            {t('explore.guestContribute')}
          </p>
        </aside>
      )}
    </div>
  )
}
