import { useEffect, useRef, useState } from 'react'
import { Flag, Shield, X } from 'lucide-react'
import { useAuthUser } from '../hooks/useAuthUser'
import { useJoinMovement } from '../hooks/useJoinMovement'
import { submitContentReport } from '../lib/contentReports'
import { formatError } from '../lib/errors'
import { CONTENT_REPORT_REASONS } from '../lib/moderation'
import type { ContentReportReason } from '../lib/moderation'
import type { ReportContentTarget } from '../context/report-content-context'

interface ReportContentModalProps {
  open: boolean
  target: ReportContentTarget | null
  onClose: () => void
  onSuccess: () => void
}

export default function ReportContentModal({
  open,
  target,
  onClose,
  onSuccess,
}: ReportContentModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { isMember, user } = useAuthUser()
  const { openJoinModal } = useJoinMovement()
  const [reason, setReason] = useState<ContentReportReason | ''>('')
  const [note, setNote] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function resetForm() {
    setReason('')
    setNote('')
    setValidationError(null)
    setSubmitError(null)
    setSubmitting(false)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setValidationError(null)
    setSubmitError(null)

    if (!isMember || !user) {
      handleClose()
      openJoinModal('report')
      return
    }

    if (!target || !reason) {
      setValidationError('Please select a reason for your report.')
      return
    }

    setSubmitting(true)
    try {
      await submitContentReport(user.id, {
        contentType: target.contentType,
        contentId: target.contentId,
        reason,
        note,
      })
      resetForm()
      onSuccess()
    } catch (err) {
      setSubmitError(formatError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="w-[min(calc(100%-2rem),32rem)] max-w-lg rounded-2xl border-0 bg-transparent p-0 shadow-none backdrop:bg-slate-900/50"
      aria-labelledby="report-content-title"
    >
      <form
        key={target?.contentId ?? 'report-form'}
        onSubmit={(e) => void handleSubmit(e)}
        className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl"
      >
        <div
          className="absolute inset-0 bg-linear-to-br from-slate-50 via-white to-brand-50/40"
          aria-hidden
        />
        <div className="relative p-6 sm:p-7">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-white/80 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <span className="inline-flex rounded-2xl bg-slate-800 p-3 text-white shadow-lg shadow-slate-900/20">
            <Flag className="h-5 w-5" aria-hidden />
          </span>

          <h2
            id="report-content-title"
            className="mt-4 text-xl font-extrabold tracking-tight text-slate-900"
          >
            Report Content
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Help us keep ForFuture safe and respectful. Reports are reviewed carefully and do
            not automatically remove content.
          </p>

          {target?.contentLabel && (
            <p className="mt-3 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Content: </span>
              {target.contentLabel}
            </p>
          )}

          <fieldset className="mt-5 space-y-2">
            <legend className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Reason for report
            </legend>
            <ul className="space-y-2">
              {CONTENT_REPORT_REASONS.map((option) => {
                const selected = reason === option.value
                return (
                  <li key={option.value}>
                    <label
                      className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-3 transition ${
                        selected
                          ? 'border-accent-400 bg-accent-50/80 ring-1 ring-accent-200/80'
                          : 'border-slate-200 bg-white/90 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={option.value}
                        checked={selected}
                        onChange={() => setReason(option.value)}
                        className="mt-1 h-4 w-4 shrink-0 accent-accent-600"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-600">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </fieldset>

          <label className="mt-4 block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Additional details
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Explain why you believe this content should be reviewed."
              className="wrap-user-text mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </label>

          <p className="mt-3 flex items-start gap-2 rounded-xl border border-brand-200/70 bg-brand-50/60 px-3 py-2.5 text-xs leading-relaxed text-brand-900">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
            Reporting does not hide content. Our moderation team reviews each case fairly.
          </p>

          {validationError && (
            <p className="mt-3 text-sm font-medium text-amber-800" role="alert">
              {validationError}
            </p>
          )}
          {submitError && (
            <p className="mt-3 text-sm font-medium text-red-700" role="alert">
              {submitError}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className="btn-secondary w-full sm:w-auto">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full sm:w-auto"
            >
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}
