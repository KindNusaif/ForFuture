import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import CategoryPicker from '../components/CategoryPicker'
import ChooseYourVoice from '../components/ChooseYourVoice'
import MovementFields from '../components/MovementFields'
import MovementTypePicker from '../components/MovementTypePicker'
import PollFields from '../components/PollFields'
import { FormField, inputClass, inputErrorClass } from '../components/AuthForm'
import { useAuth } from '../hooks/useAuth'
import { emptyMovementFields } from '../lib/movementFieldValues'
import type { MovementFieldValues } from '../lib/movementFieldValues'
import { emptyPollOptions } from '../lib/pollFieldDefaults'
import type { MapLocation } from '../lib/googleMaps'
import { getMovementConfig, isPollMovement } from '../lib/movements'
import { createPost } from '../lib/posts'
import { formatError } from '../lib/errors'
import {
  hasFieldErrors,
  POST_LIMITS,
  validateCreatePost,
  type CreatePostFieldErrors,
} from '../lib/validation'
import type { Category, MovementType, PostingIdentity } from '../types'

function CharCount({ current, max }: { current: number; max: number }) {
  const nearLimit = current > max * 0.9
  return (
    <span
      className={`mt-1 block text-right text-xs tabular-nums ${
        nearLimit ? 'text-amber-600' : 'text-slate-400'
      }`}
    >
      {current}/{max}
    </span>
  )
}

const MOVEMENT_TYPE_VALUES: MovementType[] = [
  'idea_for_change',
  'raise_voice',
  'volunteer_drive',
  'fundraising',
  'peaceful_civic_action',
  'quick_youth_poll',
]

export default function CreatePost() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const typeFromUrl = searchParams.get('type')

  const [movementType, setMovementType] = useState<MovementType>(() => {
    if (typeFromUrl && MOVEMENT_TYPE_VALUES.includes(typeFromUrl as MovementType)) {
      return typeFromUrl as MovementType
    }
    return 'idea_for_change'
  })
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [authorNameOverride, setAuthorNameOverride] = useState<string | null>(null)
  const [postingIdentity, setPostingIdentity] = useState<PostingIdentity>('profile')
  const [movementFields, setMovementFields] = useState<MovementFieldValues>(emptyMovementFields)
  const [pollOptions, setPollOptions] = useState<string[]>(emptyPollOptions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<CreatePostFieldErrors>({})
  const [mapLocation, setMapLocation] = useState<MapLocation>({
    location_name: '',
    latitude: null,
    longitude: null,
  })

  const requiresProfile = getMovementConfig(movementType).requiresProfileIdentity
  const isPoll = isPollMovement(movementType)
  const defaultAuthorName = profile?.display_name ?? ''
  const authorName = authorNameOverride ?? defaultAuthorName
  const effectivePostingIdentity = requiresProfile ? 'profile' : postingIdentity

  function handleMovementTypeChange(next: MovementType) {
    setMovementType(next)
    setMovementFields(emptyMovementFields())
    setPollOptions(emptyPollOptions())
    setMapLocation({ location_name: '', latitude: null, longitude: null })
    if (getMovementConfig(next).requiresProfileIdentity) {
      setPostingIdentity('profile')
    }
  }

  function updateMovementField(key: keyof MovementFieldValues, value: string) {
    setMovementFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !profile?.youth_voice_id) return

    const errors = validateCreatePost({
      title,
      description,
      category,
      authorName,
      postingIdentity: effectivePostingIdentity,
      movementType,
      fundraising_goal_amount: movementFields.fundraising_goal_amount,
      fundraising_purpose: movementFields.fundraising_purpose,
      pollOptions: isPoll ? pollOptions : undefined,
    })
    setFieldErrors(errors)
    if (hasFieldErrors(errors)) return

    setLoading(true)
    setError(null)
    try {
      const slots = movementFields.volunteer_slots.trim()
      await createPost({
        userId: user.id,
        title: title.trim(),
        description: description.trim(),
        category: category as Category,
        authorName: authorName.trim(),
        postingIdentity: effectivePostingIdentity,
        youthVoiceId: profile.youth_voice_id,
        movementType,
        proposed_solution: movementFields.proposed_solution,
        expected_impact: movementFields.expected_impact,
        issue_summary: movementFields.issue_summary,
        desired_change: movementFields.desired_change,
        event_date: movementFields.event_date,
        event_time: movementFields.event_time,
        location: movementFields.location,
        volunteer_slots: slots ? parseInt(slots, 10) : null,
        contact_note: movementFields.contact_note,
        fundraising_goal_amount: movementFields.fundraising_goal_amount
          ? parseFloat(movementFields.fundraising_goal_amount)
          : null,
        fundraising_purpose: movementFields.fundraising_purpose,
        beneficiary_description: movementFields.beneficiary_description,
        action_date: movementFields.action_date,
        action_time: movementFields.action_time,
        action_location: movementFields.action_location,
        action_purpose: movementFields.action_purpose,
        safety_note: movementFields.safety_note,
        location_name:
          movementType === 'volunteer_drive'
            ? movementFields.location || mapLocation.location_name
            : movementType === 'peaceful_civic_action'
              ? movementFields.action_location || mapLocation.location_name
              : undefined,
        latitude: mapLocation.latitude,
        longitude: mapLocation.longitude,
        pollOptions: isPoll ? pollOptions.map((o) => o.trim()).filter(Boolean) : undefined,
      })
      navigate('/feed', {
        replace: true,
        state: {
          toast: {
            type: 'success' as const,
            message: isPoll ? 'Poll published!' : 'Movement published!',
            detail: isPoll
              ? 'Your community poll is now live.'
              : `"${title.trim()}" is now live on the feed.`,
          },
        },
      })
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto min-w-0 max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/feed"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Link>

      <header className="mb-8">
        <p className="text-sm font-semibold text-accent-600">Create a Youth Movement</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Start a Movement
        </h1>
        <p className="mt-2 text-slate-600">Choose how you want to create impact.</p>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="card-surface space-y-6 p-6 sm:p-8"
      >
        {error && (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        <fieldset className="space-y-6" disabled={loading}>
          <MovementTypePicker
            value={movementType}
            onChange={handleMovementTypeChange}
            disabled={loading}
          />

          <FormField
            label={isPoll ? 'Poll question' : 'Title'}
            id="title"
            error={fieldErrors.title}
          >
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={POST_LIMITS.titleMax}
              placeholder={
                isPoll
                  ? 'e.g. What issue should our community focus on first?'
                  : 'Give your movement a clear, compelling title'
              }
              aria-invalid={Boolean(fieldErrors.title)}
              className={`${inputClass} ${fieldErrors.title ? inputErrorClass : ''}`}
            />
            <CharCount current={title.length} max={POST_LIMITS.titleMax} />
          </FormField>

          {isPoll && (
            <PollFields
              options={pollOptions}
              onChange={setPollOptions}
              errors={fieldErrors}
              disabled={loading}
            />
          )}

          <FormField
            label={isPoll ? 'Context (optional)' : 'Description'}
            id="description"
            error={fieldErrors.description}
          >
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={isPoll ? 3 : 6}
              maxLength={POST_LIMITS.descriptionMax}
              placeholder={
                isPoll
                  ? 'Add a short note to help voters understand the question (optional).'
                  : 'Describe your movement, who it helps, and what you hope to achieve.'
              }
              aria-invalid={Boolean(fieldErrors.description)}
              className={`${inputClass} resize-y min-h-[140px] ${fieldErrors.description ? inputErrorClass : ''}`}
            />
            <CharCount current={description.length} max={POST_LIMITS.descriptionMax} />
          </FormField>

          <MovementFields
            movementType={movementType}
            values={movementFields}
            onChange={updateMovementField}
            mapLocation={mapLocation}
            onMapChange={setMapLocation}
            errors={fieldErrors}
            disabled={loading}
          />

          <CategoryPicker
            value={category}
            onChange={setCategory}
            error={fieldErrors.category}
            disabled={loading}
          />

          <ChooseYourVoice
            value={effectivePostingIdentity}
            onChange={setPostingIdentity}
            youthVoiceId={profile?.youth_voice_id}
            disabled={loading}
            requireProfileOnly={requiresProfile}
          />

          {(requiresProfile || effectivePostingIdentity === 'profile') && (
            <FormField label="Author name" id="authorName" error={fieldErrors.authorName}>
              <input
                id="authorName"
                value={authorName}
                onChange={(e) => setAuthorNameOverride(e.target.value)}
                maxLength={POST_LIMITS.authorMax}
                placeholder="How your name appears on this movement"
                aria-invalid={Boolean(fieldErrors.authorName)}
                className={`${inputClass} ${fieldErrors.authorName ? inputErrorClass : ''}`}
              />
              <p className="mt-1 text-xs text-slate-500">
                Prefilled from your profile. You can change it for this movement only.
              </p>
            </FormField>
          )}
        </fieldset>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
          <Link
            to="/feed"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-300 px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !profile?.youth_voice_id}
            className="btn-primary px-8 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                {isPoll ? 'Publish poll' : 'Publish movement'}
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  )
}
