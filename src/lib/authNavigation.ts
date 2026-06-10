import type { NavigateFunction } from 'react-router-dom'

let navigateRef: NavigateFunction | null = null

export function registerAuthNavigate(navigate: NavigateFunction): void {
  navigateRef = navigate
}

export function unregisterAuthNavigate(): void {
  navigateRef = null
}

/** Navigate after logout — replace so back button cannot return to feed. */
export function navigateAfterLogout(path = '/'): void {
  navigateRef?.(path, { replace: true })
}
