import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo'
import { useAuth } from '../hooks/useAuth'

const linkClass =
  'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-accent-700'

export default function PublicNav() {
  const [open, setOpen] = useState(false)
  const { isMember, loading } = useAuth()

  const memberLinks = (
    <>
      <Link to="/feed" className={linkClass}>
        My Feed
      </Link>
      <Link to="/impact-map" className={linkClass}>
        Impact Map
      </Link>
      <Link to="/create" className={linkClass}>
        Create
      </Link>
      <Link to="/profile" className={linkClass}>
        Profile
      </Link>
    </>
  )

  const guestLinks = (
    <>
      <Link to="/" className={linkClass}>
        Home
      </Link>
      <Link to="/explore" className={linkClass}>
        Explore Youth Momentum
      </Link>
      <Link to="/impact-map" className={linkClass}>
        Impact Map
      </Link>
      <a href="/#why-forfuture" className={linkClass}>
        About
      </a>
      <Link to="/login" className={linkClass}>
        Log in
      </Link>
      <Link to="/signup" className="btn-primary !min-h-[40px] !px-4 !py-2">
        Join ForFuture
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo to={isMember ? '/feed' : '/'} showTagline />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {!loading && isMember ? memberLinks : guestLinks}
        </nav>

        <button
          type="button"
          className="rounded-xl p-2.5 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="space-y-1 border-t border-slate-200 px-4 py-4 md:hidden">
          {!loading && isMember ? (
            <>
              <Link
                to="/feed"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                My Feed
              </Link>
              <Link
                to="/impact-map"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                Impact Map
              </Link>
              <Link
                to="/create"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                Create
              </Link>
              <Link
                to="/profile"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/explore"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                Explore Youth Momentum
              </Link>
              <Link
                to="/impact-map"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                Impact Map
              </Link>
              <a
                href="/#why-forfuture"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                About
              </a>
              <Link
                to="/login"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="btn-primary mt-2 w-full"
                onClick={() => setOpen(false)}
              >
                Join ForFuture
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
