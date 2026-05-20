import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getInspireExcerpt } from '../../lib/inspire'
import InspireCategoryBadge from './InspireCategoryBadge'
import InspireShareButton from './InspireShareButton'
import InspireSaveButton from './InspireSaveButton'
import type { InspirePost } from '../../types/inspire'

interface InspireCardProps {
  post: InspirePost
  detailPath: string
  currentUserId?: string
  commentCount?: number
  onSavedChange?: (postId: string, saved: boolean) => void
}

export default function InspireCard({
  post,
  detailPath,
  currentUserId,
  commentCount = 0,
  onSavedChange,
}: InspireCardProps) {
  const { t } = useTranslation()
  const excerpt = getInspireExcerpt(post.body)
  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <article className="card-surface inspire-card overflow-hidden p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <InspireCategoryBadge category={post.category} />
        <div className="flex items-center gap-1" data-no-card-nav>
          <InspireSaveButton
            postId={post.id}
            userId={currentUserId}
            saved={Boolean(post.saved_by_me)}
            onSavedChange={(saved) => onSavedChange?.(post.id, saved)}
          />
          <InspireShareButton post={post} />
        </div>
      </div>

      <h2 className="mt-3 text-lg font-bold leading-snug text-primary">
        <Link to={detailPath} className="transition hover:text-accent-700">
          {post.title}
        </Link>
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-secondary">{excerpt}</p>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">
            {post.author_display_name ?? t('inspire.anonymousAuthor', { defaultValue: 'Community member' })}
          </p>
          <time className="text-xs text-muted" dateTime={post.created_at}>
            {date}
          </time>
        </div>
        <Link
          to={detailPath}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted transition hover:bg-muted hover:text-primary"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          {commentCount > 0
            ? t('inspire.commentCount', { count: commentCount, defaultValue: '{{count}} comments' })
            : t('inspire.viewDiscussion', { defaultValue: 'View' })}
        </Link>
      </footer>
    </article>
  )
}
