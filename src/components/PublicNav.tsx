import { Link } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ThemeQuickToggle from './appearance/ThemeQuickToggle'
import LanguageSwitcher from './LanguageSwitcher'
import Logo from './Logo'
import { useAuth } from '../hooks/useAuth'

const linkClass = 'public-nav-link'

export default function PublicNav() {
  const [open, setOpen] = useState(false)
  const { isMember, loading } = useAuth()
  const { t } = useTranslation()

  const memberLinks = (
    <>
      <Link to="/feed" className={linkClass}>
        {t('nav.myFeed')}
      </Link>
      <Link to="/impact-map" className={linkClass}>
        {t('nav.impactMap')}
      </Link>
      <Link to="/impact" className={linkClass}>
        {t('nav.impactPulse')}
      </Link>
      <Link to="/create" className={linkClass}>
        {t('nav.create')}
      </Link>
      <Link to="/profile" className={linkClass}>
        {t('nav.profile')}
      </Link>
    </>
  )

  const guestCenterLinks = (
    <>
      <Link to="/explore" className={linkClass}>
        {t('nav.movements')}
      </Link>
      <Link to="/impact" className={linkClass}>
        {t('nav.impactNav')}
      </Link>
      <Link to="/explore" className={linkClass}>
        {t('nav.exploreShort')}
      </Link>
      <a href="/#why-forfuture" className={linkClass}>
        {t('nav.about')}
      </a>
    </>
  )

  const guestMobileLinks = (
    <>
      <Link to="/explore" className="block rounded-lg px-3 py-2.5 text-sm font-medium" onClick={() => setOpen(false)}>
        {t('nav.movements')}
      </Link>
      <Link to="/impact" className="block rounded-lg px-3 py-2.5 text-sm font-medium" onClick={() => setOpen(false)}>
        {t('nav.impactNav')}
      </Link>
      <Link to="/explore" className="block rounded-lg px-3 py-2.5 text-sm font-medium" onClick={() => setOpen(false)}>
        {t('nav.exploreShort')}
      </Link>
      <a href="/#why-forfuture" className="block rounded-lg px-3 py-2.5 text-sm font-medium" onClick={() => setOpen(false)}>
        {t('nav.about')}
      </a>
      <Link to="/login" className="block rounded-lg px-3 py-2.5 text-sm font-medium" onClick={() => setOpen(false)}>
        {t('nav.login')}
      </Link>
      <Link to="/signup" className="btn-primary mt-2 w-full" onClick={() => setOpen(false)}>
        {t('nav.joinMovement')}
      </Link>
    </>
  )

  return (
    <header className="nav-shell">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo to={isMember ? '/feed' : '/'} showTagline={!isMember} />

        {!loading && !isMember && (
          <nav
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex"
            aria-label={t('nav.appNav')}
          >
            {guestCenterLinks}
          </nav>
        )}

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label={t('nav.appNav')}>
          {loading ? null : isMember ? (
            memberLinks
          ) : (
            <>
              <Link
                to="/explore"
                className="rounded-lg p-2 text-secondary transition hover:bg-muted hover:text-primary"
                aria-label={t('nav.searchExplore')}
              >
                <Search className="h-5 w-5" aria-hidden />
              </Link>
              <Link to="/login" className={linkClass}>
                {t('nav.login')}
              </Link>
              <Link to="/signup" className="btn-primary !min-h-[40px] !px-4 !py-2">
                {t('nav.joinMovement')}
              </Link>
            </>
          )}
          <ThemeQuickToggle variant="compact" className="ml-1" />
          <LanguageSwitcher variant="landing" className="ml-1" />
        </nav>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          {!loading && !isMember && (
            <Link
              to="/explore"
              className="rounded-lg p-2 text-secondary ring-1 ring-default hover:bg-muted"
              aria-label={t('nav.searchExplore')}
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
          {!loading && isMember ? (
            <>
              <Link to="/feed" className="block rounded-lg px-3 py-2.5 text-sm font-medium" onClick={() => setOpen(false)}>
                {t('nav.myFeed')}
              </Link>
              <Link to="/impact-map" className="block rounded-lg px-3 py-2.5 text-sm font-medium" onClick={() => setOpen(false)}>
                {t('nav.impactMap')}
              </Link>
              <Link to="/impact" className="block rounded-lg px-3 py-2.5 text-sm font-medium" onClick={() => setOpen(false)}>
                {t('nav.impactPulse')}
              </Link>
              <Link to="/create" className="block rounded-lg px-3 py-2.5 text-sm font-medium" onClick={() => setOpen(false)}>
                {t('nav.create')}
              </Link>
              <Link to="/profile" className="block rounded-lg px-3 py-2.5 text-sm font-medium" onClick={() => setOpen(false)}>
                {t('nav.profile')}
              </Link>
            </>
          ) : (
            guestMobileLinks
          )}
        </nav>
      )}
    </header>
  )
}
