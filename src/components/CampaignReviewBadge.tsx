import { ShieldCheck } from 'lucide-react'
import { getCampaignReviewLabel, getCampaignReviewTooltip } from '../lib/trust'
import type { MovementType } from '../types'
import TrustBadgeInfo from './TrustBadgeInfo'

interface CampaignReviewBadgeProps {
  movementType: MovementType
  reviewedCampaignType?: string | null
  size?: 'sm' | 'md'
  prominent?: boolean
  showInfo?: boolean
}

export default function CampaignReviewBadge({
  movementType,
  reviewedCampaignType,
  size = 'sm',
  prominent = false,
  showInfo = true,
}: CampaignReviewBadgeProps) {
  const label = getCampaignReviewLabel(movementType, reviewedCampaignType)
  const explanation = getCampaignReviewTooltip(movementType, reviewedCampaignType)
  const text = size === 'sm' ? 'text-[11px]' : 'text-xs'
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const pad = prominent ? 'px-3 py-1' : 'px-2.5 py-0.5'

  return (
    <span
      className={`badge-trust-campaign ${pad} ${text} ${
        prominent ? 'bg-sky-100/95 ring-sky-300/80' : ''
      }`}
      title={explanation}
      aria-label={`${label}. ${explanation}`}
    >
      <ShieldCheck className={`${icon} shrink-0 text-sky-700`} aria-hidden />
      <span className="truncate">{label}</span>
      {showInfo && <TrustBadgeInfo label={label} explanation={explanation} />}
    </span>
  )
}
