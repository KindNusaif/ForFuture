import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface CreateMovementCtaProps {
  /** Shorter label for narrow sidebars (e.g. trending panel). */
  compact?: boolean
  variant?: 'primary' | 'secondary'
  fullWidth?: boolean
  className?: string
}

/**
 * Single entry point for the movement creation wizard (`/create`).
 * Keeps label, styling, and routing consistent across the app.
 */
export default function CreateMovementCta({
  compact = false,
  variant = 'primary',
  fullWidth = false,
  className = '',
}: CreateMovementCtaProps) {
  const { t } = useTranslation()
  const label = compact
    ? t('nav.createMovementShort', { defaultValue: 'Start a movement' })
    : t('nav.createMovement', { defaultValue: 'Create a Youth Movement' })

  const btnClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary'

  return (
    <Link
      to="/create"
      className={`create-movement-cta ${btnClass} ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
    >
      <Plus className="h-5 w-5 shrink-0" aria-hidden />
      <span className="create-movement-cta-label">{label}</span>
    </Link>
  )
}
