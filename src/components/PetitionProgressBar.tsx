import { useEffect, useState } from 'react'

interface PetitionProgressBarProps {
  percent: number
  className?: string
  trackClassName?: string
  fillClassName?: string
  label?: string
}

/** Petition signature progress — animates from 0 to value on first mount. */
export default function PetitionProgressBar({
  percent,
  className = '',
  trackClassName = 'mt-2 h-2 overflow-hidden rounded-full bg-muted',
  fillClassName = 'petition-progress-fill h-full rounded-full bg-linear-to-r from-fuchsia-500 to-accent-500 dark:from-fuchsia-400 dark:to-accent-400',
  label,
}: PetitionProgressBarProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  const value = Math.max(0, Math.min(100, percent))

  return (
    <div
      className={trackClassName}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={`${fillClassName} ${className}`.trim()} style={{ width: mounted ? `${value}%` : '0%' }} />
    </div>
  )
}
