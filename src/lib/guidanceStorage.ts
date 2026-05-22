const WELCOME_DISMISSED_KEY = 'forfuture-welcome-dismissed-v1'
const QUICK_START_DISMISSED_KEY = 'forfuture-quick-start-dismissed-v1'
const GUEST_BANNER_DISMISSED_KEY = 'forfuture-guest-banner-dismissed'

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeFlag(key: string): void {
  try {
    localStorage.setItem(key, '1')
  } catch {
    /* ignore quota / private mode */
  }
}

export function isWelcomeDismissed(): boolean {
  return readFlag(WELCOME_DISMISSED_KEY)
}

export function dismissWelcome(): void {
  writeFlag(WELCOME_DISMISSED_KEY)
}

export function isQuickStartDismissed(): boolean {
  return readFlag(QUICK_START_DISMISSED_KEY)
}

export function dismissQuickStart(): void {
  writeFlag(QUICK_START_DISMISSED_KEY)
}

export function isGuestBannerDismissed(): boolean {
  try {
    return sessionStorage.getItem(GUEST_BANNER_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissGuestBanner(): void {
  try {
    sessionStorage.setItem(GUEST_BANNER_DISMISSED_KEY, '1')
  } catch {
    /* ignore */
  }
}
