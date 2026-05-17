import { useState } from 'react'
import { FileText, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MovementAttachment } from '../../types'

interface MovementMediaFeedPreviewProps {
  attachments: MovementAttachment[]
  compact?: boolean
}

export default function MovementMediaFeedPreview({
  attachments,
  compact = true,
}: MovementMediaFeedPreviewProps) {
  const { t } = useTranslation()
  const images = attachments.filter((a) => a.file_type === 'image')
  const documents = attachments.filter((a) => a.file_type === 'document')

  if (images.length === 0 && documents.length === 0) return null

  return (
    <div className="mt-3 space-y-2" aria-label={t('media.feedPreviewAria')}>
      {images.length > 0 && (
        <div
          className={
            images.length === 1
              ? 'overflow-hidden rounded-xl border border-default bg-muted'
              : 'grid grid-cols-2 gap-1.5 overflow-hidden rounded-xl border border-default'
          }
        >
          {images.slice(0, compact ? 4 : 8).map((img) => (
            <FeedImage key={img.id} attachment={img} single={images.length === 1} />
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <a
            href={documents[0].public_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-default bg-muted px-3 py-2 text-xs font-semibold text-secondary transition hover:border-accent-200 hover:bg-accent-50 hover:text-accent-800"
          >
            <FileText className="h-4 w-4 shrink-0 text-rose-600" aria-hidden />
            <span className="truncate">
              {documents.length === 1
                ? t('media.pdfResource')
                : t('media.pdfCount', { count: documents.length })}
            </span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
          </a>
        </div>
      )}
    </div>
  )
}

function FeedImage({
  attachment,
  single,
}: {
  attachment: MovementAttachment
  single: boolean
}) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-xs text-muted ${
          single ? 'aspect-[2/1] max-h-48 w-full' : 'aspect-square'
        }`}
      >
        {t('media.imageFailed')}
      </div>
    )
  }

  return (
    <img
      src={attachment.public_url}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`w-full object-cover ${
        single ? 'aspect-[2/1] max-h-48' : 'aspect-square'
      }`}
    />
  )
}
