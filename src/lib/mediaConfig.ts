import type { MovementType } from '../types'

/** Supabase Storage bucket ids (centralized — do not scatter). */
export const MOVEMENT_IMAGES_BUCKET = 'movement-images' as const
export const MOVEMENT_DOCUMENTS_BUCKET = 'movement-documents' as const

export const MEDIA_LIMITS = {
  maxImages: 4,
  maxDocuments: 2,
  maxImageBytes: 8 * 1024 * 1024,
  maxDocumentBytes: 10 * 1024 * 1024,
} as const

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const DOCUMENT_MIME_TYPES = ['application/pdf'] as const

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const

export type MediaKind = 'image' | 'document'
/** Reserved for future short-video support */
export type MediaKindFuture = MediaKind | 'video'

export function movementSupportsAttachments(movementType: MovementType): boolean {
  return movementType !== 'quick_youth_poll'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
