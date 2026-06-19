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

const DEV_MOVEMENTS_SCHEMA_HINT =
  'In Supabase → SQL Editor, run supabase/FIX_MOVEMENTS_FEED_NOW.sql (after fix_database.sql). Hard-refresh when done.'

const DEV_VERIFICATION_SCHEMA_HINT =
  'In Supabase → SQL Editor, run supabase/fix_verification_center.sql. Hard-refresh when done.'

function postgrestErrorBlob(error: PostgrestError): string {
  return `${error.message} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase()
}

export function isOrganizationVerificationError(error: unknown): boolean {
  return isPostgrestError(error) && postgrestErrorBlob(error).includes('organization_verification')
}

function logDeveloperHint(context: string, error: PostgrestError, hint = DEV_MOVEMENTS_SCHEMA_HINT) {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.warn(`[ForFuture] ${context}`, error.message, hint)
  }
}

export function enhanceSupabaseError(error: unknown): Error {
  if (!isPostgrestError(error)) {
    return error instanceof Error ? error : new Error('Something went wrong. Please try again.')
  }

  if (isMissingRelation(error)) {
    if (isOrganizationVerificationError(error)) {
      logDeveloperHint('Organization verification table missing', error, DEV_VERIFICATION_SCHEMA_HINT)
      return new Error(
        'Organization verification is not available yet because the database setup is incomplete. Please try again later or contact support if this continues.',
      )
    }
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

  if (error.code === '23505') {
    return new Error(
      'This account or Youth Voice ID is already in use. Try logging in instead.',
    )
  }

  if (error.code === '23502' || error.message.includes('null value')) {
    return new Error(
      'Your profile could not be saved because the database setup is incomplete. Please try logging in, or contact support if this continues.',
    )
  }

  if (error.code === '23514') {
    return new Error('Some profile information was invalid. Please check your details and try again.')
  }

  if (import.meta.env?.DEV) {
    logDeveloperHint('Unhandled PostgREST error', error)
    if (error.message && error.message.length < 200 && !error.message.includes('SQL')) {
      return new Error(error.message)
    }
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
