import type { NavigateFunction, NavigateOptions, To } from 'react-router-dom'

/** Brief in-place success pause before route change (avoids jarring instant redirects). */
export const SUCCESS_NAVIGATION_DELAY_MS = 1_500

export function navigateAfterSuccess(
  navigate: NavigateFunction,
  to: To,
  options?: NavigateOptions,
): void {
  window.setTimeout(() => navigate(to, options), SUCCESS_NAVIGATION_DELAY_MS)
}
