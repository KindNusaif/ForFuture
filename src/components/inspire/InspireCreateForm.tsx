import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { FormField, inputClass } from '../AuthForm'
import { buildInspireBody, getInspireCategoryConfig } from '../../lib/inspireCategories'
import type { InspireCategory, InspireFieldData } from '../../types/inspire'

interface InspireCreateFormProps {
  category: InspireCategory
  loading?: boolean
  onSubmit: (payload: {
    title: string
    body: string
    field_data: InspireFieldData
    could_become_movement?: boolean
  }) => void | Promise<void>
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
  multiline,
  hint,
  maxLength = 2000,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  multiline?: boolean
  hint?: string
  maxLength?: number
}) {
  return (
    <FormField label={label} id={id}>
      {hint && <p className="mb-1 text-xs text-muted">{hint}</p>}
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={maxLength}
          rows={4}
          className={`${inputClass} min-h-[6rem] resize-y`}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={maxLength}
          className={inputClass}
        />
      )}
    </FormField>
  )
}

export default function InspireCreateForm({ category, loading, onSubmit }: InspireCreateFormProps) {
  const { t } = useTranslation()
  const config = getInspireCategoryConfig(category)

  const [title, setTitle] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [couldBecomeMovement, setCouldBecomeMovement] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): string | null {
    if (!title.trim() || title.trim().length < 3) {
      return t('inspire.validation.title', { defaultValue: 'Add a clear title (at least 3 characters).' })
    }
    const body = buildInspireBody(category, fields)
    if (body.length < 10) {
      return t('inspire.validation.body', { defaultValue: 'Please complete the required fields.' })
    }
    if (category === 'book_idea' && !fields.book_title?.trim()) {
      return t('inspire.validation.bookTitle', { defaultValue: 'Book title is required.' })
    }
    if (
      category === 'book_idea' &&
      !fields.book_standout?.trim() &&
      !fields.book_learned?.trim() &&
      !fields.book_apply?.trim()
    ) {
      return t('inspire.validation.bookBody', {
        defaultValue: 'Add at least one takeaway: what stood out, what you learned, or how you’d apply it.',
      })
    }
    if (category === 'achievement' && !fields.achievement_what?.trim()) {
      return t('inspire.validation.achievement', { defaultValue: 'Describe what you achieved.' })
    }
    if (
      category === 'success_story' &&
      (!fields.story_challenge?.trim() ||
        !fields.story_action?.trim() ||
        !fields.story_result?.trim() ||
        !fields.story_lesson?.trim())
    ) {
      return t('inspire.validation.story', {
        defaultValue: 'Share the challenge, what you did, the result, and a lesson for others.',
      })
    }
    if (category === 'motivation' && !fields.reflection?.trim()) {
      return t('inspire.validation.reflection', { defaultValue: 'Share your reflection or lesson.' })
    }
    if (category === 'entrepreneurship' && !fields.building?.trim()) {
      return t('inspire.validation.entrepreneurship', { defaultValue: 'Describe what you are building or learning.' })
    }
    if (category === 'innovation' && !fields.idea_problem?.trim()) {
      return t('inspire.validation.innovation', { defaultValue: 'Describe the problem your idea solves.' })
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    const body = buildInspireBody(category, fields)
    await onSubmit({
      title: title.trim(),
      body,
      field_data: fields as InspireFieldData,
      could_become_movement: category === 'innovation' ? couldBecomeMovement : undefined,
    })
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="card-surface space-y-5 p-5 sm:p-6">
      <p className="text-sm text-secondary">
        {t(config.descriptionKey, { defaultValue: config.descriptionDefault })}
      </p>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200" role="alert">
          {error}
        </p>
      )}

      <Field
        id="inspire-title"
        label={
          category === 'motivation'
            ? t('inspire.form.titleOrMessage', { defaultValue: 'Title or key message' })
            : t('inspire.form.title', { defaultValue: 'Title' })
        }
        value={title}
        onChange={setTitle}
        required
        maxLength={200}
      />

      {category === 'achievement' && (
        <>
          <Field id="achievement_what" label={t('inspire.form.achievementWhat', { defaultValue: 'What did you achieve?' })} value={fields.achievement_what ?? ''} onChange={(v) => setField('achievement_what', v)} required multiline />
          <Field id="achievement_why" label={t('inspire.form.achievementWhy', { defaultValue: 'Why does it matter to you?' })} value={fields.achievement_why ?? ''} onChange={(v) => setField('achievement_why', v)} multiline />
          <Field id="achievement_learned" label={t('inspire.form.achievementLearned', { defaultValue: 'What did you learn?' })} value={fields.achievement_learned ?? ''} onChange={(v) => setField('achievement_learned', v)} multiline />
        </>
      )}

      {category === 'success_story' && (
        <>
          <Field id="story_challenge" label={t('inspire.form.storyChallenge', { defaultValue: 'What challenge did you face?' })} value={fields.story_challenge ?? ''} onChange={(v) => setField('story_challenge', v)} required multiline />
          <Field id="story_action" label={t('inspire.form.storyAction', { defaultValue: 'What action did you take?' })} value={fields.story_action ?? ''} onChange={(v) => setField('story_action', v)} required multiline />
          <Field id="story_result" label={t('inspire.form.storyResult', { defaultValue: 'What was the result?' })} value={fields.story_result ?? ''} onChange={(v) => setField('story_result', v)} required multiline />
          <Field id="story_lesson" label={t('inspire.form.storyLesson', { defaultValue: 'What lesson would you share with others?' })} value={fields.story_lesson ?? ''} onChange={(v) => setField('story_lesson', v)} required multiline />
        </>
      )}

      {category === 'motivation' && (
        <>
          <Field id="reflection" label={t('inspire.form.reflection', { defaultValue: 'Your reflection / lesson' })} value={fields.reflection ?? ''} onChange={(v) => setField('reflection', v)} required multiline />
          <Field id="reflection_inspired_by" label={t('inspire.form.reflectionInspired', { defaultValue: 'What inspired this lesson? (optional)' })} value={fields.reflection_inspired_by ?? ''} onChange={(v) => setField('reflection_inspired_by', v)} multiline />
        </>
      )}

      {category === 'entrepreneurship' && (
        <>
          <Field id="building" label={t('inspire.form.building', { defaultValue: 'What are you building or learning?' })} value={fields.building ?? ''} onChange={(v) => setField('building', v)} required multiline />
          <Field id="problem_solving" label={t('inspire.form.problemSolving', { defaultValue: 'What problem are you solving?' })} value={fields.problem_solving ?? ''} onChange={(v) => setField('problem_solving', v)} multiline />
          <Field id="challenge_faced" label={t('inspire.form.challengeFaced', { defaultValue: 'What challenge did you face?' })} value={fields.challenge_faced ?? ''} onChange={(v) => setField('challenge_faced', v)} multiline />
          <Field id="advice" label={t('inspire.form.advice', { defaultValue: 'What advice would you give?' })} value={fields.advice ?? ''} onChange={(v) => setField('advice', v)} multiline />
        </>
      )}

      {category === 'innovation' && (
        <>
          <Field id="idea_problem" label={t('inspire.form.ideaProblem', { defaultValue: 'What problem does it solve?' })} value={fields.idea_problem ?? ''} onChange={(v) => setField('idea_problem', v)} required multiline />
          <Field id="idea_how" label={t('inspire.form.ideaHow', { defaultValue: 'How could it work?' })} value={fields.idea_how ?? ''} onChange={(v) => setField('idea_how', v)} multiline />
          <Field id="idea_benefit" label={t('inspire.form.ideaBenefit', { defaultValue: 'Who could benefit?' })} value={fields.idea_benefit ?? ''} onChange={(v) => setField('idea_benefit', v)} multiline />
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-default bg-surface p-4">
            <input
              type="checkbox"
              checked={couldBecomeMovement}
              onChange={(e) => setCouldBecomeMovement(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-default text-accent-600 focus:ring-accent-500"
            />
            <span className="text-sm text-secondary">
              {t('inspire.form.couldBecomeMovement', {
                defaultValue: 'This idea could become a movement',
              })}
            </span>
          </label>
        </>
      )}

      {category === 'book_idea' && (
        <>
          <Field id="book_title" label={t('inspire.form.bookTitle', { defaultValue: 'Book title' })} value={fields.book_title ?? ''} onChange={(v) => setField('book_title', v)} required />
          <Field id="book_author" label={t('inspire.form.bookAuthor', { defaultValue: 'Author (optional)' })} value={fields.book_author ?? ''} onChange={(v) => setField('book_author', v)} />
          <Field id="book_standout" label={t('inspire.form.bookStandout', { defaultValue: 'What idea stood out?' })} value={fields.book_standout ?? ''} onChange={(v) => setField('book_standout', v)} multiline hint={t('inspire.form.bookHint', { defaultValue: 'Share your own takeaway — not long excerpts.' })} />
          <Field id="book_learned" label={t('inspire.form.bookLearned', { defaultValue: 'What did you learn?' })} value={fields.book_learned ?? ''} onChange={(v) => setField('book_learned', v)} multiline />
          <Field id="book_apply" label={t('inspire.form.bookApply', { defaultValue: 'How would you apply it?' })} value={fields.book_apply ?? ''} onChange={(v) => setField('book_apply', v)} multiline />
        </>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t('inspire.publishing', { defaultValue: 'Publishing…' })}
          </>
        ) : (
          t(config.submitKey, { defaultValue: config.submitDefault })
        )}
      </button>
    </form>
  )
}
