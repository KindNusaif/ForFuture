import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import PostFeed, { type FeedToast } from '../components/PostFeed'
import TrendingPanel from '../components/TrendingPanel'
import { useAuth } from '../hooks/useAuth'
import { useAuthUser } from '../hooks/useAuthUser'

export default function Feed() {
  const { user } = useAuthUser()
  const { profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [toast, setToast] = useState<FeedToast | null>(
    (location.state as { toast?: FeedToast })?.toast ?? null,
  )

  useEffect(() => {
    if ((location.state as { toast?: FeedToast })?.toast) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate])

  const firstName = profile?.display_name?.split(' ')[0] ?? 'changemaker'

  return (
    <div className="px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto flex max-w-7xl gap-8">
        <section className="min-w-0 flex-1">
          <header className="mb-6 card-surface overflow-hidden p-6 sm:p-8">
            <p className="eyebrow">ForFuture</p>
            <h1 className="page-title mt-2">
              Good to see you, {firstName}
            </h1>
            <p className="mt-2 text-secondary">
              What future do you want to help build today?
            </p>
            <Link
              to="/create"
              className="btn-primary mt-5 inline-flex w-full sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              Create a Youth Movement
            </Link>
          </header>

          <PostFeed
            mode="member"
            userId={user?.id}
            toast={toast}
            onToastDismiss={() => setToast(null)}
            showCreateButton={false}
          />
        </section>
        <TrendingPanel />
      </div>
    </div>
  )
}
