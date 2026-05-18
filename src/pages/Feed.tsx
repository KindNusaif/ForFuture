import { useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import PostFeed, { type FeedToast, type FeedTab } from '../components/PostFeed'
import CreateMovementCta from '../components/create/CreateMovementCta'
import TrendingPanel from '../components/TrendingPanel'
import PageContainer from '../components/ui/PageContainer'
import { useAuth } from '../hooks/useAuth'
import { useAuthUser } from '../hooks/useAuthUser'
import { useToast } from '../hooks/useToast'

function parseFeedTab(value: string | null): FeedTab {
  return value === 'following' ? 'following' : 'discover'
}

export default function Feed() {
  const { user } = useAuthUser()
  const { profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const feedTab = parseFeedTab(searchParams.get('tab'))

  const toast = useToast()

  useEffect(() => {
    const navToast = (location.state as { toast?: FeedToast })?.toast
    if (!navToast) return
    if (navToast.type === 'success') {
      toast.success(navToast.message, navToast.detail)
    } else {
      toast.error(navToast.message, navToast.detail)
    }
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, location.state, navigate, toast])

  function handleFeedTabChange(tab: FeedTab) {
    const next = new URLSearchParams(searchParams)
    if (tab === 'discover') {
      next.delete('tab')
    } else {
      next.set('tab', tab)
    }
    setSearchParams(next, { replace: true })
  }

  const firstName = profile?.display_name?.split(' ')[0]

  return (
    <PageContainer className="!py-6 lg:!py-8">
      <div className="flex gap-8">
        <section className="min-w-0 flex-1">
          <header className="feed-header mb-6">
            <p className="eyebrow">ForFuture</p>
            <h1 className="page-title mt-2">
              {firstName ? `Good to see you, ${firstName}` : 'Good to see you'}
            </h1>
            <p className="mt-2 text-secondary">
              {feedTab === 'following'
                ? 'Movements you are tracking — stay close to the causes you care about.'
                : 'What future do you want to help build today?'}
            </p>
            <CreateMovementCta className="mt-5 sm:w-auto" fullWidth />
          </header>

          <PostFeed
            mode="member"
            userId={user?.id}
            showCreateButton={false}
            feedTab={feedTab}
            onFeedTabChange={handleFeedTabChange}
          />
        </section>
        <TrendingPanel />
      </div>
    </PageContainer>
  )
}
