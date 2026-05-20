import ShareButton from './share/ShareButton'
import type { Post } from '../types'

interface ShareMovementButtonProps {
  url: string
  title: string
  className?: string
  variant?: 'secondary' | 'ghost'
  post?: Post
  postId?: string
}

export default function ShareMovementButton({
  title,
  className = '',
  variant = 'secondary',
  post,
  postId,
}: ShareMovementButtonProps) {
  if (!post && !postId) return null

  const sharePost =
    post ??
    ({
      id: postId!,
      title,
      description: '',
      movement_type: 'idea_for_change',
      posting_identity: 'profile',
      category: 'Other',
      author_name: '',
      youth_voice_id: null,
      created_at: new Date().toISOString(),
    } as Post)

  return (
    <ShareButton
      post={sharePost}
      variant={variant === 'ghost' ? 'ghost' : 'secondary'}
      className={className}
      showLabel
    />
  )
}
