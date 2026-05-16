import { enhanceSupabaseError, isPostgrestError } from './supabaseErrors'

/** Turn Supabase / network errors into user-friendly messages */
export function formatError(error: unknown): string {
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
    return error.message
  }
  return 'Something went wrong. Please try again.'
}
