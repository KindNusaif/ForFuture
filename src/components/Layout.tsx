import { Outlet } from 'react-router-dom'
import PublicNav from './PublicNav'
import LandingFooter from './landing/LandingFooter'
import SkipLink from './SkipLink'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <PublicNav />
      <main id="main-content" className="min-w-0 flex-1 page-enter">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  )
}
