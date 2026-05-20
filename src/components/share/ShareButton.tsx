import { Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useShareContent } from '../../hooks/useShareContent'
import ShareDialog from './ShareDialog'
import type { Post } from '../../types'

interface ShareButtonProps {
  post: Post
  variant?: 'icon' | 'secondary' | 'ghost'
  className?: string
  showLabel?: boolean
}

export default function ShareButton({
  post,
  variant = 'icon',
  className = '',
  showLabel = false,
}: ShareButtonProps) {
  const { t } = useTranslation()
  const { share, dialogOpen, shareData, closeDialog } = useShareContent()

  const label = t('share.button')
  const ariaLabel = t('share.buttonAria', { title: post.title })

  const baseClass =
    variant === 'icon'
      ? 'share-icon-btn'
      : variant === 'ghost'
        ? 'btn-ghost min-h-10!'
        : 'btn-secondary min-h-10!'

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          void share(post)
        }}
        className={`${baseClass} ${className}`.trim()}
        aria-label={ariaLabel}
        data-no-card-nav
      >
        <Share2 className="h-4 w-4 shrink-0" aria-hidden />
        {showLabel && <span>{label}</span>}
      </button>
      <ShareDialog open={dialogOpen} data={shareData} onClose={closeDialog} />
    </>
  )
}
