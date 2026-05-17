import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'inverse' | 'inverse-outline'

interface CTAButtonProps {
  to: string
  children: React.ReactNode
  variant?: Variant
  icon?: LucideIcon
  className?: string
}

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  inverse:
    'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-accent-700 shadow-lg transition hover:bg-accent-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
  'inverse-outline':
    'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-white/40 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
}

export default function CTAButton({
  to,
  children,
  variant = 'primary',
  icon: Icon,
  className = '',
}: CTAButtonProps) {
  return (
    <Link to={to} className={`${variantClass[variant]} ${className}`}>
      {children}
      {Icon && <Icon className="h-5 w-5 shrink-0" aria-hidden />}
    </Link>
  )
}
