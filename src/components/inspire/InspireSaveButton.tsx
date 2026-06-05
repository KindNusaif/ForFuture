import { useState } from 'react'
import { Bookmark, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthGate } from '../../hooks/useAuthGate'
import { toggleInspireSaved } from '../../lib/inspire'
import { useToast } from '../../hooks/useToast'

interface InspireSaveButtonProps {
  postId: string
  userId?: string
  saved: boolean
  onSavedChange?: (saved: boolean) => void
  className?: string
}

export default function InspireSaveButton({
  postId,
  userId,
  saved,
  onSavedChange,
  className = '',
}: InspireSaveButtonProps) {
  const { t } = useTranslation()
  const { gate, isMember } = useAuthGate()
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  async function handleClick() {
    if (!isMember || !userId || saving) {
      if (!isMember || !userId) gate('save')
      return
    }
    setSaving(true)
    try {
      const next = await toggleInspireSaved(userId, postId, saved)
      onSavedChange?.(next)
      toast.success(
        next
          ? t('inspire.savedToast', { defaultValue: 'Saved for later.' })
          : t('inspire.unsavedToast', { defaultValue: 'Removed from saved.' }),
      )
    } catch {
      toast.error(t('inspire.saveFailed', { defaultValue: 'Could not update saved item.' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        void handleClick()
      }}
      disabled={saving}
      className={`share-icon-btn ${saved ? 'text-accent-600 dark:text-accent-400' : ''} ${className}`.trim()}
      aria-label={
        saved
          ? t('inspire.unsaveAria', { defaultValue: 'Remove from saved' })
          : t('inspire.saveAria', { defaultValue: 'Save for later' })
      }
      aria-pressed={saved}
      aria-busy={saving}
      data-no-card-nav
    >
      {saving ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Bookmark className={`h-4 w-4 shrink-0 ${saved ? 'fill-current' : ''}`} aria-hidden />
      )}
    </button>
  )
}
