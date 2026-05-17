import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
  animate?: boolean
}

export default function PageContainer({
  children,
  className = '',
  animate = true,
}: PageContainerProps) {
  return (
    <div className={`page-container py-6 sm:py-8 lg:py-10 ${animate ? 'page-enter' : ''} ${className}`.trim()}>
      {children}
    </div>
  )
}
