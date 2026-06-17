import { FeedPostListSkeleton } from './Skeleton'

/** Route transition skeleton — matches feed layout to avoid spinner flash. */
export default function PageLoader() {
  return (
    <div
      className="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-6"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="mb-6 space-y-3" aria-hidden>
        <div className="skeleton-shimmer h-8 w-48 max-w-full rounded-lg" />
        <div className="skeleton-shimmer h-4 w-full max-w-md rounded" />
      </div>
      <FeedPostListSkeleton count={3} />
    </div>
  )
}
