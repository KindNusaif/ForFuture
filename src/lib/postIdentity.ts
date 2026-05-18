import { formatYouthVoiceLabel, isYouthVoiceIdFormat } from './youthVoiceId'
import type { Post, PostingIdentity } from '../types'

export type { PostingIdentity }

export function isYouthVoicePost(post: Pick<Post, 'posting_identity'>): boolean {
  return post.posting_identity === 'youth_voice'
}

/** How a post author appears in feeds and detail views */
export interface PostAuthorPresentation {
  displayName: string
  isAnonymous: boolean
  youthVoiceId: string | null
}

/**
 * Returns safe public author presentation. For Youth Voice posts, never surfaces
 * profile identity even if author_name was stored incorrectly.
 */
export function getPostAuthorPresentation(
  post: Pick<Post, 'author_name' | 'posting_identity' | 'youth_voice_id'>,
): PostAuthorPresentation {
  const authorName = typeof post.author_name === 'string' ? post.author_name : ''

  if (post.posting_identity === 'youth_voice') {
    const id =
      post.youth_voice_id ??
      (isYouthVoiceIdFormat(authorName) ? authorName : null)

    // Never surface raw author_name — it may contain a legacy real name
    const displayName = id
      ? formatYouthVoiceLabel(id)
      : authorName.startsWith('Youth Voice ')
        ? authorName
        : 'Youth Voice'

    return {
      displayName,
      isAnonymous: true,
      youthVoiceId: id,
    }
  }

  return {
    displayName: authorName || 'Anonymous',
    isAnonymous: false,
    youthVoiceId: null,
  }
}

export function getOwnerIdentityBadgeLabel(
  postingIdentity: PostingIdentity,
): 'Posted as Profile' | 'Posted as Youth Voice ID' {
  return postingIdentity === 'youth_voice' ? 'Posted as Youth Voice ID' : 'Posted as Profile'
}
