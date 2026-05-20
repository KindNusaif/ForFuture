import type { TFunction } from 'i18next'
import { getAppOrigin } from './appUrl'
import type { InspireCategory, InspirePost } from '../types/inspire'
import type { ShareData } from './share'

/** i18n keys for category-specific share copy (distinct from DB category snake_case). */
export const INSPIRE_SHARE_CATEGORY_KEYS: Record<InspireCategory, string> = {
  achievement: 'inspire.share.achievement',
  success_story: 'inspire.share.successStory',
  motivation: 'inspire.share.motivation',
  entrepreneurship: 'inspire.share.entrepreneurship',
  innovation: 'inspire.share.innovation',
  book_idea: 'inspire.share.bookIdea',
}

export function getInspireShareUrl(postId: string): string {
  return `${getAppOrigin()}/inspire/${postId}`
}

export function buildShareDataFromInspirePost(post: Pick<InspirePost, 'id' | 'title' | 'category'>, t: TFunction): ShareData {
  const title = post.title?.trim() || t('inspire.share.defaultTitle', { defaultValue: 'Inspire Hub story' })
  const shareKey = INSPIRE_SHARE_CATEGORY_KEYS[post.category]
  const text = t(shareKey, {
    title,
    defaultValue: t('inspire.share.default', { title }),
  })
  return {
    title,
    text,
    url: getInspireShareUrl(post.id),
    contentType: 'post',
    contentId: post.id,
  }
}
