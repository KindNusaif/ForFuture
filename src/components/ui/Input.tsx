import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  requiredMark?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, error, requiredMark, className, id, ...props },
  ref,
) {
  const inputId = id ?? props.name

  return (
    <div className="block">
      {label && inputId && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {requiredMark && (
            <span className="ml-0.5 text-red-600 dark:text-red-400" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-hint` : undefined
        }
        className={cn(
          'ff-input mt-1',
          error && 'ff-input-error',
          className,
        )}
        {...props}
      />
      {helperText && !error && (
        <p id={`${inputId}-hint`} className="form-hint mt-1">
          {helperText}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="form-error mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
