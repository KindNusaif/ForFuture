import { Compass } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import PostFeed from '../components/PostFeed'
import { useAuthUser } from '../hooks/useAuthUser'

export default function Explore() {
  const { isMember, loading } = useAuthUser()

  if (!loading && isMember) {
    return <Navigate to="/feed" replace />
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="card-surface mb-8 p-6 text-center sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-sm font-semibold text-accent-700 ring-1 ring-accent-200/80">
          <Compass className="h-4 w-4" aria-hidden />
          Explore Youth Momentum
        </span>
        <h1 className="page-title mt-4 sm:text-4xl">Welcome to Youth Momentum</h1>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-600">
          Discover ideas, initiatives, voices, campaigns, and movements shaping a better future.
        </p>
        <p className="mt-3 text-sm font-medium text-slate-500">
          Browse freely — no account needed.{' '}
          <span className="text-accent-700">Join ForFuture to contribute.</span>
        </p>
      </header>

      <PostFeed mode="guest" showCreateButton={false} />
    </div>
  )
}
