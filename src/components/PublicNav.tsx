import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
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
  isMarketingHowItWorksActive,
  isMarketingImpactActive,
} from '../lib/marketingNav'
import { authStateFromPath, buildAuthReturn } from '../lib/authReturn'

function navLinkClass(active: boolean): string {
  return active ? 'public-nav-link public-nav-link--active' : 'public-nav-link'
}

function mobileNavClass(isActive: boolean): string {
  return isActive ? 'mobile-nav-link mobile-nav-link-active' : 'mobile-nav-link'
}

export default function PublicNav() {
  const [open, setOpen] = useState(false)
  const { isMember, loading, loggingOut } = useAuth()
  const { t } = useTranslation()
  const menuPanelId = useId()
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
  const howItWorksActive = isMarketingHowItWorksActive(location.pathname)
  const aboutActive = isMarketingAboutActive(location.pathname, location.hash)

  const isLovableHome = location.pathname === '/'
  const isMarketingRoute = isPublicMarketingRoute(location.pathname)
  const authReady = !loading && !loggingOut
  const signedIn = authReady && isMember
  const showMarketingCenterNav = isMarketingRoute
  const showAppQuickLinks = !isMarketingRoute && authReady && signedIn
  const showMarketingGuestActions = isMarketingRoute
  const showLaptopMenu = showMarketingCenterNav

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const marketingNavLinks = (
    <>
      <Link
        to="/explore"
        className={navLinkClass(exploreNavActive)}
        aria-current={exploreNavActive ? 'page' : undefined}
      >
        {t('nav.exploreMovements', { defaultValue: 'Explore Movements' })}
      </Link>
      <Link
        to="/discover?focus=nearby"
        className={navLinkClass(discoverNavActive)}
        aria-current={discoverNavActive ? 'page' : undefined}
      >
        {t('nav.discoverNearby', { defaultValue: 'Discover Nearby' })}
      </Link>
      <Link
        to="/impact"
        className={navLinkClass(impactNavActive)}
        aria-current={impactNavActive ? 'page' : undefined}
      >
        {t('nav.impactNav', { defaultValue: 'Impact' })}
      </Link>
      <Link
        to="/how-it-works"
        className={navLinkClass(howItWorksActive)}
        aria-current={howItWorksActive ? 'page' : undefined}
      >
        {t('guidance.nav.howItWorksShort', { defaultValue: 'How it works' })}
      </Link>
      <a
        href="/#voices"
        className={navLinkClass(aboutActive)}
        aria-current={aboutActive ? 'page' : undefined}
      >
        {t('nav.aboutUs', { defaultValue: 'About Us' })}
      </a>
    </>
  )

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
        className={mobileNavClass(howItWorksActive)}
        onClick={() => setOpen(false)}
        aria-current={howItWorksActive ? 'page' : undefined}
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

  const marketingDrawerAuth = signedIn ? (
    <Link to="/feed" className="btn-primary mt-1 w-full" onClick={() => setOpen(false)}>
      {t('nav.myFeed')}
    </Link>
  ) : (
    <>
      <Link
        to="/login"
        state={authReturnState}
        className="mobile-nav-link"
        onClick={() => setOpen(false)}
      >
        {t('nav.login')}
      </Link>
      <Link
        to="/signup"
        state={authReturnState}
        className="btn-primary mt-1 w-full"
        onClick={() => setOpen(false)}
      >
        {t('nav.joinMovement')}
      </Link>
    </>
  )

  const joinButtonClass = isLovableHome
    ? 'public-nav-join lovable-nav-join'
    : 'public-nav-join btn-primary min-h-10! px-4! py-2!'

  const loginButtonClass = isLovableHome
    ? 'public-nav-login lovable-nav-login'
    : 'public-nav-login'

  const desktopAuthActions = showAppQuickLinks ? (
    <div className="public-nav-auth">
      <Link to="/feed" className={navLinkClass(false)}>
        {t('nav.myFeed')}
      </Link>
      <Link to="/impact-map" className={navLinkClass(false)}>
        {t('nav.impactMap')}
      </Link>
      <Link to="/impact" className={navLinkClass(impactNavActive)}>
        {t('nav.impactPulse')}
      </Link>
      <Link to="/create" className={navLinkClass(false)}>
        {t('nav.create')}
      </Link>
      <Link to="/profile" className={navLinkClass(false)}>
        {t('nav.profile')}
      </Link>
    </div>
  ) : signedIn ? (
    <div className="public-nav-auth">
      <Link
        to="/feed"
        className={isLovableHome ? joinButtonClass : 'public-nav-join btn-primary min-h-10! px-4! py-2!'}
      >
        {t('nav.myFeed')}
      </Link>
    </div>
  ) : (
    <div className="public-nav-auth">
      <Link to="/login" state={authReturnState} className={loginButtonClass}>
        {t('nav.login')}
      </Link>
      <Link to="/signup" state={authReturnState} className={joinButtonClass}>
        <span className="public-nav-join-label-long">{t('nav.joinMovement')}</span>
        <span className="public-nav-join-label-short">{t('nav.signup')}</span>
      </Link>
    </div>
  )

  const utilities = (
    <div className="public-nav-utilities">
      <ThemeQuickToggle variant={isLovableHome ? 'landing' : 'compact'} />
      <LanguageSwitcher variant={isLovableHome ? 'landing' : 'default'} />
    </div>
  )

  const mobileLogoTo = signedIn ? '/feed' : '/'

  const drawerContent = showAppQuickLinks ? (
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
    <>
      {marketingMobileLinks}
      <div className="public-nav-drawer-divider" aria-hidden />
      {marketingDrawerAuth}
      {signedIn ? (
        <Link to="/profile" className="mobile-nav-link" onClick={() => setOpen(false)}>
          {t('nav.profile')}
        </Link>
      ) : null}
    </>
  ) : (
    <>
      {marketingMobileLinks}
      <div className="public-nav-drawer-divider" aria-hidden />
      <Link to="/login" state={authReturnState} className="mobile-nav-link" onClick={() => setOpen(false)}>
        {t('nav.login')}
      </Link>
      <Link to="/signup" state={authReturnState} className="btn-primary mt-1 w-full" onClick={() => setOpen(false)}>
        {t('nav.joinMovement')}
      </Link>
    </>
  )

  return (
    <header className={isLovableHome ? 'nav-shell nav-shell-lovable' : 'nav-shell'}>
      <div className="public-nav-bar">
        <div className="public-nav-mobile-row">
          <Logo
            to={mobileLogoTo}
            showTagline={false}
            variant={isLovableHome ? 'lovable' : 'default'}
            className="public-nav-logo min-w-0 shrink"
          />
          <div className="public-nav-mobile-controls">
            <ThemeQuickToggle variant="compact" />
            <LanguageSwitcher variant="compact" />
            <button
              type="button"
              className="public-nav-mobile-menu"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? t('nav.closeMenu', { defaultValue: 'Close menu' }) : t('nav.menu')}
              aria-expanded={open}
              aria-controls={menuPanelId}
            >
              {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>

        <div className="public-nav-grid">
          <div className="public-nav-brand">
            <Logo
              to={mobileLogoTo}
              showTagline={isMarketingRoute && !signedIn}
              variant={isLovableHome ? 'lovable' : 'default'}
              className="public-nav-logo"
            />
          </div>

          {showMarketingCenterNav ? (
            <nav
              className="public-nav-center"
              aria-label={t('nav.appNav', { defaultValue: 'Main navigation' })}
            >
              {marketingNavLinks}
            </nav>
          ) : (
            <div className="min-w-0" aria-hidden />
          )}

          <div className="public-nav-end">
            {showLaptopMenu ? (
              <button
                type="button"
                className="public-nav-menu-btn public-nav-menu-btn--show"
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? t('nav.closeMenu', { defaultValue: 'Close menu' }) : t('nav.menu')}
                aria-expanded={open}
                aria-controls={menuPanelId}
              >
                {t('nav.menu')}
              </button>
            ) : null}
            {showMarketingGuestActions || showAppQuickLinks ? (
              <>
                {desktopAuthActions}
                {utilities}
              </>
            ) : (
              <>
                <div className="public-nav-auth">
                  <Link to="/login" state={authReturnState} className="public-nav-login">
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/signup"
                    state={authReturnState}
                    className="public-nav-join btn-primary min-h-10! px-4! py-2!"
                  >
                    <span className="public-nav-join-label-long">{t('nav.joinMovement')}</span>
                    <span className="public-nav-join-label-short">{t('nav.signup')}</span>
                  </Link>
                </div>
                <div className="public-nav-utilities">
                  <ThemeQuickToggle variant={isLovableHome ? 'landing' : 'compact'} />
                  <LanguageSwitcher variant={isLovableHome ? 'landing' : 'default'} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="public-nav-drawer-wrap">
        <nav
          id={menuPanelId}
          className={`public-nav-drawer${open ? ' public-nav-drawer--open' : ''}`}
          aria-label={t('nav.mobileNav')}
          hidden={!open}
        >
          {drawerContent}
        </nav>
      </div>
    </header>
  )
}
