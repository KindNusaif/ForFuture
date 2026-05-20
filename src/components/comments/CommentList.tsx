import { useTranslation } from 'react-i18next'
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
    return (
      <p className="comment-list-state text-sm text-muted" aria-busy="true">
        {t('comments.loading', { defaultValue: 'Loading discussion…' })}
      </p>
    )
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
      <p className="comment-list-state text-sm text-secondary">
        {t('comments.empty', { defaultValue: 'No comments yet. Start the conversation.' })}
      </p>
    )
  }

  return (
    <ul className="comment-list space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          onDeleted={onDeleted}
          onUpdated={onUpdated}
        />
      ))}
    </ul>
  )
}
