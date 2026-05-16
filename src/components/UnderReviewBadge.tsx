import { Clock3 } from 'lucide-react'

interface UnderReviewBadgeProps {
  size?: 'sm' | 'md'
}

export default function UnderReviewBadge({ size = 'sm' }: UnderReviewBadgeProps) {
  const text = size === 'sm' ? 'text-[10px]' : 'text-[11px]'
  const icon = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full bg-amber-50/90 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-amber-200/80 ${text}`}
      title="This campaign is being reviewed by ForFuture."
    >
      <Clock3 className={`${icon} shrink-0`} aria-hidden />
      <span>Under Review</span>
    </span>
  )
}
