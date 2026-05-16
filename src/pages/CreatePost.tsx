import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ActionPathAI from '../components/actionpath/ActionPathAI'
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
import { movementSupportsAttachments } from '../lib/mediaConfig'
import { uploadMovementAttachments } from '../lib/movementAttachments'
import { getMovementConfig, isPollMovement } from '../lib/movements'
import MovementMediaUploader from '../components/media/MovementMediaUploader'
import { usePendingMovementMedia } from '../hooks/usePendingMovementMedia'
import { isPetitionMovement } from '../lib/petitions'
import { createPost } from '../lib/posts'
import { formatError } from '../lib/errors'
import {
  hasFieldErrors,
  POST_LIMITS,
  validateCreatePost,
  type CreatePostFieldErrors,
} from '../lib/validation'
import {
  buildActionPathApplyResult,
  type ActionPathSuggestion,
} from '../lib/actionPathAi'
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
  'youth_petition',
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

  useEffect(() => {
    if (typeFromUrl === 'quick_youth_poll') {
      setMovementType('quick_youth_poll')
      return
    }
    if (typeFromUrl && MOVEMENT_TYPE_VALUES.includes(typeFromUrl as MovementType)) {
      setMovementType(typeFromUrl as MovementType)
      return
    }
    if (!typeFromUrl) {
      setMovementType((prev) => (prev === 'quick_youth_poll' ? 'idea_for_change' : prev))
    }
  }, [typeFromUrl])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [authorNameOverride, setAuthorNameOverride] = useState<string | null>(null)
  const [postingIdentity, setPostingIdentity] = useState<PostingIdentity>('profile')
  const [movementFields, setMovementFields] = useState<MovementFieldValues>(emptyMovementFields)
  const [pollOptions, setPollOptions] = useState<string[]>(emptyPollOptions)
  const [loading, setLoading] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendingMedia = usePendingMovementMedia()
  const [fieldErrors, setFieldErrors] = useState<CreatePostFieldErrors>({})
  const [mapLocation, setMapLocation] = useState<MapLocation>({
    location_name: '',
    latitude: null,
    longitude: null,
  })

  const requiresProfile = getMovementConfig(movementType).requiresProfileIdentity
  const isPoll = isPollMovement(movementType)
  const isPetition = isPetitionMovement(movementType)
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

  function applyActionPathSuggestion(
    suggestion: ActionPathSuggestion,
    mode: 'draft' | 'fields',
  ) {
    const result = buildActionPathApplyResult(suggestion)

    if (result.reliefRedirect) {
      navigate('/relief/create', {
        state: {
          actionPathDraft: result.reliefRedirect,
        },
      })
      return
    }

    if (mode === 'draft') {
      setMovementType(result.movementType)
      setMovementFields({
        ...emptyMovementFields(),
        ...result.movementFieldUpdates,
      })
      setPollOptions(
        result.pollOptions && result.pollOptions.length >= 2
          ? result.pollOptions
          : emptyPollOptions(),
      )
      setTitle(result.title)
      setDescription(result.description)
      if (getMovementConfig(result.movementType).requiresProfileIdentity) {
        setPostingIdentity('profile')
      }
      setFieldErrors({})
    } else {
      if (result.movementType !== movementType) {
        setMovementType(result.movementType)
        setMovementFields({
          ...emptyMovementFields(),
          ...result.movementFieldUpdates,
        })
      } else {
        setMovementFields((prev) => ({
          ...prev,
          ...result.movementFieldUpdates,
        }))
      }
      if (result.pollOptions && result.pollOptions.length >= 2) {
        setPollOptions(result.pollOptions)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !profile?.youth_voice_id) return

    const issueText = movementFields.petition_issue.trim()
    const petitionDescription = isPetition
      ? issueText.length >= POST_LIMITS.descriptionMin
        ? issueText
        : `${issueText}\n\n${movementFields.petition_requested_change.trim()}`.slice(
            0,
            POST_LIMITS.descriptionMax,
          )
      : description.trim()

    const errors = validateCreatePost({
      title,
      description: petitionDescription,
      category,
      authorName,
      postingIdentity: effectivePostingIdentity,
      movementType,
      fundraising_goal_amount: movementFields.fundraising_goal_amount,
      fundraising_purpose: movementFields.fundraising_purpose,
      pollOptions: isPoll ? pollOptions : undefined,
      petition_issue: movementFields.petition_issue,
      petition_requested_change: movementFields.petition_requested_change,
      petition_target_authority: movementFields.petition_target_authority,
      petition_support_goal: movementFields.petition_support_goal,
      petition_closing_date: movementFields.petition_closing_date,
    })
    setFieldErrors(errors)
    if (hasFieldErrors(errors)) return

    if (movementSupportsAttachments(movementType) && pendingMedia.hasFiles) {
      if (!pendingMedia.validation.valid) {
        setError(pendingMedia.validation.issues[0]?.message ?? 'Check your attachments.')
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      const slots = movementFields.volunteer_slots.trim()
      const goalRaw = movementFields.petition_support_goal.trim()
      const post = await createPost({
        userId: user.id,
        title: title.trim(),
        description: isPetition ? petitionDescription : description.trim(),
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
        petition_issue: movementFields.petition_issue,
        petition_requested_change: movementFields.petition_requested_change,
        petition_target_authority: movementFields.petition_target_authority,
        petition_support_goal: goalRaw ? parseInt(goalRaw, 10) : null,
        petition_closing_date: movementFields.petition_closing_date || undefined,
        petition_impact_note: movementFields.petition_impact_note,
      })

      if (movementSupportsAttachments(movementType) && pendingMedia.hasFiles) {
        setUploadingMedia(true)
        try {
          await uploadMovementAttachments({
            movementId: post.id,
            userId: user.id,
            files: pendingMedia.files,
          })
          pendingMedia.clearFiles()
        } catch (uploadErr) {
          setError(
            `${formatError(uploadErr)} Your movement was published, but some files could not be attached.`,
          )
          setLoading(false)
          setUploadingMedia(false)
          return
        } finally {
          setUploadingMedia(false)
        }
      }

      navigate('/feed', {
        replace: true,
        state: {
          toast: {
            type: 'success' as const,
            message: isPoll
              ? 'Poll published!'
              : isPetition
                ? 'Petition published!'
                : 'Movement published!',
            detail: isPoll
              ? 'Your community poll is now live.'
              : isPetition
                ? 'Your petition is now gathering youth support.'
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

      <ActionPathAI
        currentMovementType={movementType}
        onApplyDraft={(s) => applyActionPathSuggestion(s, 'draft')}
        onApplyFields={(s) => applyActionPathSuggestion(s, 'fields')}
        formDisabled={loading}
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="card-surface mt-8 space-y-6 p-6 sm:p-8"
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

          {movementSupportsAttachments(movementType) && (
            <MovementMediaUploader
              files={pendingMedia.files}
              remainingImages={pendingMedia.remainingImages}
              remainingDocuments={pendingMedia.remainingDocuments}
              onAddFiles={pendingMedia.addFiles}
              onRemoveFile={pendingMedia.removeFile}
              validationIssues={pendingMedia.allIssues}
              disabled={loading}
              uploading={uploadingMedia}
            />
          )}

          <FormField
            label={isPoll ? 'Poll question' : isPetition ? 'Petition title' : 'Title'}
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
                  : isPetition
                    ? 'e.g. Improve Pedestrian Safety Near Schools'
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

          {!isPetition && (
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
          )}

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
                {isPoll ? 'Publish poll' : isPetition ? 'Publish petition' : 'Publish movement'}
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  )
}
