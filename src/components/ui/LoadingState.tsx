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
      className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-10 w-10 animate-spin text-accent-600 dark:text-accent-400" aria-hidden />
      <p className="text-sm font-medium text-muted">{label}</p>
    </div>
  )
}
