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

const DEV_SCHEMA_HINT =
  'In Supabase → SQL Editor, run supabase/fix_missing_features.sql (or supabase/RUN_PUBLIC_BETA_IN_SUPABASE.sql for public beta). Hard-refresh when done.'

function logDeveloperHint(context: string, error: PostgrestError) {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.warn(`[ForFuture] ${context}`, error.message, DEV_SCHEMA_HINT)
  }
}

export function enhanceSupabaseError(error: unknown): Error {
  if (!isPostgrestError(error)) {
    return error instanceof Error ? error : new Error('Something went wrong. Please try again.')
  }

  if (isMissingRelation(error)) {
    logDeveloperHint('Missing database relation', error)
    return new Error(
      'Movements could not load because the database setup is incomplete. Please try again later or contact support if this continues.',
    )
  }

  if (isMissingColumn(error)) {
    logDeveloperHint('Missing database column', error)
    return new Error(
      'Movements could not load because the database needs an update. Please try again later or contact support if this continues.',
    )
  }

  if (error.message.includes('poll_options') || error.message.includes('poll_votes')) {
    logDeveloperHint('Poll tables missing', error)
    return new Error('Polls are not available yet. Please try again later.')
  }

  if (error.code === '42501' || error.message.includes('permission denied')) {
    logDeveloperHint('Permission denied', error)
    return new Error('You do not have permission to perform this action. Try signing in again.')
  }

  return new Error('Something went wrong. Please try again.')
}

/** Strip internal migration paths from any error string shown in the UI */
export function sanitizeErrorForDisplay(message: string): string {
  return message
    .replace(/\s*In Supabase[\s\S]*$/i, '')
    .replace(/\s*Run supabase\/[\w./-]+\.sql[\s\S]*$/i, '')
    .replace(/\s*Hard-refresh[\s\S]*$/i, '')
    .trim()
}
