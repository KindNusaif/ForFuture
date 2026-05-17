import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

interface LogoProps {
  to?: string
  className?: string
  showTagline?: boolean
}

export default function Logo({ to = '/', className = '', showTagline = false }: LogoProps) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-2.5 transition-opacity hover:opacity-90 ${className}`}
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-accent-600 to-brand-600 text-white shadow-md shadow-accent-600/30">
        <Sparkles className="h-5 w-5" aria-hidden />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-lg font-bold tracking-tight text-accent-900">ForFuture</span>
        {showTagline && (
          <span className="hidden text-[10px] font-medium uppercase tracking-wider text-muted sm:block">
            Youth voices → movements
          </span>
        )}
      </span>
    </Link>
  )
}
