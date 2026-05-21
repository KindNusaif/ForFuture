import { useEffect, useRef } from 'react'
import { Copy, MessageCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { copyShareLink, getSharePlatformLinks, type ShareData } from '../../lib/share'
import { useToast } from '../../hooks/useToast'

interface ShareDialogProps {
  open: boolean
  data: ShareData | null
  onClose: () => void
}

function XBrandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.062 2.062 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const platformIcons = {
  whatsapp: MessageCircle,
  facebook: FacebookIcon,
  x: XBrandIcon,
  linkedin: LinkedInIcon,
} as const

export default function ShareDialog({ open, data, onClose }: ShareDialogProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  async function handleCopy() {
    if (!data) return
    const ok = await copyShareLink(data.url)
    if (ok) {
      toast.success(t('share.linkCopied'))
    } else {
      toast.error(t('share.copyFailed'))
    }
  }

  const platforms = data ? getSharePlatformLinks(data) : []

  return (
    <dialog
      ref={dialogRef}
      translate="no"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClose={onClose}
      className="share-dialog w-full max-w-lg border-0 bg-transparent p-0 shadow-none backdrop:bg-black/50 dark:backdrop:bg-black/70"
      aria-labelledby="share-dialog-title"
      aria-describedby="share-dialog-desc"
    >
      <div className="share-dialog-panel dialog-panel">
        <div className="share-dialog-header">
          <div>
            <h2 id="share-dialog-title" className="text-lg font-bold text-primary">
              {t('share.dialogTitle')}
            </h2>
            <p id="share-dialog-desc" className="mt-1 text-sm text-secondary">
              {t('share.dialogSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="share-dialog-close rounded-lg p-2 text-muted hover:bg-muted hover:text-primary"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {data && (
          <p className="share-dialog-preview mt-4 line-clamp-2 text-sm font-medium text-primary">
            {data.text}
          </p>
        )}

        <ul className="share-platform-grid mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {platforms.map((platform) => {
            const Icon = platformIcons[platform.id]
            return (
              <li key={platform.id}>
                <a
                  href={platform.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-platform-btn"
                  onClick={() => onClose()}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span>{platform.label}</span>
                </a>
              </li>
            )
          })}
        </ul>

        <button
          type="button"
          onClick={() => void handleCopy()}
          className="share-copy-btn mt-4 w-full"
        >
          <Copy className="h-4 w-4 shrink-0" aria-hidden />
          {t('share.copyLink')}
        </button>
      </div>
    </dialog>
  )
}
