import type { Category, MovementType } from '../types'

/** Primary guest browse route (live public feed). */
export const GUEST_EXPLORE_PATH = '/explore'

export function guestMovementDetailPath(postId: string): string {
  return `${GUEST_EXPLORE_PATH}/${postId}`
}

/** Filtered guest explore URL (`?category=` / `?type=`). */
export function exploreFilterUrl(options: {
  category?: Category
  type?: MovementType
}): string {
  const params = new URLSearchParams()
  if (options.category) params.set('category', options.category)
  if (options.type) params.set('type', options.type)
  const q = params.toString()
  return q ? `${GUEST_EXPLORE_PATH}?${q}` : GUEST_EXPLORE_PATH
}

/** @deprecated Use exploreFilterUrl — kept for discover module compatibility. */
export function movementsFilterUrl(options: {
  category?: Category
  type?: MovementType
}): string {
  return exploreFilterUrl(options)
}
