import {
  enhanceSupabaseError,
  isMissingRelation,
  isOrganizationVerificationError,
  isPostgrestError,
  sanitizeErrorForDisplay,
} from './supabaseErrors'
import { isRequestAborted, RequestTimeoutError } from './supabaseRequest'
import { isSessionExpiredError, notifySessionExpiredIfNeeded } from './sessionErrors'

export type FormatErrorOptions = {
  /** Use on password-recovery screens so JWT errors stay recovery-specific. */
  passwordRecovery?: boolean
  /** Use on Verification Center so missing-table errors stay verification-specific. */
  verificationCenter?: boolean
}

/** Turn Supabase / network errors into user-friendly messages */
export function formatError(error: unknown, options?: FormatErrorOptions): string {
  if (isSessionExpiredError(error) && !options?.passwordRecovery) {
    notifySessionExpiredIfNeeded(error)
    return 'Your session has expired. Please sign in again.'
  }
  if (isRequestAborted(error)) {
    return 'The request was cancelled.'
  }

  if (error instanceof RequestTimeoutError) {
    return 'This is taking longer than usual. Please check your connection and try again.'
  }

  if (isPostgrestError(error)) {
    if (options?.verificationCenter && isMissingRelation(error)) {
      return sanitizeErrorForDisplay(
        isOrganizationVerificationError(error)
          ? enhanceSupabaseError(error).message
          : 'Organization verification is not available yet because the database setup is incomplete. Please try again later or contact support if this continues.',
      )
    }
    return sanitizeErrorForDisplay(enhanceSupabaseError(error).message)
  }

  if (error instanceof Error) {
    const authCode =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code?: string }).code === 'string'
        ? (error as { code: string }).code
        : null

    if (authCode === 'user_already_exists' || authCode === 'email_exists') {
      return 'An account with this email already exists. Try logging in instead.'
    }
    if (authCode === 'weak_password') {
      return 'Please use a stronger password.'
    }
    if (authCode === 'signup_disabled') {
      return 'Sign-ups are temporarily unavailable. Please try again later.'
    }
    if (authCode === 'email_address_invalid') {
      return 'Please enter a valid email address.'
    }
    if (authCode === 'email_not_confirmed') {
      return 'Please confirm your email before signing in. Check your inbox for the confirmation link.'
    }
    if (authCode === 'unexpected_failure') {
      return 'We could not complete sign up. Please try again in a moment.'
    }

    if (
      error.message.includes('Database error saving new user') ||
      error.message.includes('Error saving new user')
    ) {
      return 'We could not finish creating your account. Your database may need the latest migrations — try again or log in if you already received a confirmation email.'
    }
    if (error.message.includes('Error sending confirmation email')) {
      return 'Your account may have been created, but we could not send the confirmation email. Try logging in, or check spam for a confirmation link.'
    }
    if (
      error.message.includes('redirect') &&
      error.message.toLowerCase().includes('not allowed')
    ) {
      return 'Sign up could not complete email setup. Ask an admin to add this site URL to Supabase Auth redirect URLs.'
    }
    if (error.message.includes('Signups not allowed')) {
      return 'Sign-ups are temporarily unavailable. Please try again later.'
    }

    if (error.message.includes('Invalid login credentials')) {
      return "We couldn't sign you in with those details. Please check your email and password."
    }
    if (
      error.message.includes('User already registered') ||
      error.message.includes('already been registered')
    ) {
      return 'An account with this email already exists. Try logging in instead.'
    }
    if (error.message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters.'
    }
    if (error.message.includes('Unable to validate email')) {
      return 'Please enter a valid email address.'
    }
    if (error.message.includes('Email not confirmed')) {
      return 'Please confirm your email, or disable email confirmation in Supabase.'
    }
    if (options?.passwordRecovery) {
      if (
        error.message.includes('Auth session missing') ||
        error.message.includes('JWT expired') ||
        error.message.includes('invalid claim')
      ) {
        return 'This reset link is invalid or has expired. Please request a new one.'
      }
    }
    if (error.message.includes('same_password')) {
      return 'Choose a password that is different from your current one.'
    }
    if (error.message.includes('over_email_send_rate_limit')) {
      return 'Too many requests. Please wait a few minutes before trying again.'
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
    return sanitizeErrorForDisplay(error.message)
  }
  return 'Something went wrong. Please try again.'
}
