import type { ReactNode } from 'react'

type BadgeTone = 'default' | 'accent' | 'brand' | 'success' | 'warning' | 'muted'

const toneClass: Record<BadgeTone, string> = {
  default: 'chip-muted',
  accent: 'rounded-full bg-accent-100 px-2.5 py-0.5 text-[11px] font-semibold text-accent-800 ring-1 ring-accent-200/80 dark:bg-accent-950/50 dark:text-accent-200 dark:ring-accent-700/50',
  brand: 'rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-semibold text-brand-800 ring-1 ring-brand-200/80 dark:bg-brand-950/50 dark:text-brand-200 dark:ring-brand-700/50',
  success: 'rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200',
  warning: 'rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200',
  muted: 'chip-muted',
}

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

export default function Badge({ children, tone = 'default', className = '' }: BadgeProps) {
  return <span className={`inline-flex items-center ${toneClass[tone]} ${className}`}>{children}</span>
}
