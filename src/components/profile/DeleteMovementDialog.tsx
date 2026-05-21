import { useEffect, useRef } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface DeleteMovementDialogProps {
  open: boolean
  postTitle: string
  deleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteMovementDialog({
  open,
  postTitle,
  deleting,
  onConfirm,
  onCancel,
}: DeleteMovementDialogProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      translate="no"
      onCancel={(e) => {
        e.preventDefault()
        if (!deleting) onCancel()
      }}
      onClose={onCancel}
      className="w-[min(100%,28rem)] max-w-lg rounded-2xl border-0 bg-transparent p-0 shadow-none backdrop:bg-black/50 dark:backdrop:bg-black/70"
      aria-labelledby="delete-movement-title"
    >
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault()
          if (!deleting) onConfirm()
        }}
        className="dialog-panel p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg p-1.5 text-muted hover:bg-muted hover:text-primary disabled:opacity-50"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 id="delete-movement-title" className="mt-4 text-lg font-bold text-primary">
          {t('profile.deleteTitle')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary">{t('profile.deleteMessage')}</p>
        {postTitle && (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm font-semibold text-primary">
            {postTitle}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="btn-secondary w-full sm:w-auto"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={deleting}
            className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60 sm:w-auto"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t('profile.deleting')}
              </>
            ) : (
              t('profile.deleteConfirm')
            )}
          </button>
        </div>
      </form>
    </dialog>
  )
}

