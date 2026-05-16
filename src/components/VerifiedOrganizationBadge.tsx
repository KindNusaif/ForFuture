import { BadgeCheck } from 'lucide-react'
import { getVerifiedOrganizationLabel, TRUST_TOOLTIPS } from '../lib/trust'
import type { OrganizationVerificationType } from '../lib/trust'

interface VerifiedOrganizationBadgeProps {
  verificationType?: OrganizationVerificationType | string | null
  size?: 'sm' | 'md'
  showTooltip?: boolean
}

export default function VerifiedOrganizationBadge({
  verificationType,
  size = 'sm',
  showTooltip = true,
}: VerifiedOrganizationBadgeProps) {
  const label = getVerifiedOrganizationLabel(verificationType)
  const text = size === 'sm' ? 'text-[11px]' : 'text-xs'
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const tooltip = showTooltip ? TRUST_TOOLTIPS.verifiedOrganization : undefined

  return (
    <span
      className={`badge-trust-verified ${text}`}
      title={tooltip}
      aria-label={tooltip ? `${label}. ${tooltip}` : label}
    >
      <BadgeCheck className={`${icon} shrink-0 text-emerald-700`} aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  )
}
