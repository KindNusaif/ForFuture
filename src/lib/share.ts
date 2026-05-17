import { getAppOrigin } from './appUrl'

export function getMovementShareUrl(postId: string, mode: 'guest' | 'member'): string {
  const path = mode === 'guest' ? `/movements/${postId}` : `/feed/${postId}`
  return `${getAppOrigin()}${path}`
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export async function shareMovement(options: {
  url: string
  title: string
  text?: string
}): Promise<ShareResult> {
  const { url, title, text } = options

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text: text ?? 'Join this youth movement on ForFuture.',
        url,
      })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled'
      }
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
