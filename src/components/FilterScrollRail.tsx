import type { ReactNode } from 'react'

interface FilterScrollRailProps {
  children: ReactNode
  className?: string
  'aria-label'?: string
}

/** Horizontal filter chip row with edge fade and smooth scroll (keyboard-friendly). */
export default function FilterScrollRail({
  children,
  className = '',
  'aria-label': ariaLabel,
}: FilterScrollRailProps) {
  return (
    <div className={`filter-scroll-rail ${className}`.trim()}>
      <div
        className="filter-scroll-track"
        role={ariaLabel ? 'group' : undefined}
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  )
}
