import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

interface AuthFormProps {
  title: string
  subtitle: string
  submitLabel: string
  loading: boolean
  error: string | null
  success?: string | null
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  children: ReactNode
  footer: ReactNode
  /** Shown on the submit button while loading (defaults to pleaseWait). */
  loadingLabel?: string
  /** Optional block between signup footer and “Back to home”. */
  belowFooter?: ReactNode
}

export default function AuthForm({
  title,
  subtitle,
  submitLabel,
  loading,
  error,
  success,
  onSubmit,
  children,
  footer,
  loadingLabel,
  belowFooter,
}: AuthFormProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 flex justify-center">
        <Logo to="/" />
      </div>

      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{title}</h1>
        <p className="mt-2 text-secondary">{subtitle}</p>
      </header>

      <form
        onSubmit={onSubmit}
        noValidate
        className="card-surface p-6 sm:p-8"
      >
        {success && (
          <div
            className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            {success}
          </div>
        )}
        {error && (
          <div
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        <fieldset className="space-y-4" disabled={loading}>
          {children}
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn-primary mt-6 w-full"
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <span
                className="motion-essential h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden
              />
              {loadingLabel ?? 'Please wait…'}
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-secondary">{footer}</p>

      {belowFooter}

      <p className="mt-5 text-center">
        <Link
          to="/"
          className="auth-link"
        >
          ← Back to home
        </Link>
      </p>
    </main>
  )
}

export function FormField({
  label,
  id,
  error,
  children,
}: {
  label: string
  id: string
  error?: string
  children: ReactNode
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-primary">{label}</span>
      <span className="mt-1 block">{children}</span>
      {error && (
        <span className="mt-1 block text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}

export const inputClass =
  'mt-1 w-full min-h-[44px] rounded-xl border border-default bg-surface px-3 py-2.5 text-primary transition outline-none placeholder:text-muted focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 aria-invalid:border-red-400'

export const inputErrorClass = 'border-red-400 focus:border-red-500 focus:ring-red-500/20'

