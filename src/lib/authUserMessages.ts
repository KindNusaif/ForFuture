/**
 * Maps Supabase Auth / network errors to calm, user-facing copy.
 * Never expose raw provider codes or JSON in the UI.
 */
import { sanitizeErrorForDisplay } from './supabaseErrors'
import { isRequestAborted, RequestTimeoutError } from './supabaseRequest'
import { isSessionExpiredError, notifySessionExpiredIfNeeded } from './sessionErrors'

export type AuthErrorContext = 'login' | 'signup' | 'oauth' | 'passwordReset' | 'general'

/** True when the mapped message suggests the email is already registered. */
export function isSignupExistingEmailMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('already exist') ||
    lower.includes('try logging in') ||
    lower.includes('log in instead')
  )
}

/** True when the mapped message is about profile bootstrap after auth signup. */
/** True when login failed because the email is not confirmed yet. */
export function isLoginUnconfirmedMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return lower.includes('confirm your email') || lower.includes('confirmation link')
}

export function isSignupProfileSetupMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('finish setting up your profile') ||
    lower.includes('could not finish creating') ||
    lower.includes('profile setup')
  )
}

function normalizeMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

/** Supabase Auth often exposes machine-readable codes on the error object */
function readAuthCode(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null
  const o = err as { code?: string; status?: number }
  if (typeof o.code === 'string' && o.code.length > 0) return o.code
  return null
}

/**
 * Friendly message for auth flows. Prefer this over formatError() on sign-in/sign-up pages.
 */
export function mapAuthError(err: unknown, context: AuthErrorContext = 'general'): string {
  if (isSessionExpiredError(err) && context !== 'passwordReset') {
    notifySessionExpiredIfNeeded(err)
    return 'Your session has expired. Please sign in again.'
  }
  if (isRequestAborted(err)) {
    return 'The request was cancelled.'
  }
  if (err instanceof RequestTimeoutError) {
    return "We couldn't reach the service right now. Please check your connection and try again."
  }

  const code = readAuthCode(err)
  const msg = normalizeMessage(err)
  const lower = msg.toLowerCase()

  if (
    code === 'weak_password' ||
    lower.includes('weak_password') ||
    lower.includes('password is too weak') ||
    lower.includes('known to be weak') ||
    lower.includes('easy to guess')
  ) {
    if (context === 'signup' || context === 'passwordReset') {
      return 'This password is still too weak. Try a longer passphrase or use our secure suggestion.'
    }
    return 'This password is still too weak. Try a longer passphrase with mixed letters and numbers.'
  }
  if (
    lower.includes('breach') ||
    lower.includes('pwned') ||
    lower.includes('data leak') ||
    lower.includes('leaked') ||
    lower.includes('compromised password')
  ) {
    return 'This password may have appeared in a previous data leak. Please choose a more unique one.'
  }
  if (code === 'user_already_exists' || code === 'email_exists') {
    return 'An account with this email may already exist. Try logging in instead.'
  }
  if (code === 'signup_disabled') {
    return 'Sign-ups are temporarily unavailable. Please try again later.'
  }
  if (code === 'email_address_invalid') {
    return 'Please enter a valid email address.'
  }
  if (code === 'email_not_confirmed') {
    return 'Please confirm your email before signing in. Check your inbox for the confirmation link.'
  }
  if (code === 'unexpected_failure') {
    return 'We could not complete that step. Please try again in a moment.'
  }
  if (context === 'oauth') {
    if (
      lower.includes('access_denied') ||
      lower.includes('interaction_required') ||
      lower.includes('popup closed') ||
      lower.includes('popup_closed')
    ) {
      return 'Google sign-in was cancelled. You can try again when you are ready.'
    }
    if (lower.includes('provider') && lower.includes('not')) {
      return 'Google sign-in is not available right now. Please try email, or try again later.'
    }
    if (lower.includes('redirect') && lower.includes('not allowed')) {
      return 'Sign-in could not complete. An admin may need to add this site URL to Supabase Auth redirect URLs.'
    }
    return 'Google sign-in could not be completed. Please try again.'
  }

  if (msg.includes('PROFILE_SETUP_PENDING:')) {
    return 'Your account was created, but we could not finish setting up your profile. Please confirm your email if required, then log in.'
  }
  if (msg.includes('PROFILE_SETUP_FAILED:')) {
    return 'Your account was created, but we could not finish setting up your profile. Please try logging in or refresh this page.'
  }
  if (
    msg.includes('Database error saving new user') ||
    msg.includes('Error saving new user')
  ) {
    return 'We could not finish creating your account. If the problem continues, try logging in or contact support.'
  }
  if (msg.includes('Error sending confirmation email')) {
    return 'Your account may have been created, but we could not send the confirmation email. Try logging in, or check spam for a confirmation link.'
  }
  if (lower.includes('signups not allowed')) {
    return 'Sign-ups are temporarily unavailable. Please try again later.'
  }
  if (msg.includes('Invalid login credentials') || code === 'invalid_credentials') {
    return "We couldn't sign you in with those details. Please check your email and password."
  }
  if (
    msg.includes('User already registered') ||
    lower.includes('already been registered') ||
    lower.includes('user already registered')
  ) {
    return 'An account with this email may already exist. Try logging in instead.'
  }
  if (code === 'over_email_send_rate_limit' || lower.includes('over_email_send_rate_limit')) {
    return 'Too many requests. Please wait a few minutes before trying again.'
  }
  if (msg.includes('Supabase is not configured')) {
    return msg
  }

  if (context === 'passwordReset') {
    if (
      msg.includes('Auth session missing') ||
      msg.includes('JWT expired') ||
      msg.includes('invalid claim')
    ) {
      return 'This reset link is invalid or has expired. Please request a new one.'
    }
    if (msg.includes('same_password')) {
      return 'Choose a password that is different from your current one.'
    }
  }

  if (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('load failed') ||
    lower.includes('networkerror')
  ) {
    return "We couldn't reach the service right now. Please check your connection and try again."
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'This is taking longer than usual. Please check your connection and try again.'
  }

  if (lower.includes('invalid grant') || lower.includes('flow_state')) {
    return 'Sign-in could not be completed. Please go back and try again.'
  }

  const safe = sanitizeErrorForDisplay(msg)
  if (safe.length < 220 && !/[{}[\]]/.test(safe) && !/^[\w_]+$/.test(safe.trim())) {
    return safe
  }
  if (context === 'signup') {
    return "We couldn't create your account right now. Please try again."
  }
  return 'Something went wrong. Please try again.'
}
