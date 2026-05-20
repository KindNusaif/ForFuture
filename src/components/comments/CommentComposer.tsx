import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Textarea from '../ui/Textarea'
import { COMMENT_MAX_LENGTH } from '../../lib/comments'
import { getCommentPlaceholderKind, type CommentPlaceholderKind } from '../../lib/commentEligibility'
import type { MovementType } from '../../types'

interface CommentComposerProps {
  movementType: MovementType
  submitting: boolean
  onSubmit: (body: string) => void | Promise<void>
}

const PLACEHOLDER_KEYS: Record<CommentPlaceholderKind, string> = {
  post: 'comments.placeholderPost',
  petition: 'comments.placeholderPetition',
  poll: 'comments.placeholderPoll',
  volunteer: 'comments.placeholderVolunteer',
}

const PLACEHOLDER_DEFAULTS: Record<CommentPlaceholderKind, string> = {
  post: 'Join the conversation respectfully.',
  petition: 'Share why this matters or add your support.',
  poll: 'Add your perspective to the discussion.',
  volunteer: 'Ask a question or encourage others to join.',
}

export default function CommentComposer({
  movementType,
  submitting,
  onSubmit,
}: CommentComposerProps) {
  const { t } = useTranslation()
  const [body, setBody] = useState('')
  const kind = getCommentPlaceholderKind(movementType)
  const trimmed = body.trim()
  const canSubmit = trimmed.length > 0 && trimmed.length <= COMMENT_MAX_LENGTH && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    await onSubmit(trimmed)
    setBody('')
  }

  return (
    <form className="comment-composer" onSubmit={(e) => void handleSubmit(e)}>
      <Textarea
        id="comment-composer"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={COMMENT_MAX_LENGTH}
        disabled={submitting}
        placeholder={t(PLACEHOLDER_KEYS[kind], { defaultValue: PLACEHOLDER_DEFAULTS[kind] })}
        aria-label={t('comments.composerLabel', { defaultValue: 'Write a comment' })}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span
          className={`text-xs tabular-nums ${
            body.length > COMMENT_MAX_LENGTH * 0.9 ? 'text-amber-700 dark:text-amber-300' : 'text-muted'
          }`}
          aria-live="polite"
        >
          {body.length}/{COMMENT_MAX_LENGTH}
        </span>
        <div className="flex flex-wrap gap-2">
          {body.length > 0 && (
            <button
              type="button"
              className="btn-ghost text-sm"
              disabled={submitting}
              onClick={() => setBody('')}
            >
              {t('comments.cancelDraft', { defaultValue: 'Cancel' })}
            </button>
          )}
          <button type="submit" disabled={!canSubmit} className="btn-primary text-sm">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t('comments.posting', { defaultValue: 'Posting…' })}
              </>
            ) : (
              t('comments.post', { defaultValue: 'Post comment' })
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
