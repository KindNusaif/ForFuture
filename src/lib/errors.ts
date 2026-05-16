import { enhanceSupabaseError, isPostgrestError } from './supabaseErrors'
import { isRequestAborted, RequestTimeoutError } from './supabaseRequest'

/** Turn Supabase / network errors into user-friendly messages */
export function formatError(error: unknown): string {
  if (isRequestAborted(error)) {
    return 'The request was cancelled.'
  }

  if (error instanceof RequestTimeoutError) {
    return 'This is taking longer than usual. Please check your connection and try again.'
  }

  if (isPostgrestError(error)) {
    return enhanceSupabaseError(error).message
  }

  if (error instanceof Error) {
    if (error.message.includes('Invalid login credentials')) {
      return 'Wrong email or password.'
    }
    if (error.message.includes('User already registered')) {
      return 'An account with this email already exists.'
    }
    if (error.message.includes('Email not confirmed')) {
      return 'Please confirm your email, or disable email confirmation in Supabase.'
    }
    if (error.message.includes('Supabase is not configured')) {
      return error.message
    }
    const lower = error.message.toLowerCase()
    if (
      lower.includes('failed to fetch') ||
      lower.includes('network') ||
      lower.includes('load failed')
    ) {
      return 'We could not reach the server. Please check your connection and try again.'
    }
    if (lower.includes('timeout') || lower.includes('timed out')) {
      return 'This is taking longer than usual. Please check your connection and try again.'
    }
    return error.message
  }
  return 'Something went wrong. Please try again.'
}
