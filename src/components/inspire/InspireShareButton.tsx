import { Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useShareContent } from '../../hooks/useShareContent'
import { buildShareDataFromInspirePost } from '../../lib/inspireShare'
import ShareDialog from '../share/ShareDialog'
import type { InspirePost } from '../../types/inspire'

interface InspireShareButtonProps {
  post: Pick<InspirePost, 'id' | 'title' | 'category'>
  className?: string
  showLabel?: boolean
}

export default function InspireShareButton({
  post,
  className = '',
  showLabel = false,
}: InspireShareButtonProps) {
  const { t } = useTranslation()
  const { share, dialogOpen, shareData, closeDialog } = useShareContent()

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          void share(buildShareDataFromInspirePost(post, t))
        }}
        className={`share-icon-btn ${className}`.trim()}
        aria-label={t('share.buttonAria', { title: post.title })}
        data-no-card-nav
      >
        <Share2 className="h-4 w-4 shrink-0" aria-hidden />
        {showLabel && <span>{t('share.button')}</span>}
      </button>
      <ShareDialog open={dialogOpen} data={shareData} onClose={closeDialog} />
    </>
  )
}
