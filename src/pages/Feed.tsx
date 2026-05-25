import { useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import PostFeed, { type FeedToast, type FeedTab } from '../components/PostFeed'
import FeedWelcomeHero from '../components/feed/FeedWelcomeHero'
import QuickStartPanel from '../components/guidance/QuickStartPanel'
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
    <PageContainer className="feed-page-container !py-6 lg:!py-8">
      <div className="feed-page-layout">
        <section className="feed-page-main min-w-0">
          <FeedWelcomeHero firstName={firstName} feedTab={feedTab} userId={user?.id} />
          <QuickStartPanel />

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
