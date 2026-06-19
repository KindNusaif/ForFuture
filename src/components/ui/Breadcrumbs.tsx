import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={`mb-4 ${className}`.trim()}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-secondary">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="inline-flex min-w-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
              ) : null}
              {isLast || !item.to ? (
                <span className="truncate font-medium text-primary" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="truncate font-medium hover:text-accent-600 hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
