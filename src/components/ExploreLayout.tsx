import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import PublicNav from './PublicNav'
import PublicFooter from './PublicFooter'
import SkipLink from './SkipLink'

export default function ExploreLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <PublicNav />
      <main id="main-content" className="min-w-0 flex-1 page-enter">
        {children ?? <Outlet />}
      </main>
      <PublicFooter />
    </div>
  )
}
