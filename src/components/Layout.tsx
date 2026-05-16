import { Outlet } from 'react-router-dom'
import PublicNav from './PublicNav'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200/80 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <p className="text-sm font-semibold text-accent-800">
            ForFuture — Youth Voices. Real Action. A Better Tomorrow.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Speak freely. Organize boldly. Build the future together.
          </p>
        </div>
      </footer>
    </div>
  )
}
