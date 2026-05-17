import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Loader2, Lock, ScrollText } from 'lucide-react'
import ConfirmDialog from './ui/ConfirmDialog'
import { getMovementConfig } from '../lib/movements'
import { getMovementVisual } from '../lib/movementVisual'
import {
  formatPetitionSupporterCount,
  getPetitionClosingLabel,
  getPetitionProgressPercent,
  isPetitionClosed,
  PETITION_DISCLAIMER,
} from '../lib/petitions'
import type { Post } from '../types'

interface PetitionActionButtonProps {
  post: Post
  loading?: boolean
  guestMode?: boolean
  showHint?: boolean
  onSign: () => void
  className?: string
}

export default function PetitionActionButton({
  post,
  loading = false,
  guestMode = false,
  showHint = false,
  onSign,
  className = '',
}: PetitionActionButtonProps) {
  const { t } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const movement = getMovementConfig('youth_petition')
  const visual = getMovementVisual('youth_petition')
  const signed = Boolean(post.supported_by_me)
  const closed = isPetitionClosed(post)
  const count = post.support_count ?? 0
  const goal = post.petition_support_goal
  const progress = getPetitionProgressPercent(count, goal)
  const closingLabel = getPetitionClosingLabel(post.petition_closing_date)

  const disabled = closed || signed || loading

  function handlePrimaryClick() {
    if (guestMode || signed || closed || loading) return
    setConfirmOpen(true)
  }

  function handleConfirm() {
    setConfirmOpen(false)
    onSign()
  }

  return (
    <div
      className={`min-w-0 rounded-xl border p-3 sm:min-w-[15rem] sm:p-3.5 ${visual.actionZone} ${className}`}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
        {t('petitions.supportLabel')}
      </p>

      {goal != null && goal > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs font-semibold text-secondary">
            <span>{formatPetitionSupporterCount(count, goal)}</span>
            {progress != null && <span>{progress}%</span>}
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={progress ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('petitions.progressLabel')}
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-fuchsia-500 to-accent-500 transition-all duration-500 dark:from-fuchsia-400 dark:to-accent-400"
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {closingLabel && (
        <p
          className={`mb-2 text-xs font-medium ${closed ? 'text-muted' : 'text-fuchsia-800 dark:text-fuchsia-300'}`}
        >
          {closed ? t('petitions.closed') : closingLabel}
        </p>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={guestMode ? onSign : handlePrimaryClick}
        className={
          signed
            ? 'btn-cta-supported w-full'
            : closed
              ? 'w-full cursor-not-allowed rounded-xl border border-default bg-muted px-4 py-3 text-sm font-semibold text-muted'
              : guestMode
                ? 'btn-cta-guest w-full'
                : 'btn-cta w-full'
        }
        aria-pressed={signed}
        aria-busy={loading}
        title={guestMode ? t('petitions.signInToSupport') : movement.actionDisclaimer}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : guestMode ? (
          <Lock className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        ) : signed ? (
          <Check className="h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" aria-hidden />
        ) : (
          <ScrollText className="h-4 w-4 shrink-0" aria-hidden />
        )}
        <span className="truncate">
          {closed
            ? t('petitions.closed')
            : signed
              ? t('petitions.signed')
              : movement.ctaLabel}
        </span>
      </button>

      <p className="mt-2 text-center text-xs font-medium text-secondary sm:text-right" aria-live="polite">
        {goal == null || goal <= 0
          ? formatPetitionSupporterCount(count)
          : count === 0
            ? t('petitions.beFirst')
            : formatPetitionSupporterCount(count, goal)}
      </p>

      {showHint && (
        <p className="mt-1.5 text-center text-[11px] leading-snug text-muted sm:text-right">
          {movement.engagementHint}
          <span className="mt-0.5 block font-medium text-secondary">{PETITION_DISCLAIMER}</span>
        </p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={t('petitions.confirmTitle')}
        description={t('petitions.confirmDescription')}
        confirmLabel={t('petitions.confirmButton')}
        cancelLabel={t('common.cancel')}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
