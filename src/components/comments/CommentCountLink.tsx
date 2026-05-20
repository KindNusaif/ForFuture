import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { canPostHaveComments } from '../../lib/commentEligibility'
import type { Post } from '../../types'

interface CommentCountLinkProps {
  post: Post
  count?: number
  detailPath?: string
  /** When true, scroll to the discussion section on the current page. */
  onPage?: boolean
}

export default function CommentCountLink({
  post,
  count = 0,
  detailPath,
  onPage = false,
}: CommentCountLinkProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (!canPostHaveComments(post) || (!detailPath && !onPage)) return null

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (onPage) {
      document.getElementById('discussion-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (detailPath) navigate(`${detailPath}#discussion-heading`)
  }

  return (
    <button
      type="button"
      data-no-card-nav
      className="comment-count-link inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-muted transition hover:bg-muted hover:text-primary"
      onClick={handleClick}
      aria-label={t('comments.viewDiscussion', {
        defaultValue: '{{count}} comments — view discussion',
        count,
      })}
    >
      <MessageCircle className="h-4 w-4" aria-hidden />
      <span>{count > 0 ? count : t('comments.comment', { defaultValue: 'Comment' })}</span>
    </button>
  )
}
