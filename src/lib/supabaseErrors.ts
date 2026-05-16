import type { PostgrestError } from '@supabase/supabase-js'

export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as PostgrestError).message === 'string'
  )
}

/** Table/view does not exist */
export function isMissingRelation(error: unknown): boolean {
  return isPostgrestError(error) && (error.code === '42P01' || error.code === 'PGRST205')
}

/** Column does not exist */
export function isMissingColumn(error: unknown): boolean {
  return (
    isPostgrestError(error) &&
    (error.code === 'PGRST204' || error.code === '42703' || /column/i.test(error.message))
  )
}

const SCHEMA_FIX_HINT =
  'Run the entire file supabase/fix_database.sql in the Supabase SQL Editor, then hard-refresh this page (Ctrl+Shift+R).'

export function enhanceSupabaseError(error: unknown): Error {
  if (!isPostgrestError(error)) {
    return error instanceof Error ? error : new Error('Something went wrong. Please try again.')
  }

  if (isMissingRelation(error)) {
    const target = error.message.includes('posts_public_safe')
      ? 'The posts_public_safe view is missing.'
      : 'A required database table or view is missing.'
    return new Error(`${target} ${SCHEMA_FIX_HINT}`)
  }

  if (isMissingColumn(error)) {
    const hint = error.message.includes('poll')
      ? 'Poll tables or columns are missing.'
      : 'Your database is missing columns the app expects (movement_type, trust badges, youth_voice_id, etc.).'
    return new Error(`${hint} ${SCHEMA_FIX_HINT}`)
  }

  if (error.message.includes('poll_options') || error.message.includes('poll_votes')) {
    return new Error(`Poll feature is not set up in Supabase. ${SCHEMA_FIX_HINT}`)
  }

  if (error.code === '42501' || error.message.includes('permission denied')) {
    return new Error(
      `Database permission denied. Re-run supabase/00_fix_all.sql and supabase/guest_public_read.sql. ${error.message}`,
    )
  }

  return new Error(error.message)
}
