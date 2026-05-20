/** Routes that use the public marketing chrome (PublicNav + footer), even when signed in. */
export function isPublicMarketingRoute(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname === '/explore' || pathname === '/movements' || pathname === '/discover') return true
  if (pathname === '/impact' || pathname === '/impact-map') return true
  if (pathname.startsWith('/explore/')) return true
  if (/^\/movements\/[^/]+$/.test(pathname)) return true
  return false
}
