import { BadgeCheck } from 'lucide-react'
import {
  getOrganizerVerificationTooltip,
  getVerifiedOrganizerLabel,
  normalizeOrganizerVerificationType,
} from '../lib/trust'
import TrustBadgeInfo from './TrustBadgeInfo'

interface VerifiedOrganizerBadgeProps {
  verificationType?: string | null
  size?: 'sm' | 'md'
  showInfo?: boolean
  prominent?: boolean
}

export default function VerifiedOrganizerBadge({
  verificationType,
  size = 'sm',
  showInfo = true,
  prominent = false,
}: VerifiedOrganizerBadgeProps) {
  const normalized = normalizeOrganizerVerificationType(verificationType)
  const label = getVerifiedOrganizerLabel(normalized ?? verificationType)
  const explanation = getOrganizerVerificationTooltip(normalized ?? verificationType)
  const text = size === 'sm' ? 'text-[11px]' : 'text-xs'
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const pad = prominent ? 'px-3 py-1' : 'px-2.5 py-0.5'

  return (
    <span
      className={`badge-trust-verified ${pad} ${text}`}
      title={explanation}
      aria-label={explanation ? `${label}. ${explanation}` : label}
    >
      <BadgeCheck className={`${icon} shrink-0 text-emerald-700`} aria-hidden />
      <span className="truncate">{label}</span>
      {showInfo && <TrustBadgeInfo label={label} explanation={explanation} />}
    </span>
  )
}
