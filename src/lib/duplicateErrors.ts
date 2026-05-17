import type { PostgrestError } from '@supabase/supabase-js'

export const DUPLICATE_PETITION_MESSAGE =
  'You have already supported this petition. Each account can sign once.'
export const DUPLICATE_POLL_VOTE_MESSAGE =
  'You have already voted on this poll. Each account gets one vote.'
export const DUPLICATE_REPORT_MESSAGE =
  'You have already submitted a report for this content. Our team is reviewing it.'
export const DUPLICATE_POST_ACTION_MESSAGE =
  'You have already taken this action on this movement.'

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = (error as PostgrestError).code
  return code === '23505'
}

export function mapDuplicateActionError(
  error: unknown,
  kind: 'petition' | 'poll' | 'report' | 'post_action',
): Error {
  if (!isUniqueViolation(error)) {
    return error instanceof Error ? error : new Error('Something went wrong. Please try again.')
  }
  switch (kind) {
    case 'petition':
      return new Error(DUPLICATE_PETITION_MESSAGE)
    case 'poll':
      return new Error(DUPLICATE_POLL_VOTE_MESSAGE)
    case 'report':
      return new Error(DUPLICATE_REPORT_MESSAGE)
    case 'post_action':
      return new Error(DUPLICATE_POST_ACTION_MESSAGE)
    default:
      return new Error('You have already completed this action.')
  }
}
