interface AdminStatusBadgeProps {
  status: string
  className?: string
}

function toneForStatus(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('open') || s.includes('submitted') || s.includes('pending')) {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
  }
  if (s.includes('review') || s.includes('under')) {
    return 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200'
  }
  if (s.includes('resolved') || s.includes('approved') || s.includes('published')) {
    return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200'
  }
  if (s.includes('dismiss') || s.includes('reject') || s.includes('hidden')) {
    return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

export default function AdminStatusBadge({ status, className = '' }: AdminStatusBadgeProps) {
  const label = status.replace(/_/g, ' ')
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${toneForStatus(status)} ${className}`}
    >
      {label}
    </span>
  )
}
