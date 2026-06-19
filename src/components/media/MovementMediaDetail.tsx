import { useState } from 'react'
import { ExternalLink, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatFileSize } from '../../lib/mediaConfig'
import type { MovementAttachment } from '../../types'

interface MovementMediaDetailProps {
  attachments: MovementAttachment[]
}

export default function MovementMediaDetail({ attachments }: MovementMediaDetailProps) {
  const { t } = useTranslation()
  const images = attachments.filter((a) => a.file_type === 'image')
  const documents = attachments.filter((a) => a.file_type === 'document')

  if (images.length === 0 && documents.length === 0) return null

  return (
    <div className="mt-6 space-y-6">
      {images.length > 0 && (
        <section aria-labelledby="movement-gallery-heading">
          <h3 id="movement-gallery-heading" className="text-sm font-bold uppercase tracking-wide text-secondary">
            {t('media.galleryTitle')}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {images.map((img) => (
              <GalleryImage key={img.id} attachment={img} />
            ))}
          </div>
        </section>
      )}

      {documents.length > 0 && (
        <section aria-labelledby="movement-docs-heading">
          <h3 id="movement-docs-heading" className="text-sm font-bold uppercase tracking-wide text-secondary">
            {t('media.documentsTitle')}
          </h3>
          <ul className="mt-3 space-y-2">
            {documents.map((doc) => (
              <li key={doc.id}>
                <a
                  href={doc.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-default bg-surface p-4 transition hover:border-accent-200 hover:shadow-sm"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                    <FileText className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-primary">
                      {doc.original_file_name}
                    </span>
                    <span className="text-xs text-muted">
                      {formatFileSize(doc.file_size_bytes)}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-accent-700">
                    {t('media.viewPdf')}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function GalleryImage({ attachment }: { attachment: MovementAttachment }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-default bg-muted text-sm text-muted">
        {t('media.imageFailed')}
      </div>
    )
  }

  return (
    <a
      href={attachment.public_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-xl border border-default bg-muted"
    >
      <img
        src={attachment.public_url}
        alt={attachment.original_file_name}
        width={640}
        height={360}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="aspect-video w-full object-cover transition hover:opacity-95"
      />
    </a>
  )
}
