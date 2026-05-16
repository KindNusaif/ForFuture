import type { ReactNode } from 'react'
import { Link, Outlet } from 'react-router-dom'
import PublicNav from './PublicNav'
import { useAuth } from '../hooks/useAuth'

export default function ExploreLayout({ children }: { children?: ReactNode }) {
  const { isMember } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="min-w-0 flex-1 pb-16 md:pb-0">
        {children ?? <Outlet />}
      </main>
      {!isMember && (
        <aside className="fixed inset-x-0 bottom-0 z-30 border-t border-accent-200/80 bg-accent-50/95 px-4 py-3 backdrop-blur-md md:hidden">
          <p className="text-center text-xs text-accent-900">
            Browsing as guest.{' '}
            <Link to="/signup" className="font-semibold underline hover:text-accent-700">
              Join ForFuture
            </Link>{' '}
            to contribute.
          </p>
        </aside>
      )}
    </div>
  )
}
