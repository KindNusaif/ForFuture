import type { TFunction } from 'i18next'
import { guestMovementDetailPath } from './guestExplore'
import { isPollMovement } from './movements'
import { isPetitionMovement } from './petitions'
import { isReliefPost } from './reliefHub'
import { isYouthVoicePost } from './postIdentity'
import { getAppOrigin } from './appUrl'
import type { Post } from '../types'

export type ShareContentType =
  | 'post'
  | 'youth_voice'
  | 'petition'
  | 'poll'
  | 'volunteer'
  | 'campaign'

export interface ShareData {
  title: string
  text: string
  url: string
  contentType: ShareContentType
  contentId: string
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'
export type NativeShareResult = 'shared' | 'cancelled' | 'unavailable'

export const SHARE_CLICK_EVENT = 'forfuture:share_click'

export function getPublicShareUrl(postId: string): string {
  return `${getAppOrigin()}${guestMovementDetailPath(postId)}`
}

export function getMovementShareUrl(postId: string, _mode?: 'guest' | 'member'): string {
  return getPublicShareUrl(postId)
}

export function resolveShareContentType(
  post: Pick<Post, 'movement_type' | 'posting_identity'>,
): ShareContentType {
  if (isYouthVoicePost(post)) return 'youth_voice'
  if (isPetitionMovement(post.movement_type)) return 'petition'
  if (isPollMovement(post.movement_type)) return 'poll'
  if (post.movement_type === 'volunteer_drive') return 'volunteer'
  if (isReliefPost(post as Post) || post.movement_type === 'fundraising') return 'campaign'
  return 'post'
}

export function buildShareDataFromPost(
  post: Pick<Post, 'id' | 'title' | 'movement_type' | 'posting_identity'>,
  t: TFunction,
): ShareData {
  const contentType = resolveShareContentType(post)
  const title = post.title?.trim() || t('share.defaultTitle')
  const text = t(`share.text.${contentType}`, { title })
  return {
    title,
    text,
    url: getPublicShareUrl(post.id),
    contentType,
    contentId: post.id,
  }
}

export function trackShareClick(data: ShareData): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(SHARE_CLICK_EVENT, {
      detail: { contentType: data.contentType, contentId: data.contentId },
    }),
  )
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

export async function tryNativeShare(data: ShareData): Promise<NativeShareResult> {
  if (!canUseNativeShare()) return 'unavailable'
  try {
    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url,
    })
    return 'shared'
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
    return 'unavailable'
  }
}

export async function copyShareLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    try {
      const input = document.createElement('textarea')
      input.value = url
      input.setAttribute('readonly', '')
      input.style.position = 'fixed'
      input.style.left = '-9999px'
      document.body.appendChild(input)
      input.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(input)
      return ok
    } catch {
      return false
    }
  }
}

export interface SharePlatformLink {
  id: 'whatsapp' | 'facebook' | 'x' | 'linkedin'
  label: string
  href: string
}

export function getSharePlatformLinks(data: ShareData): SharePlatformLink[] {
  const encodedUrl = encodeURIComponent(data.url)
  const encodedText = encodeURIComponent(data.text)
  const combined = encodeURIComponent(`${data.text} ${data.url}`)

  return [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${combined}`,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id: 'x',
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ]
}

export async function shareMovement(options: {
  url: string
  title: string
  text?: string
}): Promise<ShareResult> {
  const data: ShareData = {
    title: options.title,
    text: options.text ?? options.title,
    url: options.url,
    contentType: 'post',
    contentId: '',
  }
  const native = await tryNativeShare(data)
  if (native === 'shared') return 'shared'
  if (native === 'cancelled') return 'cancelled'
  const copied = await copyShareLink(options.url)
  return copied ? 'copied' : 'failed'
}
