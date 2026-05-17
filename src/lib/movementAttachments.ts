import {
  DOCUMENT_MIME_TYPES,
  IMAGE_MIME_TYPES,
  MEDIA_LIMITS,
  MOVEMENT_DOCUMENTS_BUCKET,
  MOVEMENT_IMAGES_BUCKET,
  type MediaKind,
} from './mediaConfig'
import { enhanceSupabaseError, isMissingRelation } from './supabaseErrors'
import { requireSupabase } from './supabase'
import { chunkIds, DEFAULT_REQUEST_TIMEOUT_MS, withTimeout } from './supabaseRequest'
import type { MovementAttachment, Post } from '../types'

export interface PendingMediaFile {
  id: string
  file: File
  kind: MediaKind
  previewUrl?: string
}

export interface MediaValidationIssue {
  fileName: string
  message: string
}

function sanitizeFileName(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_').slice(0, 80)
  const dot = base.lastIndexOf('.')
  if (dot > 0) return base.slice(0, dot) + base.slice(dot).toLowerCase()
  return base
}

function extensionForMime(mime: string): string {
  if (mime === 'image/jpeg') return '.jpg'
  if (mime === 'image/png') return '.png'
  if (mime === 'image/webp') return '.webp'
  if (mime === 'application/pdf') return '.pdf'
  return ''
}

export function detectMediaKind(file: File): MediaKind | null {
  if (IMAGE_MIME_TYPES.includes(file.type as (typeof IMAGE_MIME_TYPES)[number])) return 'image'
  if (DOCUMENT_MIME_TYPES.includes(file.type as (typeof DOCUMENT_MIME_TYPES)[number])) {
    return 'document'
  }
  return null
}

export function validatePendingMediaFiles(
  files: PendingMediaFile[],
): { valid: true } | { valid: false; issues: MediaValidationIssue[] } {
  const issues: MediaValidationIssue[] = []
  let imageCount = 0
  let docCount = 0

  for (const item of files) {
    const kind = detectMediaKind(item.file)
    if (!kind || kind !== item.kind) {
      issues.push({
        fileName: item.file.name,
        message: 'Only JPG, PNG, WebP images and PDF documents are supported.',
      })
      continue
    }
    if (kind === 'image') {
      imageCount += 1
      if (item.file.size > MEDIA_LIMITS.maxImageBytes) {
        issues.push({
          fileName: item.file.name,
          message: 'This file is too large. Maximum size is 8 MB for images.',
        })
      }
    } else {
      docCount += 1
      if (item.file.size > MEDIA_LIMITS.maxDocumentBytes) {
        issues.push({
          fileName: item.file.name,
          message: 'This file is too large. Maximum size is 10 MB for PDFs.',
        })
      }
    }
  }

  if (imageCount > MEDIA_LIMITS.maxImages) {
    issues.push({
      fileName: '',
      message: `You can upload up to ${MEDIA_LIMITS.maxImages} images.`,
    })
  }
  if (docCount > MEDIA_LIMITS.maxDocuments) {
    issues.push({
      fileName: '',
      message: `You can upload up to ${MEDIA_LIMITS.maxDocuments} PDF documents.`,
    })
  }

  return issues.length > 0 ? { valid: false, issues } : { valid: true }
}

export function getAttachmentPublicUrl(bucket: string, path: string): string {
  const client = requireSupabase()
  const { data } = client.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

function mapAttachmentRow(row: Record<string, unknown>): MovementAttachment {
  const bucket = row.storage_bucket as string
  const path = row.storage_path as string
  return {
    id: row.id as string,
    movement_id: row.movement_id as string,
    uploader_id: row.uploader_id as string,
    file_type: row.file_type as MediaKind,
    media_kind: (row.media_kind as MovementAttachment['media_kind']) ?? (row.file_type as MediaKind),
    mime_type: row.mime_type as string,
    storage_bucket: bucket,
    storage_path: path,
    original_file_name: row.original_file_name as string,
    file_size_bytes: Number(row.file_size_bytes),
    display_order: Number(row.display_order ?? 0),
    created_at: row.created_at as string,
    public_url: getAttachmentPublicUrl(bucket, path),
  }
}

export async function fetchAttachmentsForPosts(
  postIds: string[],
): Promise<Map<string, MovementAttachment[]>> {
  const result = new Map<string, MovementAttachment[]>()
  if (postIds.length === 0) return result

  const client = requireSupabase()

  for (const chunk of chunkIds(postIds)) {
    const { data, error } = await withTimeout(
      client
        .from('movement_attachments')
        .select(
          'id, movement_id, uploader_id, file_type, media_kind, mime_type, storage_bucket, storage_path, original_file_name, file_size_bytes, display_order, created_at',
        )
        .in('movement_id', chunk)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true }),
      DEFAULT_REQUEST_TIMEOUT_MS,
    )

    if (error) {
      if (isMissingRelation(error)) return result
      throw enhanceSupabaseError(error)
    }

    for (const row of data ?? []) {
      const att = mapAttachmentRow(row as Record<string, unknown>)
      const list = result.get(att.movement_id) ?? []
      list.push(att)
      result.set(att.movement_id, list)
    }
  }

  return result
}

export async function enrichPostsWithAttachmentsAsync<T extends Post>(
  posts: T[],
): Promise<T[]> {
  if (posts.length === 0) return posts
  const byPost = await fetchAttachmentsForPosts(posts.map((p) => p.id))
  return posts.map((p) => ({
    ...p,
    attachments: byPost.get(p.id) ?? [],
  }))
}

function buildStoragePath(userId: string, movementId: string, file: File, kind: MediaKind): string {
  const safe = sanitizeFileName(file.name)
  const ext = extensionForMime(file.type) || (safe.includes('.') ? '' : kind === 'image' ? '.jpg' : '.pdf')
  const unique = crypto.randomUUID().slice(0, 8)
  const baseName = safe.replace(/\.[^.]+$/, '') || 'file'
  return `${userId}/${movementId}/${unique}-${baseName}${ext}`
}

export async function uploadMovementAttachments(input: {
  movementId: string
  userId: string
  files: PendingMediaFile[]
}): Promise<MovementAttachment[]> {
  if (input.files.length === 0) return []

  const validation = validatePendingMediaFiles(input.files)
  if (!validation.valid) {
    throw new Error(validation.issues[0]?.message ?? 'Invalid attachment files')
  }

  const client = requireSupabase()
  const uploadedPaths: { bucket: string; path: string }[] = []
  const rows: MovementAttachment[] = []

  let order = 0
  for (const item of input.files) {
    const bucket = item.kind === 'image' ? MOVEMENT_IMAGES_BUCKET : MOVEMENT_DOCUMENTS_BUCKET
    const path = buildStoragePath(input.userId, input.movementId, item.file, item.kind)

    const { error: uploadError } = await client.storage.from(bucket).upload(path, item.file, {
      cacheControl: '3600',
      upsert: false,
      contentType: item.file.type,
    })

    if (uploadError) {
      await removeStoragePaths(uploadedPaths)
      throw new Error(
        uploadError.message.includes('Bucket not found')
          ? 'Media uploads are not available yet. Please try again later or contact support.'
          : 'Could not upload a file. Please try again or remove it and continue.',
      )
    }

    uploadedPaths.push({ bucket, path })

    const { data, error: insertError } = await client
      .from('movement_attachments')
      .insert({
        movement_id: input.movementId,
        uploader_id: input.userId,
        file_type: item.kind,
        media_kind: item.kind,
        mime_type: item.file.type,
        storage_bucket: bucket,
        storage_path: path,
        original_file_name: item.file.name.slice(0, 200),
        file_size_bytes: item.file.size,
        display_order: order++,
      })
      .select(
        'id, movement_id, uploader_id, file_type, media_kind, mime_type, storage_bucket, storage_path, original_file_name, file_size_bytes, display_order, created_at',
      )
      .single()

    if (insertError) {
      await removeStoragePaths([...uploadedPaths])
      throw enhanceSupabaseError(insertError)
    }

    rows.push(mapAttachmentRow(data as Record<string, unknown>))
  }

  return rows
}

async function removeStoragePaths(paths: { bucket: string; path: string }[]) {
  if (paths.length === 0) return
  const client = requireSupabase()
  const byBucket = new Map<string, string[]>()
  for (const p of paths) {
    const list = byBucket.get(p.bucket) ?? []
    list.push(p.path)
    byBucket.set(p.bucket, list)
  }
  for (const [bucket, list] of byBucket) {
    await client.storage.from(bucket).remove(list)
  }
}

/** Remove storage objects for all attachments on a movement (call before post delete). */
export async function cleanupMovementAttachmentStorage(movementId: string): Promise<void> {
  const byPost = await fetchAttachmentsForPosts([movementId])
  const list = byPost.get(movementId) ?? []
  if (list.length === 0) return

  const client = requireSupabase()
  const byBucket = new Map<string, string[]>()
  for (const att of list) {
    const paths = byBucket.get(att.storage_bucket) ?? []
    paths.push(att.storage_path)
    byBucket.set(att.storage_bucket, paths)
  }
  for (const [bucket, paths] of byBucket) {
    const { error } = await client.storage.from(bucket).remove(paths)
    if (error) {
      console.warn('Attachment storage cleanup failed:', error.message)
    }
  }
}

export async function deleteMovementAttachment(attachment: MovementAttachment): Promise<void> {
  const client = requireSupabase()
  await client.storage.from(attachment.storage_bucket).remove([attachment.storage_path])
  const { error } = await client.from('movement_attachments').delete().eq('id', attachment.id)
  if (error) throw enhanceSupabaseError(error)
}
