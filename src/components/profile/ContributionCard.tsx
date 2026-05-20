import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import MovementTypeBadge from '../MovementTypeBadge'
import ContentOwnerMenu from '../content/ContentOwnerMenu'
import ShareButton from '../share/ShareButton'
import PostOwnerBadge from '../content/PostOwnerBadge'
import { getContributionStatus } from '../../lib/postOwnership'
import { isYouthVoicePost } from '../../lib/postIdentity'
import type { Post } from '../../types'

const PREVIEW_LEN = 140

const categoryColors: Record<string, string> = {
  Education: 'bg-blue-50/90 text-blue-800 ring-blue-200/80 dark:bg-blue-950/50 dark:text-blue-200',
  Environment: 'bg-emerald-50/90 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200',
  Health: 'bg-rose-50/90 text-rose-800 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200',
  Justice: 'bg-purple-50/90 text-purple-800 ring-purple-200/80 dark:bg-purple-950/50 dark:text-purple-200',
  Technology: 'bg-violet-50/90 text-violet-800 ring-violet-200/80 dark:bg-violet-950/50 dark:text-violet-200',
  Community: 'bg-amber-50/90 text-amber-900 ring-amber-200/80 dark:bg-amber-950/50 dark:text-amber-200',
  Economy: 'bg-orange-50/90 text-orange-900 ring-orange-200/80 dark:bg-orange-950/50 dark:text-orange-200',
  Other: 'bg-muted/90 text-secondary ring-default',
}

interface ContributionCardProps {
  post: Post
  onDelete: (post: Post) => void
}

export default function ContributionCard({ post, onDelete }: ContributionCardProps) {
  const { t } = useTranslation()
  const preview =
    post.description.length > PREVIEW_LEN
      ? `${post.description.slice(0, PREVIEW_LEN).trim()}…`
      : post.description

  const created = new Date(post.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const catClass = categoryColors[post.category] ?? categoryColors.Other
  const status = getContributionStatus(post)
  const isYouthVoice = isYouthVoicePost(post)
  const detailPath = `/feed/${post.id}`

  return (
    <article className="contribution-card card-surface relative min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <MovementTypeBadge movementType={post.movement_type} />
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${catClass}`}
          >
            {post.category}
          </span>
          <span
            className={
              status === 'closed'
                ? 'contribution-status contribution-status-closed'
                : 'contribution-status contribution-status-active'
            }
          >
            {status === 'closed' ? t('contentOwner.statusClosed') : t('contentOwner.statusActive')}
          </span>
          {isYouthVoice && <PostOwnerBadge />}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <ShareButton post={post} variant="icon" />
          <ContentOwnerMenu
            post={post}
            shareMode="member"
            detailPath={detailPath}
            onDelete={() => onDelete(post)}
          />
        </div>
      </div>

      <h4 className="wrap-user-text mt-3 text-base font-bold text-primary sm:text-lg">
        <Link to={detailPath} className="hover:text-accent-600 dark:hover:text-accent-400">
          {post.title}
        </Link>
      </h4>
      <p className="wrap-user-text mt-1 line-clamp-2 text-sm leading-relaxed text-secondary">
        {preview}
      </p>

      <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-default pt-3 text-xs text-muted">
        <time dateTime={post.created_at}>{created}</time>
        <span className="font-medium text-secondary">
          {isYouthVoice ? t('profile.postedAsYouthVoice') : t('profile.postedAsProfile')}
        </span>
        {(post.support_count ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 font-medium text-brand-700 dark:text-brand-400">
            <Heart className="h-3.5 w-3.5" aria-hidden />
            {post.support_count} {t('profile.engagements')}
          </span>
        )}
      </footer>
    </article>
  )
}
