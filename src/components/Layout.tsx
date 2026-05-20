import { Outlet, useLocation } from 'react-router-dom'
import PublicNav from './PublicNav'
import LandingFooter from './landing/LandingFooter'
import SkipLink from './SkipLink'

const AUTH_PATHS = new Set(['/login', '/signup', '/forgot-password', '/reset-password'])

export default function Layout() {
  const { pathname } = useLocation()
  const isLovableHome = pathname === '/'
  const isAuthPage = AUTH_PATHS.has(pathname)

  return (
    <div
      className={[
        'flex min-h-screen flex-col',
        isLovableHome ? 'layout-lovable-marketing' : '',
        isAuthPage ? 'auth-premium-page' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <SkipLink />
      {!isAuthPage && <PublicNav />}
      <main id="main-content" className="min-w-0 flex-1 page-enter">
        <Outlet />
      </main>
      {!isLovableHome && !isAuthPage && <LandingFooter />}
    </div>
  )
}
