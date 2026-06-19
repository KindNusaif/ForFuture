import { Check, Loader2, Lock } from 'lucide-react'
import { useActionRipple } from '../hooks/useActionRipple'
import { getMovementConfig } from '../lib/movements'
import { getMovementVisual } from '../lib/movementVisual'
import type { MovementType } from '../types'

interface MovementActionButtonProps {
  movementType: MovementType
  count: number
  active: boolean
  loading?: boolean
  disabled?: boolean
  guestMode?: boolean
  showHint?: boolean
  onClick: () => void
  className?: string
}

export default function MovementActionButton({
  movementType,
  count,
  active,
  loading = false,
  disabled = false,
  guestMode = false,
  showHint = false,
  onClick,
  className = '',
}: MovementActionButtonProps) {
  const movement = getMovementConfig(movementType)
  const visual = getMovementVisual(movementType)
  const Icon = movement.icon
  const { onPointerDown, rippleClassName } = useActionRipple()
  const label = active ? movement.ctaActiveLabel : movement.ctaLabel
  const countText = movement.countLabel(count)
  const emptyText = `Be the first to ${movement.ctaLabel.toLowerCase()}`

  return (
    <div
      className={`min-w-0 rounded-xl border p-3 sm:min-w-[15rem] sm:p-3.5 ${visual.actionZone} ${className}`}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
        Take action
      </p>

      <button
        type="button"
        disabled={disabled || loading}
        onClick={onClick}
        onPointerDown={onPointerDown}
        className={`${
          active
            ? 'btn-cta-supported w-full'
            : guestMode
              ? 'btn-cta-guest w-full'
              : 'btn-cta w-full'
        } ${rippleClassName}`}
        aria-pressed={active}
        aria-busy={loading}
        title={
          guestMode ? 'Sign in to take action' : movement.actionDisclaimer ?? undefined
        }
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : guestMode ? (
          <Lock className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        ) : active ? (
          <Check className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
        ) : (
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
        )}
        <span className="truncate">{label}</span>
        {count > 0 && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ring-1 ${
              active
                ? 'bg-surface/80 text-brand-800 ring-brand-200/90'
                : 'bg-surface/90 text-secondary ring-default'
            }`}
          >
            {count}
          </span>
        )}
      </button>

      <p
        className="mt-2 text-center text-xs font-medium text-secondary sm:text-right"
        aria-live="polite"
      >
        {count > 0 ? countText : emptyText}
      </p>

      {showHint && (
        <p className="mt-1.5 text-center text-[11px] leading-snug text-muted sm:text-right">
          {movement.engagementHint}
          {movement.actionDisclaimer && (
            <span className="mt-0.5 block font-medium text-secondary">
              {movement.actionDisclaimer}
            </span>
          )}
        </p>
      )}
    </div>
  )
}
