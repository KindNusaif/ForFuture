interface AdminLoadingSkeletonProps {
  rows?: number
  className?: string
}

export default function AdminLoadingSkeleton({
  rows = 4,
  className = '',
}: AdminLoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="admin-skeleton h-10 w-full" />
      ))}
    </div>
  )
}
