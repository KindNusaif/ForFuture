import { Bell, BellRing, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface FollowMovementButtonProps {
  isFollowing: boolean
  loading?: boolean
  disabled?: boolean
  compact?: boolean
  followerCount?: number
  onClick: () => void
  className?: string
}

export default function FollowMovementButton({
  isFollowing,
  loading = false,
  disabled = false,
  compact = false,
  followerCount,
  onClick,
  className = '',
}: FollowMovementButtonProps) {
  const { t } = useTranslation()
  const showCount = followerCount != null && followerCount > 0

  return (
    <div className={`flex flex-col items-end gap-0.5 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className={
          isFollowing
            ? `inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-accent-500/40 bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-accent-400/30 dark:bg-accent-600 dark:hover:bg-accent-500 ${
                compact ? 'min-h-8 px-2.5' : ''
              }`
            : `btn-secondary min-h-9 gap-1.5 px-3 py-1.5 text-xs font-semibold ${compact ? 'min-h-8! px-2.5!' : ''}`
        }
        aria-pressed={isFollowing}
        aria-busy={loading}
        aria-label={
          isFollowing
            ? t('follow.unfollowAria', { defaultValue: 'Unfollow this movement' })
            : t('follow.followAria', { defaultValue: 'Follow this movement' })
        }
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
        ) : isFollowing ? (
          <BellRing className="h-3.5 w-3.5 shrink-0" aria-hidden />
        ) : (
          <Bell className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        )}
        <span>{isFollowing ? t('follow.following') : t('follow.follow')}</span>
      </button>
      {showCount && (
        <span className="text-[10px] font-medium text-muted" aria-live="polite">
          {t('follow.trackingCount', { count: followerCount })}
        </span>
      )}
    </div>
  )
}
