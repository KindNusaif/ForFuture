/** Build a safe post-auth redirect path (avoids auth-page loops). */
export function buildAuthReturn(pathname: string, search = '', hash = ''): string {
  const path = `${pathname}${search}${hash}`
  if (!path || path === '/') return '/feed'
  if (path.startsWith('/login') || path.startsWith('/signup')) return '/feed'
  if (path.startsWith('/forgot-password')) return '/feed'
  return path
}

export type AuthLocationState = {
  from?: { pathname: string; search?: string; hash?: string }
}

export function authStateFromPath(returnPath: string): AuthLocationState {
  const url = new URL(returnPath, 'https://forfuture.local')
  return {
    from: {
      pathname: url.pathname,
      search: url.search || undefined,
      hash: url.hash || undefined,
    },
  }
}

export function resolveAuthReturn(state: unknown, fallback = '/feed'): string {
  const from = (state as AuthLocationState | null)?.from
  if (!from?.pathname) return fallback
  return buildAuthReturn(from.pathname, from.search ?? '', from.hash ?? '')
}
