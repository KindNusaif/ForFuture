import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ThemeQuickToggle from './appearance/ThemeQuickToggle'
import LanguageSwitcher from './LanguageSwitcher'
import Logo from './Logo'
import { useAuth } from '../hooks/useAuth'
import { isPublicMarketingRoute } from '../lib/publicRoutes'
import {
  isMarketingAboutActive,
  isMarketingDiscoverActive,
  isMarketingExploreActive,
  isMarketingImpactActive,
} from '../lib/marketingNav'
import { authStateFromPath, buildAuthReturn } from '../lib/authReturn'

const inactiveClass =
  'public-nav-link inline-flex min-h-10 items-center justify-center whitespace-nowrap px-3 py-2 text-sm font-medium'
const activeClass = `${inactiveClass} public-nav-link-active`

function marketingLinkClass(active: boolean) {
  return active ? activeClass : inactiveClass
}

function mobileNavClass(isActive: boolean) {
  return isActive ? 'mobile-nav-link mobile-nav-link-active' : 'mobile-nav-link'
}

export default function PublicNav() {
  const [open, setOpen] = useState(false)
  const { isMember, loading, loggingOut } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const authReturnState = useMemo(
    () =>
      authStateFromPath(
        buildAuthReturn(location.pathname, location.search, location.hash),
      ),
    [location.pathname, location.search, location.hash],
  )

  const exploreNavActive = isMarketingExploreActive(location.pathname)
  const discoverNavActive = isMarketingDiscoverActive(location.pathname)
  const impactNavActive = isMarketingImpactActive(location.pathname)
  const aboutActive = isMarketingAboutActive(location.pathname, location.hash)

  const isLovableHome = location.pathname === '/'
  const isMarketingRoute = isPublicMarketingRoute(location.pathname)
  const authReady = !loading && !loggingOut
  const signedIn = authReady && isMember
  const showMarketingCenterNav = isMarketingRoute
  const showAppQuickLinks = !isMarketingRoute && authReady && signedIn
  const showMarketingGuestActions = isMarketingRoute

  const marketingMobileLinks = (
    <>
      <Link
        to="/explore"
        className={mobileNavClass(exploreNavActive)}
        onClick={() => setOpen(false)}
        aria-current={exploreNavActive ? 'page' : undefined}
      >
        {t('nav.exploreMovements', { defaultValue: 'Explore Movements' })}
      </Link>
      <Link
        to="/discover?focus=nearby"
        className={mobileNavClass(discoverNavActive)}
        onClick={() => setOpen(false)}
        aria-current={discoverNavActive ? 'page' : undefined}
      >
        {t('nav.discoverNearby', { defaultValue: 'Discover Nearby' })}
      </Link>
      <Link
        to="/impact"
        className={mobileNavClass(impactNavActive)}
        onClick={() => setOpen(false)}
        aria-current={impactNavActive ? 'page' : undefined}
      >
        {t('nav.impactNav', { defaultValue: 'Impact' })}
      </Link>
      <Link
        to="/how-it-works"
        className={mobileNavClass(location.pathname === '/how-it-works')}
        onClick={() => setOpen(false)}
        aria-current={location.pathname === '/how-it-works' ? 'page' : undefined}
      >
        {t('guidance.nav.howItWorksShort', { defaultValue: 'How it works' })}
      </Link>
      <a
        href="/#voices"
        className={mobileNavClass(aboutActive)}
        onClick={() => setOpen(false)}
        aria-current={aboutActive ? 'page' : undefined}
      >
        {t('nav.aboutUs', { defaultValue: 'About Us' })}
      </a>
    </>
  )

  const guestCenterLinks = (
    <>
      <Link
        to="/explore"
        className={marketingLinkClass(exploreNavActive)}
        aria-current={exploreNavActive ? 'page' : undefined}
      >
        {t('nav.exploreMovements', { defaultValue: 'Explore Movements' })}
      </Link>
      <Link
        to="/discover?focus=nearby"
        className={marketingLinkClass(discoverNavActive)}
        aria-current={discoverNavActive ? 'page' : undefined}
      >
        {t('nav.discoverNearby', { defaultValue: 'Discover Nearby' })}
      </Link>
      <Link
        to="/impact"
        className={marketingLinkClass(impactNavActive)}
        aria-current={impactNavActive ? 'page' : undefined}
      >
        {t('nav.impactNav', { defaultValue: 'Impact' })}
      </Link>
      <Link
        to="/how-it-works"
        className={marketingLinkClass(location.pathname === '/how-it-works')}
        aria-current={location.pathname === '/how-it-works' ? 'page' : undefined}
      >
        {t('guidance.nav.howItWorksShort', { defaultValue: 'How it works' })}
      </Link>
      <a
        href="/#voices"
        className={marketingLinkClass(aboutActive)}
        aria-current={aboutActive ? 'page' : undefined}
      >
        {t('nav.aboutUs', { defaultValue: 'About Us' })}
      </a>
    </>
  )

  const guestMobileLinks = (
    <>
      {marketingMobileLinks}
      <Link to="/login" state={authReturnState} className="mobile-nav-link" onClick={() => setOpen(false)}>
        {t('nav.login')}
      </Link>
      <Link to="/signup" state={authReturnState} className="btn-primary mt-2 w-full" onClick={() => setOpen(false)}>
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

  const barLayoutClass = showMarketingCenterNav
    ? 'public-nav-bar lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-x-4 xl:gap-x-6'
    : ''

  const marketingAuthUtilities = signedIn ? (
    <>
      <Link
        to="/feed"
        className={`shrink-0 whitespace-nowrap inline-flex min-h-10 items-center justify-center ${
          isLovableHome ? 'lovable-nav-join' : 'btn-primary min-h-10! px-4! py-2!'
        }`}
      >
        {t('nav.myFeed')}
      </Link>
      <div className="public-nav-utilities flex shrink-0 items-center gap-1.5 border-l border-black/15 pl-3 dark:border-white/15 sm:pl-4">
        <ThemeQuickToggle variant={isLovableHome ? 'landing' : 'compact'} />
        <LanguageSwitcher variant={isLovableHome ? 'landing' : 'default'} />
      </div>
    </>
  ) : (
    <>
      <Link
        to="/login"
        state={authReturnState}
        className={
          isLovableHome
            ? 'lovable-nav-login shrink-0 whitespace-nowrap inline-flex min-h-10 items-center justify-center'
            : `${inactiveClass} shrink-0 text-secondary`
        }
      >
        {t('nav.login')}
      </Link>
      <Link
        to="/signup"
        state={authReturnState}
        className={
          isLovableHome
            ? 'lovable-nav-join shrink-0 whitespace-nowrap inline-flex min-h-10 items-center justify-center'
            : 'btn-primary shrink-0 whitespace-nowrap min-h-10! px-4! py-2!'
        }
      >
        {t('nav.joinMovement')}
      </Link>
      <div className="public-nav-utilities flex shrink-0 items-center gap-1.5 border-l border-black/15 pl-3 dark:border-white/15 sm:pl-4">
        <ThemeQuickToggle variant={isLovableHome ? 'landing' : 'compact'} />
        <LanguageSwitcher variant={isLovableHome ? 'landing' : 'default'} />
      </div>
    </>
  )

  return (
    <header className={isLovableHome ? 'nav-shell nav-shell-lovable' : 'nav-shell'}>
      <div
        className={`relative mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8 ${barLayoutClass}`}
      >
        <div
          className={
            showMarketingCenterNav
              ? 'public-nav-bar__brand min-w-0 max-lg:min-w-0 max-lg:flex-1 max-lg:basis-0 max-lg:overflow-hidden max-lg:pr-1 sm:max-lg:pr-2'
              : 'min-w-0 max-lg:min-w-0 max-lg:flex-1 max-lg:basis-0 max-lg:overflow-hidden max-lg:pr-1 sm:max-lg:pr-2 lg:justify-self-start'
          }
        >
          <Logo
            to={signedIn ? '/feed' : '/'}
            showTagline={isMarketingRoute && !signedIn}
            variant={isLovableHome ? 'lovable' : 'default'}
          />
        </div>

        {showMarketingCenterNav && (
          <nav
            className={[
              'public-nav-bar__center hidden shrink-0 flex-nowrap items-center justify-center gap-x-1 xl:gap-x-2 lg:flex',
              isLovableHome ? 'lovable-nav-main' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-label={t('nav.appNav')}
          >
            {guestCenterLinks}
          </nav>
        )}

        <nav
          className={
            showMarketingCenterNav
              ? 'public-nav-bar__end hidden shrink-0 items-center justify-end lg:flex'
              : 'hidden max-lg:ml-auto shrink-0 items-center md:flex lg:min-w-0 lg:justify-self-end lg:justify-end'
          }
          aria-label={t('nav.appNav')}
        >
          {showAppQuickLinks ? (
            <div className="flex flex-nowrap items-center justify-end gap-2 lg:gap-3">
              <div className="flex flex-nowrap items-center justify-end gap-x-1 gap-y-0 xl:gap-x-2">
                <Link to="/feed" className={`${inactiveClass} shrink-0`}>
                  {t('nav.myFeed')}
                </Link>
                <Link to="/impact-map" className={`${inactiveClass} shrink-0`}>
                  {t('nav.impactMap')}
                </Link>
                <Link to="/impact" className={`${inactiveClass} shrink-0`}>
                  {t('nav.impactPulse')}
                </Link>
                <Link to="/create" className={`${inactiveClass} shrink-0`}>
                  {t('nav.create')}
                </Link>
                <Link to="/profile" className={`${inactiveClass} shrink-0`}>
                  {t('nav.profile')}
                </Link>
              </div>
              <div className="public-nav-utilities flex shrink-0 items-center gap-1.5 border-l border-black/15 pl-3 dark:border-white/15">
                <ThemeQuickToggle variant="compact" />
                <LanguageSwitcher variant="default" />
              </div>
            </div>
          ) : showMarketingGuestActions ? (
            <div
              className={`public-nav-actions flex flex-nowrap items-center justify-end gap-2 sm:gap-3 ${isLovableHome ? 'lovable-nav-actions' : ''}`}
            >
              {marketingAuthUtilities}
            </div>
          ) : (
            <div className="public-nav-actions flex flex-nowrap items-center justify-end gap-2 sm:gap-3">
              <Link to="/login" state={authReturnState} className={`${inactiveClass} shrink-0 text-secondary`}>
                {t('nav.login')}
              </Link>
              <Link to="/signup" state={authReturnState} className="btn-primary shrink-0 whitespace-nowrap min-h-10! px-4! py-2!">
                {t('nav.joinMovement')}
              </Link>
              <div className="public-nav-utilities flex shrink-0 items-center gap-1.5 border-l border-black/15 pl-3 dark:border-white/15 sm:pl-4">
                <ThemeQuickToggle variant="compact" />
                <LanguageSwitcher variant="default" />
              </div>
            </div>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 md:hidden">
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
