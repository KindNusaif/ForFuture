import { coerceMovementType, getMovementConfig } from '../lib/movements'
import { getMovementVisual } from '../lib/movementVisual'
import type { MovementType } from '../types'

interface MovementTypeBadgeProps {
  movementType: MovementType | string
}

export default function MovementTypeBadge({ movementType }: MovementTypeBadgeProps) {
  const type = coerceMovementType(movementType)
  const config = getMovementConfig(type)
  const visual = getMovementVisual(type)
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${config.badgeClass}`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ${visual.iconChip}`}
        aria-hidden
      >
        <Icon className="h-3 w-3" />
      </span>
      {config.label}
    </span>
  )
}
