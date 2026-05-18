import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ThemeQuickToggle from './appearance/ThemeQuickToggle'
import LanguageSwitcher from './LanguageSwitcher'
import Logo from './Logo'
import { useAuth } from '../hooks/useAuth'
import { isPublicMarketingRoute } from '../lib/publicRoutes'

const inactiveClass = 'public-nav-link'
const activeClass = 'public-nav-link public-nav-link-active'

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? activeClass : inactiveClass
}

function mobileNavClass(isActive: boolean) {
  return isActive ? 'mobile-nav-link mobile-nav-link-active' : 'mobile-nav-link'
}

function isAboutActive(pathname: string, hash: string) {
  return pathname === '/' && hash === '#why-forfuture'
}

export default function PublicNav() {
  const [open, setOpen] = useState(false)
  const { isMember, loading } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const aboutActive = isAboutActive(location.pathname, location.hash)
  /** Marketing routes always use the same chrome (no auth-driven nav swap on reload). */
  const isMarketingRoute = isPublicMarketingRoute(location.pathname)
  const authReady = !loading
  const signedIn = authReady && isMember
  const showMarketingCenterNav = isMarketingRoute
  const showAppQuickLinks = !isMarketingRoute && authReady && signedIn
  const showMarketingGuestActions = isMarketingRoute

  const marketingMobileLinks = (
    <>
      <NavLink
        to="/movements"
        end
        className={({ isActive }) => mobileNavClass(isActive)}
        onClick={() => setOpen(false)}
      >
        {t('nav.movements')}
      </NavLink>
      <NavLink
        to="/discover"
        className={({ isActive }) => mobileNavClass(isActive)}
        onClick={() => setOpen(false)}
      >
        {t('nav.discover')}
      </NavLink>
      <NavLink
        to="/impact"
        className={({ isActive }) => mobileNavClass(isActive)}
        onClick={() => setOpen(false)}
      >
        {t('nav.impactNav')}
      </NavLink>
      <a
        href="/#why-forfuture"
        className={mobileNavClass(aboutActive)}
        onClick={() => setOpen(false)}
        aria-current={aboutActive ? 'page' : undefined}
      >
        {t('nav.about')}
      </a>
    </>
  )

  const guestCenterLinks = (
    <>
      <NavLink to="/movements" className={navClass} end>
        {t('nav.movements')}
      </NavLink>
      <NavLink to="/discover" className={navClass}>
        {t('nav.discover')}
      </NavLink>
      <NavLink to="/impact" className={navClass}>
        {t('nav.impactNav')}
      </NavLink>
      <a
        href="/#why-forfuture"
        className={aboutActive ? activeClass : inactiveClass}
        aria-current={aboutActive ? 'page' : undefined}
      >
        {t('nav.about')}
      </a>
    </>
  )

  const guestMobileLinks = (
    <>
      {marketingMobileLinks}
      <Link to="/login" className="mobile-nav-link" onClick={() => setOpen(false)}>
        {t('nav.login')}
      </Link>
      <Link to="/signup" className="btn-primary mt-2 w-full" onClick={() => setOpen(false)}>
        {t('nav.joinMovement')}
      </Link>
    </>
  )

  const memberMarketingMobileLinks = (
    <>
      {marketingMobileLinks}
      <Link to="/feed" className="btn-primary mt-2 w-full" onClick={() => setOpen(false)}>
        {t('nav.myFeed')}
      </Link>
      <Link to="/profile" className="mobile-nav-link" onClick={() => setOpen(false)}>
        {t('nav.profile')}
      </Link>
    </>
  )

  return (
    <header className="nav-shell">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo to={signedIn ? '/feed' : '/'} showTagline={isMarketingRoute && !signedIn} />

        {showMarketingCenterNav && (
          <nav
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex"
            aria-label={t('nav.appNav')}
          >
            {guestCenterLinks}
          </nav>
        )}

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label={t('nav.appNav')}>
          {showAppQuickLinks ? (
            <>
              <Link to="/feed" className={inactiveClass}>
                {t('nav.myFeed')}
              </Link>
              <Link to="/impact-map" className={inactiveClass}>
                {t('nav.impactMap')}
              </Link>
              <Link to="/impact" className={inactiveClass}>
                {t('nav.impactPulse')}
              </Link>
              <Link to="/create" className={inactiveClass}>
                {t('nav.create')}
              </Link>
              <Link to="/profile" className={inactiveClass}>
                {t('nav.profile')}
              </Link>
            </>
          ) : showMarketingGuestActions ? (
            <>
              <Link
                to="/movements"
                className="rounded-lg p-2 text-secondary transition hover:bg-muted hover:text-primary"
                aria-label={t('nav.searchMovements')}
              >
                <Search className="h-5 w-5" aria-hidden />
              </Link>
              {signedIn ? (
                <Link to="/feed" className="btn-primary min-h-10! px-4! py-2!">
                  {t('nav.myFeed')}
                </Link>
              ) : (
                <>
                  <Link to="/login" className={inactiveClass}>
                    {t('nav.login')}
                  </Link>
                  <Link to="/signup" className="btn-primary min-h-10! px-4! py-2!">
                    {t('nav.joinMovement')}
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link
                to="/movements"
                className="rounded-lg p-2 text-secondary transition hover:bg-muted hover:text-primary"
                aria-label={t('nav.searchMovements')}
              >
                <Search className="h-5 w-5" aria-hidden />
              </Link>
              <Link to="/login" className={inactiveClass}>
                {t('nav.login')}
              </Link>
              <Link to="/signup" className="btn-primary min-h-10! px-4! py-2!">
                {t('nav.joinMovement')}
              </Link>
            </>
          )}
          <ThemeQuickToggle variant="compact" className="ml-1" />
          <LanguageSwitcher variant="landing" className="ml-1" />
        </nav>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          {showMarketingGuestActions && !signedIn && (
            <Link
              to="/movements"
              className="rounded-lg p-2 text-secondary ring-1 ring-default hover:bg-muted"
              aria-label={t('nav.searchMovements')}
            >
              <Search className="h-5 w-5" aria-hidden />
            </Link>
          )}
          <ThemeQuickToggle variant="compact" />
          <LanguageSwitcher variant="compact" />
          <button
            type="button"
            className="rounded-xl p-2.5 text-secondary ring-1 ring-default hover:bg-muted"
            onClick={() => setOpen((o) => !o)}
            aria-label={t('nav.menu')}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="space-y-1 border-t border-default px-4 py-4 md:hidden" aria-label={t('nav.mobileNav')}>
          {showAppQuickLinks ? (
            <>
              <Link to="/feed" className="mobile-nav-link" onClick={() => setOpen(false)}>
                {t('nav.myFeed')}
              </Link>
              <Link to="/impact-map" className="mobile-nav-link" onClick={() => setOpen(false)}>
                {t('nav.impactMap')}
              </Link>
              <Link to="/impact" className="mobile-nav-link" onClick={() => setOpen(false)}>
                {t('nav.impactPulse')}
              </Link>
              <Link to="/create" className="mobile-nav-link" onClick={() => setOpen(false)}>
                {t('nav.create')}
              </Link>
              <Link to="/profile" className="mobile-nav-link" onClick={() => setOpen(false)}>
                {t('nav.profile')}
              </Link>
            </>
          ) : showMarketingGuestActions ? (
            signedIn ? memberMarketingMobileLinks : guestMobileLinks
          ) : (
            guestMobileLinks
          )}
        </nav>
      )}
    </header>
  )
}
