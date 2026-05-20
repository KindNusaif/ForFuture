/** Route-aware active state for public marketing navbar (landing + explore/discover/impact). */

export function isMarketingExploreActive(pathname: string): boolean {
  if (pathname === '/') return false
  if (pathname === '/explore/polls' || pathname.startsWith('/explore/polls/')) return false
  return (
    pathname === '/explore' ||
    pathname === '/movements' ||
    pathname.startsWith('/explore/')
  )
}

export function isMarketingDiscoverActive(pathname: string): boolean {
  return pathname === '/discover'
}

export function isMarketingImpactActive(pathname: string): boolean {
  return pathname === '/impact' || pathname === '/impact-map'
}

/** About is a landing section anchor, not a separate route. */
export function isMarketingAboutActive(pathname: string, hash: string): boolean {
  return pathname === '/' && hash === '#voices'
}
