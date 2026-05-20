import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  label?: string
  className?: string
}

export default function LoadingState({
  label = 'Loading…',
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={`loading-state-premium mx-auto flex max-w-md flex-col items-center justify-center gap-3 px-8 py-16 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="loading-spinner h-10 w-10 animate-spin" aria-hidden />
      <p className="text-sm font-medium text-muted">{label}</p>
    </div>
  )
}
