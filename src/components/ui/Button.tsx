import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  outline: 'btn-outline',
  destructive: 'btn-destructive',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 py-2 text-xs',
  md: 'min-h-11 px-4 py-2.5 text-sm',
  lg: 'min-h-12 px-5 py-3 text-base',
  icon: 'min-h-10 min-w-10 p-2.5',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  iconOnly?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    iconOnly,
    leftIcon,
    rightIcon,
    fullWidth,
    className,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        variantClass[variant],
        size !== 'md' && sizeClass[size],
        iconOnly && 'btn-icon-only',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className="motion-essential h-4 w-4 animate-spin" aria-hidden />
          {!iconOnly && children}
        </span>
      ) : (
        <span className="inline-flex items-center justify-center gap-2">
          {leftIcon}
          {!iconOnly && children}
          {rightIcon}
        </span>
      )}
    </button>
  )
})

export default Button
