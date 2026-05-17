export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer ${className}`} aria-hidden />
}

export function PostCardSkeleton() {
  return (
    <article className="card-surface min-w-0 max-w-full p-5 sm:p-6">
      <div className="flex justify-between border-b border-default pb-4">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="mt-4 h-7 w-4/5" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-11/12" />
      <div className="mt-5 flex justify-between border-t border-default pt-5">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-11 w-32 rounded-xl" />
      </div>
    </article>
  )
}

export function MyMovementCardSkeleton() {
  return (
    <article className="card-surface p-4 sm:p-5">
      <div className="flex justify-between gap-3">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="mt-3 h-5 w-4/5" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-4 h-4 w-2/3" />
    </article>
  )
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="card-surface p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  )
}
