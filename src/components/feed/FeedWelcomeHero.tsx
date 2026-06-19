import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Heart, Megaphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import CreateMovementCta from '../create/CreateMovementCta'
import type { FeedTab } from '../FeedTabs'
import { useAuth } from '../../hooks/useAuth'
import { useMovementFollows } from '../../hooks/useMovementFollows'

interface FeedWelcomeHeroProps {
  firstName?: string
  feedTab?: FeedTab
  chronological?: boolean
  userId?: string
}

export default function FeedWelcomeHero({
  firstName,
  feedTab = 'discover',
  chronological = false,
  userId,
}: FeedWelcomeHeroProps) {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const movementFollows = useMovementFollows(userId)
  const followingCount = movementFollows.followedIds.size

  const status = useMemo((): { icon: LucideIcon; title: string; subtitle: string } | null => {
    if (!movementFollows.loading && followingCount > 0) {
      return {
        icon: Heart,
        title:
          followingCount === 1
            ? t('feed.heroFollowingCountOne', { count: followingCount })
            : t('feed.heroFollowingCountMany', { count: followingCount }),
        subtitle: t('feed.heroFollowingHint'),
      }
    }
    if (profile?.youth_voice_id) {
      return {
        icon: Megaphone,
        title: t('feed.heroVoiceActive'),
        subtitle: t('feed.heroVoiceHint'),
      }
    }
    return null
  }, [movementFollows.loading, followingCount, profile?.youth_voice_id, t])

  const StatusIcon = status?.icon

  return (
    <header className="feed-header mb-6">
      <div className={`feed-header-grid${status ? '' : ' feed-header-grid--solo'}`}>
        <div className="feed-header-main min-w-0">
          <p className="app-brand-eyebrow">{t('landing.logoTagline')}</p>
          <h1 className="app-welcome-title mt-2">
            {firstName ? t('feed.greetingNamed', { name: firstName }) : t('feed.greeting')}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary sm:text-base">
            {chronological
              ? t('feed.memberChronologicalSubtitle', {
                  defaultValue:
                    'Every movement from the community, newest first. Post something and everyone signed in will see it right away.',
                })
              : feedTab === 'following'
                ? t('feed.memberFollowingSubtitle')
                : t('feed.memberDiscoverSubtitle')}
          </p>
          <CreateMovementCta className="mt-5 sm:w-auto" fullWidth />
        </div>

        {status && StatusIcon && (
          <div className="feed-hero-status" aria-label={status.title}>
            <span className="feed-hero-status-icon" aria-hidden>
              <StatusIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="feed-hero-status-title">{status.title}</p>
              <p className="feed-hero-status-subtitle">{status.subtitle}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
