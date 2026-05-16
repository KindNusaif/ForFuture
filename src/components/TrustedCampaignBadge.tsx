import { ShieldCheck } from 'lucide-react'
import { getTrustedCampaignLabel, TRUST_TOOLTIPS } from '../lib/trust'
import type { MovementType } from '../types'

interface TrustedCampaignBadgeProps {
  movementType: MovementType
  trustedCampaignType?: string | null
  size?: 'sm' | 'md'
  prominent?: boolean
}

export default function TrustedCampaignBadge({
  movementType,
  trustedCampaignType,
  size = 'sm',
  prominent = false,
}: TrustedCampaignBadgeProps) {
  const label = getTrustedCampaignLabel(movementType, trustedCampaignType)
  const text = size === 'sm' ? 'text-[11px]' : 'text-xs'
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const pad = prominent ? 'px-3 py-1' : 'px-2.5 py-0.5'

  return (
    <span
      className={`badge-trust-campaign ${pad} ${text} ${
        prominent ? 'bg-sky-100/95 ring-sky-300/80' : ''
      }`}
      title={TRUST_TOOLTIPS.trustedCampaign}
      aria-label={`${label}. ${TRUST_TOOLTIPS.trustedCampaign}`}
    >
      <ShieldCheck className={`${icon} shrink-0 text-sky-700`} aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  )
}
