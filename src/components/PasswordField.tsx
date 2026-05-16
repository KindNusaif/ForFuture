import { useState, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FormField, inputClass, inputErrorClass } from './AuthForm'

interface PasswordFieldProps {
  id: string
  name: string
  label: string
  error?: string
  autoComplete: 'new-password' | 'current-password'
  placeholder?: string
  minLength?: number
  /** e.g. “Forgot password?” link below the input */
  footer?: ReactNode
  disabled?: boolean
}

export default function PasswordField({
  id,
  name,
  label,
  error,
  autoComplete,
  placeholder = '••••••••',
  minLength,
  footer,
  disabled,
}: PasswordFieldProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  return (
    <FormField label={label} id={id} error={error}>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={`${inputClass} pr-11 ${error ? inputErrorClass : ''}`}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
      {footer}
    </FormField>
  )
}
