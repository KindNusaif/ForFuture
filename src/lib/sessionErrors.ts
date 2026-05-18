/** Detect Supabase / PostgREST auth failures that mean the user must sign in again. */
export function isSessionExpiredError(error: unknown): boolean {
  if (!error) return false

  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: string }).code === 'string'
      ? (error as { code: string }).code
      : null

  if (code === 'PGRST301' || code === '401') return true

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message?: string }).message === 'string'
        ? (error as { message: string }).message
        : String(error)

  const lower = message.toLowerCase()
  return (
    lower.includes('jwt expired') ||
    lower.includes('invalid jwt') ||
    lower.includes('auth session missing') ||
    lower.includes('session not found') ||
    (lower.includes('invalid claim') && !lower.includes('recovery'))
  )
}

const SESSION_EXPIRED_EVENT = 'ff:session-expired'

/** Notify app shell once; returns true if this error was a session expiry. */
export function notifySessionExpiredIfNeeded(error: unknown): boolean {
  if (!isSessionExpiredError(error)) return false
  if (typeof window === 'undefined') return true
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
  return true
}

export { SESSION_EXPIRED_EVENT }
