import SkeletonBlock from './SkeletonBlock'

export interface SkeletonCardProps {
  lines?: number
  showHeader?: boolean
  className?: string
}

export default function SkeletonCard({
  lines = 3,
  showHeader = true,
  className = '',
}: SkeletonCardProps) {
  return (
    <article className={`card-surface min-w-0 max-w-full p-5 sm:p-6 ${className}`}>
      {showHeader && (
        <div className="flex justify-between border-b border-default pb-4">
          <SkeletonBlock className="h-6 w-28 rounded-full" />
          <SkeletonBlock className="h-4 w-16" />
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={`rounded-lg ${showHeader ? 'mt-4' : ''} ${i === 0 ? 'h-7 w-4/5' : 'mt-2 h-4 w-full'}`}
        />
      ))}
    </article>
  )
}
