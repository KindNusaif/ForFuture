interface GuidanceHintProps {
  children: string
  className?: string
}

/** One-line helper copy near important actions. */
export default function GuidanceHint({ children, className = '' }: GuidanceHintProps) {
  return <p className={`guidance-hint ${className}`}>{children}</p>
}
