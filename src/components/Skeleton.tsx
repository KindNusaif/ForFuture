export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer ${className}`} aria-hidden />
}

const FEED_SKELETON_COUNT = 6

export function FeedPostListSkeleton({ count = FEED_SKELETON_COUNT }: { count?: number }) {
  return (
    <ul className="mt-6 min-w-0 space-y-4" aria-busy="true" aria-label="Loading movements">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="min-w-0">
          <PostCardSkeleton />
        </li>
      ))}
    </ul>
  )
}

export function InspireDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading story">
      <Skeleton className="h-5 w-32" />
      <div className="card-surface space-y-4 p-6 sm:p-8">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-8 w-4/5 max-w-lg" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="mt-4 h-4 w-10/12" />
        <Skeleton className="mt-6 h-4 w-2/3" />
      </div>
    </div>
  )
}

export function CommentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="comment-list space-y-4" aria-busy="true" aria-label="Loading discussion">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="list-item-deferred flex gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function MovementDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading movement">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-9 w-4/5 max-w-xl" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="flex gap-3 border-t border-default pt-6">
        <Skeleton className="h-11 min-w-[10rem] flex-1 rounded-xl" />
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>
    </div>
  )
}

export function PostCardSkeleton() {
  return (
    <article className="card-surface min-h-[280px] min-w-0 max-w-full p-5 sm:p-6">
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
