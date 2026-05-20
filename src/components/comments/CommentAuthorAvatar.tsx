interface CommentAuthorAvatarProps {
  displayName: string
  className?: string
}

export default function CommentAuthorAvatar({ displayName, className = '' }: CommentAuthorAvatarProps) {
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'

  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent-100 to-accent-200 text-xs font-bold text-accent-800 ring-2 ring-surface shadow-sm ${className}`}
      aria-hidden
    >
      {initials}
    </span>
  )
}
