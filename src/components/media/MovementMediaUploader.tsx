import { useRef, useState } from 'react'
import { FileText, ImagePlus, Upload, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MEDIA_LIMITS, formatFileSize } from '../../lib/mediaConfig'
import type { PendingMediaFile } from '../../lib/movementAttachments'

interface MovementMediaUploaderProps {
  files: PendingMediaFile[]
  remainingImages: number
  remainingDocuments: number
  onAddFiles: (files: FileList | File[]) => void
  onRemoveFile: (id: string) => void
  validationIssues?: { fileName: string; message: string }[]
  disabled?: boolean
  uploading?: boolean
}

export default function MovementMediaUploader({
  files,
  remainingImages,
  remainingDocuments,
  onAddFiles,
  onRemoveFile,
  validationIssues = [],
  disabled,
  uploading,
}: MovementMediaUploaderProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handlePick() {
    inputRef.current?.click()
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) onAddFiles(e.target.files)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (disabled || uploading) return
    if (e.dataTransfer.files?.length) onAddFiles(e.dataTransfer.files)
  }

  return (
    <section
      className="rounded-2xl border border-default bg-muted/50 p-4 sm:p-5"
      aria-labelledby="movement-media-heading"
    >
      <h3 id="movement-media-heading" className="text-base font-bold text-primary">
        {t('media.sectionTitle')}
      </h3>
      <p className="mt-1 text-sm text-secondary">{t('media.sectionHint')}</p>
      <p className="mt-2 text-xs text-muted">{t('media.acceptedTypes')}</p>
      <p className="text-xs font-medium text-accent-700">
        {t('media.limits', {
          images: MEDIA_LIMITS.maxImages,
          pdfs: MEDIA_LIMITS.maxDocuments,
        })}
      </p>

      <div
        role="button"
        tabIndex={disabled || uploading ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handlePick()
          }
        }}
        onClick={() => !disabled && !uploading && handlePick()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled && !uploading) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mt-4 flex min-h-30 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragOver
            ? 'border-accent-400 bg-accent-50/80'
            : 'border-default bg-surface hover:border-accent-300 hover:bg-accent-50/40'
        } ${disabled || uploading ? 'pointer-events-none opacity-60' : ''}`}
        aria-label={t('media.dropLabel')}
      >
        <Upload className="h-8 w-8 text-accent-600" aria-hidden />
        <p className="mt-2 text-sm font-semibold text-primary">{t('media.dropTitle')}</p>
        <p className="mt-1 text-xs text-muted">
          {t('media.remaining', { images: remainingImages, pdfs: remainingDocuments })}
        </p>
        <button
          type="button"
          className="btn-secondary mt-3 min-h-9! px-4! py-2! text-xs"
          onClick={(e) => {
            e.stopPropagation()
            handlePick()
          }}
          disabled={disabled || uploading}
        >
          {t('media.chooseFiles')}
        </button>
        <input
          ref={inputRef}
          id="movement-media-file-input"
          name="movement-media-files"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          className="sr-only"
          onChange={handleInputChange}
          disabled={disabled || uploading}
        />
      </div>

      {validationIssues.length > 0 && (
        <ul className="mt-3 space-y-1" role="alert">
          {validationIssues.map((issue, i) => (
            <li key={`${issue.fileName}-${i}`} className="text-sm text-red-700">
              {issue.fileName ? `${issue.fileName}: ` : ''}
              {issue.message}
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {files.map((item) => (
            <li
              key={item.id}
              className="flex gap-3 rounded-xl border border-default bg-surface p-3 shadow-sm"
            >
              {item.kind === 'image' && item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                  {item.kind === 'image' ? (
                    <ImagePlus className="h-6 w-6" aria-hidden />
                  ) : (
                    <FileText className="h-6 w-6" aria-hidden />
                  )}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-primary">{item.file.name}</p>
                <p className="text-xs text-muted">{formatFileSize(item.file.size)}</p>
                <p className="text-xs font-medium text-secondary">
                  {item.kind === 'image' ? t('media.typeImage') : t('media.typePdf')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveFile(item.id)}
                disabled={disabled || uploading}
                className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-muted hover:text-secondary"
                aria-label={t('media.removeFile')}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {uploading && (
        <p className="mt-3 flex items-center gap-2 text-sm text-accent-700">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
          {t('media.uploading')}
        </p>
      )}
    </section>
  )
}
