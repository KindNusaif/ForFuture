import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
  requiredMark?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
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
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-hint` : undefined
        }
        className={cn('ff-input ff-textarea mt-1', error && 'ff-input-error', className)}
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

export default Textarea
