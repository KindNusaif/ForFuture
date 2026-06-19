import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PostFeed, { type FeedToast } from '../components/PostFeed'
import FeedWelcomeHero from '../components/feed/FeedWelcomeHero'
import QuickStartPanel from '../components/guidance/QuickStartPanel'
import TrendingPanel from '../components/TrendingPanel'
import PageContainer from '../components/ui/PageContainer'
import { useAuth } from '../hooks/useAuth'
import { useAuthUser } from '../hooks/useAuthUser'
import { useToast } from '../hooks/useToast'

export default function Feed() {
  const { user } = useAuthUser()
  const { profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
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

  const firstName = profile?.display_name?.split(' ')[0]

  return (
    <PageContainer className="feed-page-container !py-6 lg:!py-8">
      <div className="feed-page-layout">
        <section className="feed-page-main min-w-0">
          <FeedWelcomeHero firstName={firstName} chronological userId={user?.id} />
          <QuickStartPanel />

          <PostFeed mode="member" userId={user?.id} showCreateButton={false} chronological />
        </section>
        <TrendingPanel />
      </div>
    </PageContainer>
  )
}
