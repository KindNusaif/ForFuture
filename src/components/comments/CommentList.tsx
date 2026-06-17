import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CommentListSkeleton } from '../Skeleton'
import CommentItem from './CommentItem'
import type { Comment } from '../../lib/comments'

interface CommentListProps {
  comments: Comment[]
  loading: boolean
  error: string | null
  currentUserId?: string
  onDeleted: (commentId: string) => void
  onUpdated: (comment: Comment) => void
}

export default function CommentList({
  comments,
  loading,
  error,
  currentUserId,
  onDeleted,
  onUpdated,
}: CommentListProps) {
  const { t } = useTranslation()

  if (loading && comments.length === 0) {
    return <CommentListSkeleton />
  }

  if (error) {
    return (
      <p className="comment-list-state text-sm text-red-600 dark:text-red-400" role="alert">
        {error}
      </p>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="comment-list-state flex flex-col items-center gap-2 py-6 text-center" role="status">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-secondary"
          aria-hidden
        >
          <MessageCircle className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-primary">
          {t('comments.emptyTitle', { defaultValue: 'No comments yet' })}
        </p>
        <p className="max-w-xs text-sm text-secondary">
          {t('comments.empty', { defaultValue: 'Start the conversation — share your perspective.' })}
        </p>
      </div>
    )
  }

  return (
    <ul className="comment-list space-y-4" aria-live="polite">
      {comments.map((comment) => (
        <li key={comment.id} className="list-item-deferred">
          <CommentItem
            comment={comment}
            currentUserId={currentUserId}
            onDeleted={onDeleted}
            onUpdated={onUpdated}
          />
        </li>
      ))}
    </ul>
  )
}
