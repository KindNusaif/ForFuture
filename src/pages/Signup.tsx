import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthForm, { FormField, inputClass, inputErrorClass } from '../components/AuthForm'
import { signUp } from '../lib/auth'
import { formatError } from '../lib/errors'
import { isSupabaseConfigured } from '../lib/supabase'
import { validateSignup } from '../lib/validation'

export default function Signup() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/feed'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    password?: string
  }>({})

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Check your .env file.')
      return
    }

    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    const validationError = validateSignup(name, email, password)
    if (validationError) {
      const errors: typeof fieldErrors = {}
      if (!name.trim() || name.trim().length < 2) errors.name = 'Enter your name (2+ characters).'
      if (!email.trim() || !email.includes('@')) errors.email = 'Enter a valid email.'
      if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters.'
      if (Object.keys(errors).length > 0) setFieldErrors(errors)
      else setError(validationError)
      return
    }

    setLoading(true)
    setError(null)
    try {
      await signUp(email, password, name)
      navigate(from, { replace: true })
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthForm
      title="Join ForFuture"
      subtitle="Create your account and receive your unique Youth Voice ID."
      submitLabel="Join ForFuture"
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            Log in
          </Link>
        </>
      }
    >
      <FormField label="Your name" id="name" error={fieldErrors.name}>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          aria-invalid={Boolean(fieldErrors.name)}
          className={`${inputClass} ${fieldErrors.name ? inputErrorClass : ''}`}
          placeholder="Jordan Chen"
        />
      </FormField>
      <FormField label="Email" id="email" error={fieldErrors.email}>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          className={`${inputClass} ${fieldErrors.email ? inputErrorClass : ''}`}
          placeholder="you@example.com"
        />
      </FormField>
      <FormField label="Password" id="password" error={fieldErrors.password}>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.password)}
          className={`${inputClass} ${fieldErrors.password ? inputErrorClass : ''}`}
          placeholder="At least 6 characters"
        />
      </FormField>
    </AuthForm>
  )
}
