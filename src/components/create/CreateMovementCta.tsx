import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthUser } from '../../hooks/useAuthUser'
import { useJoinMovement } from '../../hooks/useJoinMovement'

export interface CreateMovementCtaProps {
  /** Shorter label for narrow sidebars (e.g. trending panel). */
  compact?: boolean
  /** Primary = filled gradient CTA; secondary = premium outlined glass for sidebars/cards */
  variant?: 'primary' | 'secondary'
  fullWidth?: boolean
  className?: string
  /** When true, guests open the join modal instead of navigating to /create. */
  gateForGuests?: boolean
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
  gateForGuests = true,
}: CreateMovementCtaProps) {
  const { t } = useTranslation()
  const { isGuest, loading } = useAuthUser()
  const { openJoinModal } = useJoinMovement()
  const label = compact
    ? t('nav.createMovementShort', { defaultValue: 'Start a movement' })
    : t('nav.createMovement', { defaultValue: 'Create a Youth Movement' })

  const variantClass =
    variant === 'primary' ? 'create-movement-cta--primary' : 'create-movement-cta--secondary'

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!gateForGuests || loading || !isGuest) return
    e.preventDefault()
    openJoinModal('create')
  }

  return (
    <Link
      to="/create"
      onClick={handleClick}
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
