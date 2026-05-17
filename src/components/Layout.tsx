import { Outlet } from 'react-router-dom'
import PublicNav from './PublicNav'
import LandingFooter from './landing/LandingFooter'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  )
}
