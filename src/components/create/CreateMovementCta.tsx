import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface CreateMovementCtaProps {
  /** Shorter label for narrow sidebars (e.g. trending panel). */
  compact?: boolean
  /** Primary = filled gradient CTA; secondary = premium outlined glass for sidebars/cards */
  variant?: 'primary' | 'secondary'
  fullWidth?: boolean
  className?: string
}

/**
 * Single entry point for the movement creation wizard (`/create`).
 * Premium civic-tech CTA — consistent label, route, and accessible states.
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

  const variantClass =
    variant === 'primary' ? 'create-movement-cta--primary' : 'create-movement-cta--secondary'

  return (
    <Link
      to="/create"
      className={[
        'create-movement-cta',
        variantClass,
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
    >
      <span className="create-movement-cta-icon" aria-hidden>
        <Plus className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className="create-movement-cta-label">{label}</span>
    </Link>
  )
}
