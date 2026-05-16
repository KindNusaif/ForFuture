import type { ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, PlusCircle, User, BarChart3, LogOut, Map } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/auth'

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
  const navigate = useNavigate()

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
            <Logo to="/feed" />
            <nav className="space-y-1" aria-label="App navigation">
              <NavLink to="/feed" end className={navLinkClass}>
                <Home className="h-5 w-5 shrink-0" aria-hidden />
                Home
              </NavLink>
              <NavLink to="/impact-map" className={navLinkClass}>
                <Map className="h-5 w-5 shrink-0" aria-hidden />
                Impact Map
              </NavLink>
              <NavLink to="/create" className={navLinkClass}>
                <PlusCircle className="h-5 w-5 shrink-0" aria-hidden />
                Create a Youth Movement
              </NavLink>
              <NavLink to="/create?type=quick_youth_poll" className={navLinkClass}>
                <BarChart3 className="h-5 w-5 shrink-0" aria-hidden />
                Quick Polls
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                <User className="h-5 w-5 shrink-0" aria-hidden />
                My Profile
              </NavLink>
            </nav>
            {profile && (
              <div className="rounded-2xl border border-accent-200/80 bg-linear-to-br from-accent-50/80 to-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-accent-600">
                  Your Youth Voice ID
                </p>
                <p className="mt-1.5 font-mono text-sm font-bold text-accent-900">
                  {profile.youth_voice_id ?? '—'}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                  Speak publicly without revealing your profile identity.
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden />
              Log out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {children ?? <Outlet />}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-lg lg:hidden"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto flex max-w-lg justify-between">
          <NavLink to="/feed" end className={mobileLinkClass}>
            <Home className="h-5 w-5" />
            Home
          </NavLink>
          <NavLink to="/impact-map" className={mobileLinkClass}>
            <Map className="h-5 w-5" />
            Map
          </NavLink>
          <NavLink to="/create" className={mobileLinkClass}>
            <PlusCircle className="h-5 w-5" />
            Create
          </NavLink>
          <NavLink to="/create?type=quick_youth_poll" className={mobileLinkClass}>
            <BarChart3 className="h-5 w-5" />
            Polls
          </NavLink>
          <NavLink to="/profile" className={mobileLinkClass}>
            <User className="h-5 w-5" />
            Profile
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
