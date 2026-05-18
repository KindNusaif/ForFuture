import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type CardVariant = 'surface' | 'elevated' | 'inset'

const variantClass: Record<CardVariant, string> = {
  surface: 'card-surface',
  elevated: 'card-elevated',
  inset: 'card-inset',
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
  children: ReactNode
}

const paddingClass = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
}

export default function Card({
  variant = 'surface',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        variantClass[variant],
        paddingClass[padding],
        interactive && 'post-card-interactive',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
