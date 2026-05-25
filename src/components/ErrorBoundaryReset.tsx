import type { ReactNode } from 'react'
import ErrorBoundary from './ErrorBoundary'

/**
 * Clears the error boundary when the route changes without remounting the full app.
 * (Using `key={pathname}` on the boundary remounted AuthProvider and caused first-click crashes.)
 *
 * Uses window.location instead of useLocation so this wrapper never depends on Router
 * context during error recovery (avoids cascading "useLocation outside Router" failures).
 */
export default function ErrorBoundaryReset({ children }: { children: ReactNode }) {
  const resetKey =
    typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : ''

  return <ErrorBoundary resetKey={resetKey}>{children}</ErrorBoundary>
}
