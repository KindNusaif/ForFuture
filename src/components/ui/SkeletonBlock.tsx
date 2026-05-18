import { cn } from '../../lib/cn'

export interface SkeletonBlockProps {
  className?: string
}

export default function SkeletonBlock({ className }: SkeletonBlockProps) {
  return <div className={cn('skeleton-shimmer', className)} aria-hidden />
}
