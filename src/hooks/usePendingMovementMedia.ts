import { useCallback, useEffect, useMemo, useState } from 'react'
import { MEDIA_LIMITS } from '../lib/mediaConfig'
import {
  detectMediaKind,
  type MediaValidationIssue,
  type PendingMediaFile,
  validatePendingMediaFiles,
} from '../lib/movementAttachments'

function createId(): string {
  return crypto.randomUUID()
}

const UNSUPPORTED_FILE_MESSAGE =
  'Only JPG, PNG, WebP images and PDF documents are supported.'

export function usePendingMovementMedia() {
  const [files, setFiles] = useState<PendingMediaFile[]>([])
  const [addIssues, setAddIssues] = useState<MediaValidationIssue[]>([])

  const counts = useMemo(() => {
    let images = 0
    let documents = 0
    for (const f of files) {
      if (f.kind === 'image') images += 1
      else documents += 1
    }
    return { images, documents }
  }, [files])

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const list = Array.from(incoming)
    const rejected: MediaValidationIssue[] = []

    setFiles((prev) => {
      const next = [...prev]
      let images = next.filter((f) => f.kind === 'image').length
      let documents = next.filter((f) => f.kind === 'document').length

      for (const file of list) {
        const kind = detectMediaKind(file)
        if (!kind) {
          rejected.push({ fileName: file.name, message: UNSUPPORTED_FILE_MESSAGE })
          continue
        }
        if (kind === 'image' && images >= MEDIA_LIMITS.maxImages) {
          rejected.push({
            fileName: file.name,
            message: `You can upload up to ${MEDIA_LIMITS.maxImages} images.`,
          })
          continue
        }
        if (kind === 'document' && documents >= MEDIA_LIMITS.maxDocuments) {
          rejected.push({
            fileName: file.name,
            message: `You can upload up to ${MEDIA_LIMITS.maxDocuments} PDF documents.`,
          })
          continue
        }

        const previewUrl = kind === 'image' ? URL.createObjectURL(file) : undefined

        next.push({
          id: createId(),
          file,
          kind,
          previewUrl,
        })
        if (kind === 'image') images += 1
        else documents += 1
      }
      return next
    })

    setAddIssues(rejected)
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const clearFiles = useCallback(() => {
    setFiles((prev) => {
      for (const f of prev) {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl)
      }
      return []
    })
  }, [])

  useEffect(() => {
    return () => {
      for (const f of files) {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl)
      }
    }
  }, [files])

  const validation = useMemo(() => validatePendingMediaFiles(files), [files])

  const allIssues = useMemo(() => {
    if (!validation.valid) return [...addIssues, ...validation.issues]
    return addIssues
  }, [addIssues, validation])

  return {
    files,
    counts,
    addFiles,
    removeFile,
    clearFiles,
    validation,
    allIssues,
    hasFiles: files.length > 0,
    remainingImages: Math.max(0, MEDIA_LIMITS.maxImages - counts.images),
    remainingDocuments: Math.max(0, MEDIA_LIMITS.maxDocuments - counts.documents),
  }
}
