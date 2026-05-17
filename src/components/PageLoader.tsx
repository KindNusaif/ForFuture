import { Loader2 } from 'lucide-react'

export default function PageLoader() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <Loader2 className="h-9 w-9 animate-spin text-accent-600" />
      <p className="text-sm text-secondary">Loading…</p>
    </div>
  )
}
