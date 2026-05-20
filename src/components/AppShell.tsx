import type { ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  PlusCircle,
  User,
  BarChart3,
  Loader2,
  LogOut,
  Map,
  Shield,
  BadgeCheck,
  HeartHandshake,
  Activity,
  Sparkles,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useIsAdmin } from '../hooks/useIsAdmin'
import ThemeQuickToggle from './appearance/ThemeQuickToggle'
import LanguageSwitcher from './LanguageSwitcher'
import Logo from './Logo'
import NotificationCenter from './notifications/NotificationCenter'
import SkipLink from './SkipLink'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import {
  isCommunityPollsNavActive,
  isCreateMovementNavActive,
  isQuickPollNavActive,
} from '../lib/createNav'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-link nav-link-active' : 'nav-link'

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition ${
    isActive ? 'text-accent-400' : 'text-muted'
  }`

export default function AppShell({ children }: { children?: ReactNode }) {
  const { profile, logout, loggingOut } = useAuth()
  const isAdmin = useIsAdmin()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const toast = useToast()

  async function handleLogout() {
    if (loggingOut) return
    try {
      await logout()
      navigate('/', { replace: true })
    } catch {
      navigate('/', { replace: true })
      toast.error(
        t('auth.logoutFailed', {
          defaultValue: "We couldn't log you out. Please try again.",
        }),
      )
    }
  }

  return (
    <div className="app-shell min-h-screen pb-20 lg:pb-0">
      <SkipLink />
      <div className="mx-auto flex max-w-7xl gap-0 lg:gap-8 lg:px-6 lg:py-6">
        <aside className="app-sidebar hidden w-56 shrink-0 lg:block">
          <div className="app-sidebar-inner">
            <header className="app-sidebar-header">
              <Logo to="/feed" iconOnly className="app-sidebar-brand shrink-0" />
              <div className="app-sidebar-utilities">
                <NotificationCenter />
                <ThemeQuickToggle variant="compact" className="shrink-0" />
                <LanguageSwitcher variant="sidebar" className="shrink-0" />
              </div>
            </header>

            <div className="app-sidebar-scroll">
              <nav className="app-sidebar-nav space-y-1" aria-label={t('nav.appNav')}>
                <NavLink to="/feed" end className={navLinkClass}>
                  <Home className="h-5 w-5 shrink-0" aria-hidden />
                  {t('nav.home')}
                </NavLink>
                <p className="nav-section-label px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                  {t('nav.exploreSection', { defaultValue: 'Explore' })}
                </p>
                <NavLink to="/inspire" className={navLinkClass}>
                  <Sparkles className="h-5 w-5 shrink-0" aria-hidden />
                  {t('nav.inspireHub', { defaultValue: 'Inspire Hub' })}
                </NavLink>
                <NavLink to="/impact-map" className={navLinkClass}>
                  <Map className="h-5 w-5 shrink-0" aria-hidden />
                  {t('nav.impactMap')}
                </NavLink>
                <NavLink to="/impact" className={navLinkClass}>
                  <Activity className="h-5 w-5 shrink-0" aria-hidden />
                  {t('nav.impactPulse')}
                </NavLink>
                <NavLink to="/relief" className={navLinkClass}>
                  <HeartHandshake className="h-5 w-5 shrink-0" aria-hidden />
                  {t('nav.relief')}
                </NavLink>
                <NavLink
                  to="/create"
                  className={() =>
                    navLinkClass({
                      isActive:
                        isCreateMovementNavActive(location) || isQuickPollNavActive(location),
                    })
                  }
                  aria-current={
                    isCreateMovementNavActive(location) || isQuickPollNavActive(location)
                      ? 'page'
                      : undefined
                  }
                >
                  <PlusCircle className="h-5 w-5 shrink-0" aria-hidden />
                  {t('nav.createMovement')}
                </NavLink>
                <NavLink
                  to="/polls"
                  className={() =>
                    navLinkClass({
                      isActive:
                        isCommunityPollsNavActive(location) && !isQuickPollNavActive(location),
                    })
                  }
                  aria-current={
                    isCommunityPollsNavActive(location) && !isQuickPollNavActive(location)
                      ? 'page'
                      : undefined
                  }
                >
                  <BarChart3 className="h-5 w-5 shrink-0" aria-hidden />
                  {t('nav.communityPolls')}
                </NavLink>
                <NavLink to="/profile" className={navLinkClass}>
                  <User className="h-5 w-5 shrink-0" aria-hidden />
                  {t('nav.myProfile')}
                </NavLink>
                {isAdmin && (
                  <>
                    <NavLink to="/admin/moderation" className={navLinkClass}>
                      <Shield className="h-5 w-5 shrink-0" aria-hidden />
                      {t('nav.moderation')}
                    </NavLink>
                    <NavLink to="/admin/trust-review" className={navLinkClass}>
                      <BadgeCheck className="h-5 w-5 shrink-0" aria-hidden />
                      Trust review
                    </NavLink>
                  </>
                )}
              </nav>

              {profile && (
                <div className="voice-id-card app-sidebar-voice mt-5 p-4">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: 'var(--ff-voice-card-title)' }}
                  >
                    {t('voice.yourYouthVoiceId')}
                  </p>
                  <p
                    className="mt-2 font-mono text-sm font-bold leading-snug"
                    style={{ color: 'var(--ff-voice-card-id)' }}
                  >
                    {profile.youth_voice_id ?? '—'}
                  </p>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-secondary">
                    {t('voice.youthVoiceHint')}
                  </p>
                </div>
              )}
            </div>

            <footer className="app-sidebar-footer">
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                aria-busy={loggingOut}
                className="app-sidebar-logout nav-link w-full disabled:pointer-events-none disabled:opacity-60"
              >
                {loggingOut ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <LogOut className="h-5 w-5 shrink-0" aria-hidden />
                )}
                {loggingOut
                  ? t('auth.loggingOut', { defaultValue: 'Logging out…' })
                  : t('nav.logout')}
              </button>
            </footer>
          </div>
        </aside>

        <main id="main-content" className="min-w-0 flex-1 page-enter">
          <header className="mb-4 flex items-center justify-between gap-2 border-b border-default px-4 py-3 lg:hidden">
            <Logo to="/feed" iconOnly className="shrink-0" />
            <div className="flex shrink-0 items-center gap-1.5">
              <NotificationCenter />
              <ThemeQuickToggle variant="compact" />
              <LanguageSwitcher variant="compact" />
            </div>
          </header>
          {children ?? <Outlet />}
        </main>
      </div>

      <nav
        className="app-mobile-nav fixed inset-x-0 bottom-0 z-40 border-t px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-lg lg:hidden"
        aria-label={t('nav.mobileNav')}
      >
        <div className="mx-auto flex max-w-lg justify-between">
          <NavLink to="/feed" end className={mobileLinkClass}>
            <Home className="h-5 w-5" />
            {t('nav.home')}
          </NavLink>
          <NavLink to="/impact-map" className={mobileLinkClass}>
            <Map className="h-5 w-5" />
            {t('nav.map')}
          </NavLink>
          <NavLink
            to="/create"
            className={() =>
              mobileLinkClass({ isActive: isCreateMovementNavActive(location) })
            }
            aria-current={isCreateMovementNavActive(location) ? 'page' : undefined}
          >
            <PlusCircle className="h-5 w-5" />
            {t('nav.create')}
          </NavLink>
          <NavLink
            to="/polls"
            className={() => mobileLinkClass({ isActive: isCommunityPollsNavActive(location) })}
            aria-current={isCommunityPollsNavActive(location) ? 'page' : undefined}
          >
            <BarChart3 className="h-5 w-5" />
            {t('nav.communityPollsShort', { defaultValue: 'Polls' })}
          </NavLink>
          <NavLink to="/profile" className={mobileLinkClass}>
            <User className="h-5 w-5" />
            {t('nav.profile')}
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
