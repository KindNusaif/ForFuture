import { isYouthVoicePost } from './postIdentity'
import { isPollMovement } from './movements'
import { isPetitionMovement } from './petitions'
import type { MovementType, Post } from '../types'

/** Movement types that support public discussion (excludes fundraising & relief). */
const COMMENTABLE_MOVEMENT_TYPES: ReadonlySet<MovementType> = new Set([
  'idea_for_change',
  'raise_voice',
  'peaceful_civic_action',
  'volunteer_drive',
  'quick_youth_poll',
  'youth_petition',
])

export function canPostHaveComments(post: Pick<Post, 'posting_identity' | 'movement_type'>): boolean {
  if (isYouthVoicePost(post)) return false
  return COMMENTABLE_MOVEMENT_TYPES.has(post.movement_type)
}

export type CommentPlaceholderKind = 'post' | 'petition' | 'poll' | 'volunteer'

export function getCommentPlaceholderKind(
  movementType: MovementType,
): CommentPlaceholderKind {
  if (isPollMovement(movementType)) return 'poll'
  if (isPetitionMovement(movementType)) return 'petition'
  if (movementType === 'volunteer_drive') return 'volunteer'
  return 'post'
}
