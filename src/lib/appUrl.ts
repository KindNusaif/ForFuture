/**
 * Public app origin for Supabase Auth redirects (password reset, email confirm).
 * Set VITE_APP_URL in production when the deployed URL is known at build time.
 */
export function getAppOrigin(): string {
  const configured = import.meta.env.VITE_APP_URL?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'http://localhost:5175'
}

export function getPasswordResetRedirectUrl(): string {
  return `${getAppOrigin()}/reset-password`
}
