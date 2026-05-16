import { Check, Loader2, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getReliefDisplaySubtype } from '../../lib/reliefHub'
import { getMovementVisual } from '../../lib/movementVisual'
import type { Post } from '../../types'

interface ReliefActionButtonProps {
  post: Pick<Post, 'movement_type' | 'donation_subtype'>
  count: number
  active: boolean
  loading?: boolean
  guestMode?: boolean
  showHint?: boolean
  onClick: () => void
  className?: string
}

export default function ReliefActionButton({
  post,
  count,
  active,
  loading = false,
  guestMode = false,
  showHint = false,
  onClick,
  className = '',
}: ReliefActionButtonProps) {
  const { t } = useTranslation()
  const subtype = getReliefDisplaySubtype(post)
  if (!subtype) return null

  const visual = getMovementVisual(
    post.movement_type === 'fundraising' ? 'fundraising' : 'donation_relief',
  )
  const label = active
    ? t(`relief.subtypes.${subtype}.ctaActive`)
    : t(`relief.subtypes.${subtype}.cta`)
  const countLabel = t(`relief.subtypes.${subtype}.count`, { count })
  const disclaimer =
    subtype === 'fundraising' ? t('relief.fundraisingDisclaimer') : undefined

  return (
    <div
      className={`min-w-0 rounded-xl border p-3 sm:min-w-[15rem] sm:p-3.5 ${visual.actionZone} ${className}`}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {t('relief.takeAction')}
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={onClick}
        className={
          active ? 'btn-cta-supported w-full' : guestMode ? 'btn-cta-guest w-full' : 'btn-cta w-full'
        }
        aria-pressed={active}
        aria-busy={loading}
        title={guestMode ? t('relief.guestCtaHint') : disclaimer}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : guestMode ? (
          <Lock className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        ) : active ? (
          <Check className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
        ) : null}
        <span className="truncate">{label}</span>
        {count > 0 && (
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold tabular-nums ring-1 ring-slate-200/90">
            {count}
          </span>
        )}
      </button>
      <p className="mt-2 text-center text-xs font-medium text-slate-600 sm:text-right">{countLabel}</p>
      {showHint && disclaimer && (
        <p className="mt-1.5 text-center text-[11px] leading-snug text-slate-500 sm:text-right">
          {disclaimer}
        </p>
      )}
    </div>
  )
}
