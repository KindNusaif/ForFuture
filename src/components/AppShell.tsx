import type { ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, PlusCircle, User, BarChart3, LogOut, Map, Shield, BadgeCheck, HeartHandshake, Activity } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useIsAdmin } from '../hooks/useIsAdmin'
import ThemeQuickToggle from './appearance/ThemeQuickToggle'
import LanguageSwitcher from './LanguageSwitcher'
import Logo from './Logo'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/auth'
import { isCreateMovementNavActive, isQuickPollNavActive } from '../lib/createNav'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-accent-50 text-accent-700 ring-1 ring-accent-200/80'
      : 'text-slate-600 hover:bg-slate-100 hover:text-accent-700'
  }`

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition ${
    isActive ? 'text-accent-600' : 'text-slate-500'
  }`

export default function AppShell({ children }: { children?: ReactNode }) {
  const { profile } = useAuth()
  const isAdmin = useIsAdmin()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  async function handleLogout() {
    try {
      await signOut()
    } finally {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="mx-auto flex max-w-7xl gap-0 lg:gap-8 lg:px-6 lg:py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-6 space-y-6">
            <div className="flex items-center justify-between gap-2">
              <Logo to="/feed" />
              <ThemeQuickToggle variant="compact" />
              <LanguageSwitcher variant="compact" />
            </div>
            <nav className="space-y-1" aria-label={t('nav.appNav')}>
              <NavLink to="/feed" end className={navLinkClass}>
                <Home className="h-5 w-5 shrink-0" aria-hidden />
                {t('nav.home')}
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
                Donation &amp; Relief
              </NavLink>
              <NavLink
                to="/create"
                className={() =>
                  navLinkClass({ isActive: isCreateMovementNavActive(location) })
                }
                aria-current={isCreateMovementNavActive(location) ? 'page' : undefined}
              >
                <PlusCircle className="h-5 w-5 shrink-0" aria-hidden />
                {t('nav.createMovement')}
              </NavLink>
              <NavLink
                to="/create?type=quick_youth_poll"
                className={() => navLinkClass({ isActive: isQuickPollNavActive(location) })}
                aria-current={isQuickPollNavActive(location) ? 'page' : undefined}
              >
                <BarChart3 className="h-5 w-5 shrink-0" aria-hidden />
                {t('nav.quickPolls')}
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
              <div className="rounded-2xl border border-accent-200/80 bg-linear-to-br from-accent-50/80 to-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-accent-600">
                  {t('voice.yourYouthVoiceId')}
                </p>
                <p className="mt-1.5 font-mono text-sm font-bold text-accent-900">
                  {profile.youth_voice_id ?? '—'}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                  {t('voice.youthVoiceHint')}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden />
              {t('nav.logout')}
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex justify-end px-4 pt-3 lg:hidden">
            <LanguageSwitcher variant="compact" />
          </div>
          {children ?? <Outlet />}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-nav px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-lg lg:hidden"
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
            to="/create?type=quick_youth_poll"
            className={() => mobileLinkClass({ isActive: isQuickPollNavActive(location) })}
            aria-current={isQuickPollNavActive(location) ? 'page' : undefined}
          >
            <BarChart3 className="h-5 w-5" />
            {t('nav.polls')}
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
