import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, MoreVertical, Share2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isYouthVoicePost } from '../../lib/postIdentity'
import { useShareContent } from '../../hooks/useShareContent'
import ShareDialog from '../share/ShareDialog'
import type { Post } from '../../types'

interface ContentOwnerMenuProps {
  post: Post
  shareMode: 'guest' | 'member'
  detailPath?: string
  onDelete: () => void
  compact?: boolean
}

export default function ContentOwnerMenu({
  post,
  shareMode: _shareMode,
  detailPath,
  onDelete,
  compact = false,
}: ContentOwnerMenuProps) {
  const { t } = useTranslation()
  const { share, dialogOpen, shareData, closeDialog } = useShareContent()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isYouthVoice = isYouthVoicePost(post)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  function handleShare() {
    setOpen(false)
    void share(post)
  }

  return (
    <div className="relative shrink-0" ref={menuRef} data-no-card-nav>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`content-owner-trigger rounded-lg text-muted transition hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
          compact ? 'p-1.5' : 'p-2'
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('contentOwner.menuLabel')}
      >
        <MoreVertical className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </button>
      {open && (
        <ul role="menu" className="theme-menu content-owner-menu right-0 z-20 mt-1 min-w-[11rem] py-1">
          {detailPath && (
            <li role="none">
              <Link
                to={detailPath}
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-secondary hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                <ExternalLink className="h-4 w-4 text-accent-600 dark:text-accent-400" aria-hidden />
                {t('contentOwner.view')}
              </Link>
            </li>
          )}
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-secondary hover:bg-muted"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 text-accent-600 dark:text-accent-400" aria-hidden />
              {t('contentOwner.share')}
            </button>
          </li>
          <li role="none" className="my-1 border-t border-default" />
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {isYouthVoice ? t('contentOwner.deleteAnonymous') : t('contentOwner.delete')}
            </button>
          </li>
        </ul>
      )}
      <ShareDialog open={dialogOpen} data={shareData} onClose={closeDialog} />
    </div>
  )
}
