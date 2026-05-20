import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Send, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PollFields from '../PollFields'
import PollPurposePicker from './PollPurposePicker'
import { FormField, inputClass, inputErrorClass } from '../AuthForm'
import { useAuth } from '../../hooks/useAuth'
import { emptyPollOptions } from '../../lib/pollFieldDefaults'
import { categoryForPollPurpose, type PollPurposeId } from '../../lib/pollPurposes'
import { createPost } from '../../lib/posts'
import { ensureYouthVoiceId } from '../../lib/auth'
import { formatError } from '../../lib/errors'
import {
  hasFieldErrors,
  POST_LIMITS,
  validateCreatePost,
  type CreatePostFieldErrors,
} from '../../lib/validation'
import { mapPollFormErrors } from '../../lib/mapPollFormErrors'
import type { Category, Post } from '../../types'

interface CreatePollModalProps {
  open: boolean
  onClose: () => void
  onPublished: (post: Post) => void
}

function CharCount({ current, max }: { current: number; max: number }) {
  const nearLimit = current > max * 0.9
  return (
    <span
      className={`mt-1 block text-right text-xs tabular-nums ${
        nearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-muted'
      }`}
    >
      {current}/{max}
    </span>
  )
}

export default function CreatePollModal({ open, onClose, onPublished }: CreatePollModalProps) {
  const { t } = useTranslation()
  const { user, profile, refreshProfile } = useAuth()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const questionRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)

  const [purpose, setPurpose] = useState<PollPurposeId | ''>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pollOptions, setPollOptions] = useState<string[]>(() => emptyPollOptions())
  const [loading, setLoading] = useState(false)
  const [voiceIdBootstrapping, setVoiceIdBootstrapping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<CreatePostFieldErrors>({})

  const resetForm = useCallback(() => {
    setPurpose('')
    setTitle('')
    setDescription('')
    setPollOptions(emptyPollOptions())
    setError(null)
    setFieldErrors({})
    setLoading(false)
    setVoiceIdBootstrapping(false)
    submittingRef.current = false
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const id = window.requestAnimationFrame(() => questionRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open])

  function handleClose() {
    if (loading) return
    resetForm()
    onClose()
  }

  const authorName = profile?.display_name?.trim() ?? ''
  const category: Category = categoryForPollPurpose(purpose)

  const canPublish =
    title.trim().length >= POST_LIMITS.titleMin &&
    pollOptions.filter((o) => o.trim()).length >= 2 &&
    !loading &&
    !voiceIdBootstrapping

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (submittingRef.current || loading) return

    if (!user) {
      setError(t('create.loginRequired', { defaultValue: 'You must be logged in to publish a movement.' }))
      return
    }

    const trimmedDescription = description.trim()
    const errors = validateCreatePost({
      title,
      description: trimmedDescription,
      category,
      authorName: authorName || 'Member',
      postingIdentity: 'profile',
      movementType: 'quick_youth_poll',
      pollOptions,
    })
    const friendly = mapPollFormErrors(errors, t)
    setFieldErrors(friendly)
    if (hasFieldErrors(errors)) {
      setError(
        t('polls.fixValidation', {
          defaultValue: 'Please fix the highlighted fields before publishing.',
        }),
      )
      return
    }

    submittingRef.current = true
    setLoading(true)
    setError(null)

    try {
      let youthVoiceId = profile?.youth_voice_id ?? null
      if (!youthVoiceId) {
        setVoiceIdBootstrapping(true)
        try {
          const updated = await ensureYouthVoiceId(user.id)
          youthVoiceId = updated.youth_voice_id
          await refreshProfile()
        } finally {
          setVoiceIdBootstrapping(false)
        }
      }

      if (!youthVoiceId) {
        setError(t('create.voiceIdRequired', { defaultValue: 'Your Youth Voice ID is required to publish.' }))
        return
      }

      const post = await createPost({
        userId: user.id,
        title: title.trim(),
        description: trimmedDescription,
        category,
        authorName: authorName || 'Member',
        postingIdentity: 'profile',
        youthVoiceId,
        movementType: 'quick_youth_poll',
        issue_summary: purpose || undefined,
        pollOptions: pollOptions.map((o) => o.trim()).filter(Boolean),
      })

      resetForm()
      onPublished(post)
    } catch (err) {
      setError(
        t('polls.publishFailed', {
          defaultValue: "We couldn't publish your poll right now. Please try again.",
        }),
      )
      if (import.meta.env.DEV) console.error(formatError(err))
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="create-poll-dialog w-[min(calc(100%-1.5rem),40rem)] max-w-2xl rounded-2xl border-0 bg-transparent p-0 shadow-none backdrop:bg-black/50"
      aria-labelledby="create-poll-title"
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="card-surface max-h-[min(90vh,52rem)] overflow-y-auto p-5 sm:p-6"
        noValidate
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow text-accent-600 dark:text-accent-400">
              {t('polls.eyebrow', { defaultValue: 'COMMUNITY POLLS' })}
            </p>
            <h2 id="create-poll-title" className="mt-1 text-xl font-bold tracking-tight text-primary sm:text-2xl">
              {t('polls.createFormTitle', { defaultValue: 'Create a Community Poll' })}
            </h2>
            <p className="mt-1 text-sm text-secondary">
              {t('polls.createFormIntro', {
                defaultValue: 'Ask a focused question and let the community share its voice.',
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-default text-secondary transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
            aria-label={t('polls.cancel', { defaultValue: 'Cancel' })}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {error && (
          <p
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}

        <fieldset className="mt-5 space-y-5" disabled={loading}>
          <PollPurposePicker
            value={purpose}
            onChange={setPurpose}
            disabled={loading}
          />

          <FormField
            label={t('polls.pollQuestion', { defaultValue: 'Poll question' })}
            id="poll-question"
            error={fieldErrors.title}
          >
            <input
              ref={questionRef}
              id="poll-question"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={POST_LIMITS.titleMax}
              placeholder={t('polls.questionPlaceholder', {
                defaultValue: 'What should our town prioritize next?',
              })}
              aria-invalid={Boolean(fieldErrors.title)}
              className={`${inputClass} ${fieldErrors.title ? inputErrorClass : ''}`}
            />
            <CharCount current={title.length} max={POST_LIMITS.titleMax} />
          </FormField>

          <FormField
            label={t('polls.whyAskingLabel', { defaultValue: 'Why are you asking this? (optional)' })}
            id="poll-context"
            error={fieldErrors.description}
          >
            <textarea
              id="poll-context"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={POST_LIMITS.descriptionMax}
              placeholder={t('polls.contextPlaceholder', {
                defaultValue: 'Add a short note so people understand why this matters.',
              })}
              aria-invalid={Boolean(fieldErrors.description)}
              className={`${inputClass} min-h-22 resize-y ${fieldErrors.description ? inputErrorClass : ''}`}
            />
            <CharCount current={description.length} max={POST_LIMITS.descriptionMax} />
          </FormField>

          <PollFields
            options={pollOptions}
            onChange={setPollOptions}
            errors={fieldErrors}
            disabled={loading}
            priority
          />

          <p className="text-xs leading-relaxed text-muted">
            {t('polls.createFormTip', {
              defaultValue: 'Focused questions receive clearer responses.',
            })}
          </p>
        </fieldset>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-default pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="btn-secondary min-h-11 px-6"
          >
            {t('polls.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            type="submit"
            disabled={!canPublish}
            aria-busy={loading || voiceIdBootstrapping}
            className="btn-primary min-h-11 px-8 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading || voiceIdBootstrapping ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                {t('create.publishing', { defaultValue: 'Publishing…' })}
              </>
            ) : (
              <>
                <Send className="h-5 w-5" aria-hidden />
                {t('create.publishPoll', { defaultValue: 'Publish Poll' })}
              </>
            )}
          </button>
        </div>
      </form>
    </dialog>
  )
}
