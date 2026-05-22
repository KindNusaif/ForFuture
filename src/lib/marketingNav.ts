/** Route-aware active state for public marketing navbar (landing + explore/discover/impact). */

/** Home `/` has no active main-nav item unless About hash is targeted. */
export function isMarketingHome(pathname: string): boolean {
  return pathname === '/'
}

export function isMarketingExploreActive(pathname: string): boolean {
  if (pathname === '/' || pathname === '/how-it-works') return false
  if (pathname === '/explore/polls' || pathname.startsWith('/explore/polls/')) return false
  return (
    pathname === '/explore' ||
    pathname === '/movements' ||
    pathname.startsWith('/explore/')
  )
}

export function isMarketingDiscoverActive(pathname: string): boolean {
  return pathname === '/discover' || pathname.startsWith('/discover/')
}

export function isMarketingImpactActive(pathname: string): boolean {
  return pathname === '/impact' || pathname === '/impact-map'
}

export function isMarketingHowItWorksActive(pathname: string): boolean {
  return pathname === '/how-it-works'
}

/** About Us — `/about` route or landing `/#voices` section. */
export function isMarketingAboutActive(pathname: string, hash: string): boolean {
  if (pathname === '/about') return true
  if (pathname !== '/') return false
  return hash === '#voices'
}
