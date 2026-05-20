import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { deletePost } from '../../lib/posts'
import { isPostOwner } from '../../lib/postOwnership'
import { isYouthVoicePost } from '../../lib/postIdentity'
import { useToast } from '../../hooks/useToast'
import ContentOwnerMenu from './ContentOwnerMenu'
import DeleteContentDialog from './DeleteContentDialog'
import PostOwnerBadge from './PostOwnerBadge'
import type { Post } from '../../types'

interface PostOwnerControlsProps {
  post: Post
  currentUserId: string
  shareMode: 'guest' | 'member'
  detailPath?: string
  compact?: boolean
  showAnonymousBadge?: boolean
  onDeleted?: () => void
}

export default function PostOwnerControls({
  post,
  currentUserId,
  shareMode,
  detailPath,
  compact = false,
  showAnonymousBadge = false,
  onDeleted,
}: PostOwnerControlsProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!isPostOwner(post, currentUserId)) return null

  const isYouthVoice = isYouthVoicePost(post)

  async function confirmDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      await deletePost(post.id, currentUserId)
      setConfirmOpen(false)
      toast.success(t('contentOwner.deleteSuccess'))
      onDeleted?.()
    } catch {
      toast.error(t('contentOwner.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5" data-no-card-nav>
      {showAnonymousBadge && isYouthVoice && <PostOwnerBadge />}
      <ContentOwnerMenu
        post={post}
        shareMode={shareMode}
        detailPath={detailPath}
        onDelete={() => setConfirmOpen(true)}
        compact={compact}
      />
      <DeleteContentDialog
        open={confirmOpen}
        postTitle={post.title}
        variant={isYouthVoice ? 'youthVoice' : 'default'}
        deleting={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleting) setConfirmOpen(false)
        }}
      />
    </div>
  )
}
