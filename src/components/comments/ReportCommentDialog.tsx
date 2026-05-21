import { useEffect, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { useToast } from '../../hooks/useToast'
import { COMMENT_REPORT_REASONS, submitCommentReport, type CommentReportReason } from '../../lib/comments'
import { formatError } from '../../lib/errors'

interface ReportCommentDialogProps {
  open: boolean
  commentId: string | null
  onClose: () => void
}

export default function ReportCommentDialog({ open, commentId, onClose }: ReportCommentDialogProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [reason, setReason] = useState<CommentReportReason | ''>('')
  const [details, setDetails] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) {
      setReason('')
      setDetails('')
      setValidationError(null)
    }
  }, [open])

  const [submitReport, submitting] = useAsyncAction(async () => {
    if (!commentId || !reason) return
    await submitCommentReport(commentId, reason, details)
    toast.success(
      t('comments.reportSuccess', {
        defaultValue: 'Thank you. This report has been submitted for review.',
      }),
    )
    onClose()
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) {
      setValidationError(
        t('comments.reportReasonRequired', { defaultValue: 'Please select a reason.' }),
      )
      return
    }
    setValidationError(null)
    try {
      await submitReport()
    } catch (err) {
      setValidationError(formatError(err))
    }
  }

  return (
    <dialog
      ref={dialogRef}
      translate="no"
      onCancel={(e) => {
        e.preventDefault()
        if (!submitting) onClose()
      }}
      onClose={onClose}
      className="w-[min(100%,32rem)] max-w-lg rounded-2xl border-0 bg-transparent p-0 shadow-none backdrop:bg-black/50 dark:backdrop:bg-black/70"
      aria-labelledby="report-comment-title"
    >
      <form method="dialog" onSubmit={(e) => void handleSubmit(e)} className="dialog-panel p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id="report-comment-title" className="text-lg font-bold text-primary">
            {t('comments.reportTitle', { defaultValue: 'Report this comment' })}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-muted hover:bg-muted hover:text-primary disabled:opacity-50"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <fieldset className="mt-4 space-y-2">
          <legend className="text-sm font-semibold text-secondary">
            {t('comments.reportReasonLabel', { defaultValue: 'Reason' })}
          </legend>
          {COMMENT_REPORT_REASONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-default px-3 py-2.5 transition has-checked:border-accent-400 has-checked:bg-accent-50/50 dark:has-checked:bg-accent-950/30"
            >
              <input
                type="radio"
                name="comment-report-reason"
                value={option.value}
                checked={reason === option.value}
                onChange={() => setReason(option.value)}
                className="mt-1"
              />
              <span className="text-sm font-medium text-primary">{option.label}</span>
            </label>
          ))}
        </fieldset>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-secondary">
            {t('comments.reportDetailsLabel', { defaultValue: 'Additional details (optional)' })}
          </span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            maxLength={500}
            className="ff-input ff-textarea mt-1.5 w-full"
            placeholder={t('comments.reportDetailsPlaceholder', {
              defaultValue: 'Share any context that helps our moderation team…',
            })}
          />
        </label>
        {validationError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {validationError}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary w-full sm:w-auto">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={submitting || !reason} className="btn-primary w-full sm:w-auto">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t('comments.reportSubmitting', { defaultValue: 'Submitting…' })}
              </>
            ) : (
              t('comments.reportSubmit', { defaultValue: 'Submit report' })
            )}
          </button>
        </div>
      </form>
    </dialog>
  )
}
