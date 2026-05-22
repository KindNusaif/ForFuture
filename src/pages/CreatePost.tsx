import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ActionPathAI from '../components/actionpath/ActionPathAI'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import CategoryPicker from '../components/CategoryPicker'
import ChooseYourVoice from '../components/ChooseYourVoice'
import MovementFields from '../components/MovementFields'
import MovementTypePicker from '../components/MovementTypePicker'
import PollFields from '../components/PollFields'
import PollPurposePicker from '../components/polls/PollPurposePicker'
import { categoryForPollPurpose, type PollPurposeId } from '../lib/pollPurposes'
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
import { scrollToFirstFieldError } from '../lib/createPostForm'
import CreateMovementWizard from '../components/create/CreateMovementWizard'
import {
  buildCreatePreviewPost,
  clearCreateMovementDraft,
  loadCreateMovementDraft,
  saveCreateMovementDraft,
} from '../lib/createMovementDraft'
import { createPost } from '../lib/posts'
import { ensureYouthVoiceId } from '../lib/auth'
import { formatError } from '../lib/errors'
import {
  formatFieldErrorsSummary,
  hasFieldErrors,
  POST_LIMITS,
  type CreatePostFieldErrors,
} from '../lib/validation'
import {
  resolveCreateDescription,
  validateCreateMovement,
  wizardStepCanContinue,
  wizardStepFieldErrors,
  type CreateMovementFormState,
} from '../lib/createMovementValidation'
import { CREATE_WIZARD_STEP_COUNT } from '../lib/createWizardConfig'
import type { WizardTypeOption } from '../lib/createWizardConfig'
import { useToast } from '../hooks/useToast'
import {
  buildActionPathApplyResult,
  type ActionPathSuggestion,
} from '../lib/actionPathAi'
import { useTranslation } from 'react-i18next'
import GuidanceHint from '../components/guidance/GuidanceHint'
import type { Category, MovementType, PostingIdentity } from '../types'

function CharCount({ current, max }: { current: number; max: number }) {
  const nearLimit = current > max * 0.9
  return (
    <span
      className={`mt-1 block text-right text-xs tabular-nums ${
        nearLimit ? 'text-amber-600' : 'text-muted'
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

const WIZARD_STEPS = CREATE_WIZARD_STEP_COUNT

export default function CreatePost() {
  const { t } = useTranslation()
  const { user, profile, refreshProfile } = useAuth()
  const pollQuestionRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const typeFromUrl = searchParams.get('type')
  const useWizardMode = typeFromUrl !== 'quick_youth_poll'

  const [wizardStep, setWizardStep] = useState(1)
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null)
  const [typeExplicitlyChosen, setTypeExplicitlyChosen] = useState(false)
  const [goodFaithConfirmed, setGoodFaithConfirmed] = useState(false)

  const [movementType, setMovementType] = useState<MovementType>(() => {
    if (typeFromUrl === 'quick_youth_poll') return 'quick_youth_poll'
    if (typeFromUrl && MOVEMENT_TYPE_VALUES.includes(typeFromUrl as MovementType)) {
      return typeFromUrl as MovementType
    }
    return useWizardMode ? 'raise_voice' : 'idea_for_change'
  })
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [authorNameOverride, setAuthorNameOverride] = useState<string | null>(null)
  const [postingIdentity, setPostingIdentity] = useState<PostingIdentity>('profile')
  const [movementFields, setMovementFields] = useState<MovementFieldValues>(() => emptyMovementFields())
  const [pollOptions, setPollOptions] = useState<string[]>(() => emptyPollOptions())
  const [pollPurpose, setPollPurpose] = useState<PollPurposeId | ''>('')
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
  const [voiceIdBootstrapping, setVoiceIdBootstrapping] = useState(false)
  /** Only block clicks while voice ID is actively being created — not when setup failed (submit retries). */
  const canPublish = !voiceIdBootstrapping
  const toast = useToast()

  const formState = useMemo<CreateMovementFormState>(
    () => ({
      title,
      description,
      category,
      authorName,
      postingIdentity,
      movementType,
      movementFields,
      pollOptions,
      typeExplicitlyChosen,
      goodFaithConfirmed,
    }),
    [
      title,
      description,
      category,
      authorName,
      postingIdentity,
      movementType,
      movementFields,
      pollOptions,
      typeExplicitlyChosen,
      goodFaithConfirmed,
    ],
  )

  function handleMovementTypeChange(next: MovementType) {
    setMovementType(next)
    setMovementFields(emptyMovementFields())
    setPollOptions(emptyPollOptions())
    setMapLocation({ location_name: '', latitude: null, longitude: null })
    if (getMovementConfig(next).requiresProfileIdentity) {
      setPostingIdentity('profile')
    }
  }

  useEffect(() => {
    if (!useWizardMode) return
    if (typeFromUrl && typeFromUrl !== 'quick_youth_poll' && MOVEMENT_TYPE_VALUES.includes(typeFromUrl as MovementType)) {
      setTypeExplicitlyChosen(true)
    }
  }, [useWizardMode, typeFromUrl])

  useEffect(() => {
    if (isPoll && !category) setCategory('Community')
  }, [isPoll, category])

  useEffect(() => {
    if (!useWizardMode) return
    const draft = loadCreateMovementDraft()
    if (!draft) return
    setWizardStep(draft.wizardStep)
    setMovementType(draft.movementType)
    setTitle(draft.title)
    setDescription(draft.description)
    setCategory(draft.category)
    setPostingIdentity(draft.postingIdentity)
    setAuthorNameOverride(draft.authorNameOverride)
    setMovementFields(draft.movementFields)
    setMapLocation(draft.mapLocation)
    setTypeExplicitlyChosen(draft.typeExplicitlyChosen ?? false)
    setGoodFaithConfirmed(draft.goodFaithConfirmed ?? false)
  }, [useWizardMode])

  useEffect(() => {
    if (!isPoll) return
    const timer = window.setTimeout(() => pollQuestionRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [isPoll])

  function persistDraft(step = wizardStep) {
    if (!useWizardMode) return
    saveCreateMovementDraft({
      wizardStep: step,
      movementType,
      title,
      description,
      category,
      postingIdentity,
      authorNameOverride,
      movementFields,
      mapLocation,
      typeExplicitlyChosen,
      goodFaithConfirmed,
    })
  }

  function handleWizardTypeSelect(option: WizardTypeOption) {
    if (option.kind !== 'movement') return
    setTypeExplicitlyChosen(true)
    handleMovementTypeChange(option.value)
  }

  function handleCreateAnother() {
    clearCreateMovementDraft()
    setWizardStep(1)
    setPublishedPostId(null)
    setTypeExplicitlyChosen(false)
    setGoodFaithConfirmed(false)
    setTitle('')
    setDescription('')
    setCategory('')
    setMovementFields(emptyMovementFields())
    setMovementType('raise_voice')
    setPostingIdentity('profile')
    setAuthorNameOverride(null)
    setMapLocation({ location_name: '', latitude: null, longitude: null })
    setFieldErrors({})
    setError(null)
    pendingMedia.clearFiles()
  }

  const previewPost = useMemo(() => {
    if (!user || !useWizardMode) return null
    return buildCreatePreviewPost({
      title,
      description,
      category,
      authorName,
      postingIdentity: effectivePostingIdentity,
      youthVoiceId: profile?.youth_voice_id ?? null,
      movementType,
      movementFields,
      userId: user.id,
    })
  }, [
    user,
    useWizardMode,
    title,
    description,
    category,
    authorName,
    effectivePostingIdentity,
    profile?.youth_voice_id,
    movementType,
    movementFields,
  ])

  function wizardStepValid(step: number): boolean {
    return wizardStepCanContinue(step, {
      ...formState,
      postingIdentity: effectivePostingIdentity,
    })
  }

  function handleWizardContinue() {
    const stepErrors = wizardStepFieldErrors(wizardStep, formState, {
      postingIdentity: effectivePostingIdentity,
    })
    if (hasFieldErrors(stepErrors)) {
      setFieldErrors(stepErrors)
      setError(formatFieldErrorsSummary(stepErrors) || t('create.fixValidation'))
      return
    }
    if (!wizardStepValid(wizardStep)) {
      setError(t('create.fixValidation'))
      return
    }
    setFieldErrors({})
    setError(null)
    const next = Math.min(wizardStep + 1, WIZARD_STEPS)
    setWizardStep(next)
    persistDraft(next)
  }

  function handleWizardBack() {
    setWizardStep((s) => Math.max(1, s - 1))
    setError(null)
  }

  function handleSaveDraftAndExit() {
    persistDraft()
    navigate('/feed')
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
      setTypeExplicitlyChosen(true)
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

  async function publishMovement(e?: React.FormEvent) {
    e?.preventDefault()
    if (submittingRef.current || loading) return

    if (!user) {
      setError(t('create.loginRequired'))
      return
    }

    let youthVoiceId = profile?.youth_voice_id
    if (!youthVoiceId) {
      setVoiceIdBootstrapping(true)
      setError(null)
      try {
        const updated = await ensureYouthVoiceId(user.id)
        youthVoiceId = updated.youth_voice_id
        await refreshProfile()
      } catch (err) {
        setError(formatError(err) || t('create.voiceIdRequired'))
        setVoiceIdBootstrapping(false)
        return
      } finally {
        setVoiceIdBootstrapping(false)
      }
    }

    if (!youthVoiceId) {
      setError(t('create.voiceIdRequired'))
      return
    }

    const resolvedDescription = resolveCreateDescription({
      ...formState,
      postingIdentity: effectivePostingIdentity,
    })

    const errors = validateCreateMovement(formState, {
      postingIdentity: effectivePostingIdentity,
    })
    setFieldErrors(errors)
    if (hasFieldErrors(errors)) {
      setError(t('create.fixValidation'))
      scrollToFirstFieldError(errors)
      formRef.current?.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }

    if (movementSupportsAttachments(movementType) && pendingMedia.hasFiles) {
      const mediaCheck = pendingMedia.validation
      if (!mediaCheck.valid) {
        const msg =
          'issues' in mediaCheck && mediaCheck.issues[0]?.message
            ? mediaCheck.issues[0].message
            : 'Check your attachments.'
        setError(msg)
        return
      }
    }

    submittingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const slots = movementFields.volunteer_slots.trim()
      const goalRaw = movementFields.petition_support_goal.trim()
      const post = await createPost({
        userId: user.id,
        title: title.trim(),
        description: resolvedDescription,
        category: category as Category,
        authorName: authorName.trim(),
        postingIdentity: effectivePostingIdentity,
        youthVoiceId,
        movementType,
        proposed_solution: movementFields.proposed_solution,
        expected_impact: movementFields.expected_impact,
        issue_summary: isPoll ? pollPurpose || undefined : movementFields.issue_summary,
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

      if (useWizardMode) {
        clearCreateMovementDraft()
        setPublishedPostId(post.id)
        toast.success('Your movement is live!', `"${title.trim()}" is now on the feed.`)
      } else {
        navigate(isPoll ? '/polls' : '/feed', {
          replace: true,
          state: {
            toast: {
              type: 'success' as const,
              message: isPoll
                ? t('polls.publishSuccess', { defaultValue: 'Poll published successfully.' })
                : isPetition
                  ? 'Petition published!'
                  : 'Movement published!',
              detail: isPoll
                ? t('polls.pageSubtitle', {
                    defaultValue:
                      'Vote on local priorities, share public opinion, and help communities understand what matters most.',
                  })
                : isPetition
                  ? 'Your petition is now gathering youth support.'
                  : `"${title.trim()}" is now live on the feed.`,
            },
          },
        })
      }
    } catch (err) {
      setError(
        isPoll
          ? t('polls.publishFailed', {
              defaultValue: "We couldn't publish your poll. Please try again.",
            })
          : formatError(err),
      )
      formRef.current?.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  if (useWizardMode) {
    return (
      <>
        {wizardStep === 3 && (
          <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6">
            <ActionPathAI
            currentMovementType={movementType}
            onApplyDraft={(s) => applyActionPathSuggestion(s, 'draft')}
            onApplyFields={(s) => applyActionPathSuggestion(s, 'fields')}
            formDisabled={loading}
          />
          </div>
        )}
        <CreateMovementWizard
          step={wizardStep}
          totalSteps={WIZARD_STEPS}
          onBack={handleWizardBack}
          onContinue={handleWizardContinue}
          canContinue={wizardStepValid(wizardStep)}
          movementType={movementType}
          typeExplicitlyChosen={typeExplicitlyChosen}
          onSelectType={handleWizardTypeSelect}
          title={title}
          onTitleChange={setTitle}
          description={description}
          onDescriptionChange={setDescription}
          movementFields={movementFields}
          onMovementFieldChange={updateMovementField}
          category={category}
          onCategoryChange={setCategory}
          postingIdentity={effectivePostingIdentity}
          onPostingIdentityChange={setPostingIdentity}
          authorName={authorName}
          onAuthorNameChange={(v) => setAuthorNameOverride(v)}
          youthVoiceId={profile?.youth_voice_id}
          requireProfileOnly={requiresProfile}
          mapLocation={mapLocation}
          onMapChange={setMapLocation}
          fieldErrors={fieldErrors}
          previewPost={previewPost}
          loading={loading || uploadingMedia}
          canPublish={canPublish}
          onSubmit={() => void publishMovement()}
          onSaveDraft={handleSaveDraftAndExit}
          onCreateAnother={handleCreateAnother}
          goodFaithConfirmed={goodFaithConfirmed}
          onGoodFaithChange={setGoodFaithConfirmed}
          pendingMedia={pendingMedia}
          uploadingMedia={uploadingMedia}
          error={error}
          voiceIdBootstrapping={voiceIdBootstrapping}
          publishedId={publishedPostId}
        />
      </>
    )
  }

  return (
    <section className="mx-auto min-w-0 max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to={isPoll ? '/polls' : '/feed'}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {isPoll ? t('polls.backToPolls', { defaultValue: 'Back to Community Polls' }) : 'Back to feed'}
      </Link>

      <header className="mb-8">
        <p className="text-sm font-semibold text-accent-600">
          {isPoll ? t('create.pollEyebrow') : t('create.title')}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          {isPoll ? t('create.pollPageTitle') : 'Start a Movement'}
        </h1>
        <p className="mt-2 text-secondary">
          {isPoll ? t('create.pollPageSubtitle') : t('create.subtitle')}
        </p>
        {!isPoll ? (
          <GuidanceHint className="mt-3">
            {t('guidance.microcopy.create', {
              defaultValue:
                'Start with an issue, idea, petition, volunteer drive, or relief need.',
            })}
          </GuidanceHint>
        ) : null}
      </header>

      {!isPoll && (
        <>
        <GuidanceHint className="mb-3">
          {t('guidance.microcopy.actionpath', {
            defaultValue:
              'Not sure how to explain your concern? Let ActionPath AI help structure it.',
          })}
        </GuidanceHint>
        <ActionPathAI
          currentMovementType={movementType}
          onApplyDraft={(s) => applyActionPathSuggestion(s, 'draft')}
          onApplyFields={(s) => applyActionPathSuggestion(s, 'fields')}
          formDisabled={loading}
        />
        </>
      )}

      <form
        ref={formRef}
        onSubmit={(e) => void publishMovement(e)}
        noValidate
        className="card-surface mt-8 space-y-6 p-6 sm:p-8"
      >
        {voiceIdBootstrapping && (
          <p className="rounded-xl border border-accent-200/80 bg-accent-50/80 px-4 py-3 text-sm text-accent-800 dark:border-accent-700/50 dark:bg-accent-950/40 dark:text-accent-200">
            {t('create.voiceIdLoading')}
          </p>
        )}

        {!voiceIdBootstrapping && !profile?.youth_voice_id && user && (
          <p className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
            {t('create.voiceIdPublishHint')}
          </p>
        )}

        {error && (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}

        <fieldset className="space-y-6" disabled={loading}>
          {!isPoll && (
            <MovementTypePicker
              value={movementType}
              onChange={handleMovementTypeChange}
              disabled={loading}
            />
          )}

          {isPoll ? (
            <section
              className="poll-panel space-y-5 p-5 sm:p-6"
              aria-labelledby="poll-details-heading"
            >
              <div>
                <h2 id="poll-details-heading" className="poll-heading text-base font-bold">
                  {t('polls.createFormTitle', { defaultValue: 'Create a Community Poll' })}
                </h2>
                <p className="poll-helper mt-1 text-sm opacity-90">
                  {t('create.pollSectionSubtitle')}
                </p>
              </div>

              <PollPurposePicker
                value={pollPurpose}
                onChange={(id) => {
                  setPollPurpose(id)
                  setCategory(categoryForPollPurpose(id))
                }}
                disabled={loading}
              />

              <FormField label={t('polls.pollQuestion')} id="title" error={fieldErrors.title}>
                <input
                  ref={pollQuestionRef}
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={POST_LIMITS.titleMax}
                  placeholder="e.g. What issue should our community focus on first?"
                  aria-invalid={Boolean(fieldErrors.title)}
                  className={`${inputClass} ${fieldErrors.title ? inputErrorClass : ''}`}
                />
                <CharCount current={title.length} max={POST_LIMITS.titleMax} />
              </FormField>

              <PollFields
                options={pollOptions}
                onChange={setPollOptions}
                errors={fieldErrors}
                disabled={loading}
                priority
              />

              <FormField label="Context (optional)" id="description" error={fieldErrors.description}>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={POST_LIMITS.descriptionMax}
                  placeholder="Add a short note to help voters understand the question (optional)."
                  aria-invalid={Boolean(fieldErrors.description)}
                  className={`${inputClass} resize-y min-h-22 ${fieldErrors.description ? inputErrorClass : ''}`}
                />
                <CharCount current={description.length} max={POST_LIMITS.descriptionMax} />
              </FormField>
            </section>
          ) : (
            <>
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
                label={isPetition ? 'Petition title' : 'Title'}
                id="title"
                error={fieldErrors.title}
              >
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={POST_LIMITS.titleMax}
                  placeholder={
                    isPetition
                      ? 'e.g. Improve Pedestrian Safety Near Schools'
                      : 'Give your movement a clear, compelling title'
                  }
                  aria-invalid={Boolean(fieldErrors.title)}
                  className={`${inputClass} ${fieldErrors.title ? inputErrorClass : ''}`}
                />
                <CharCount current={title.length} max={POST_LIMITS.titleMax} />
              </FormField>

              {!isPetition && (
                <FormField label="Description" id="description" error={fieldErrors.description}>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    maxLength={POST_LIMITS.descriptionMax}
                    placeholder="Describe your movement, who it helps, and what you hope to achieve."
                    aria-invalid={Boolean(fieldErrors.description)}
                    className={`${inputClass} resize-y min-h-35 ${fieldErrors.description ? inputErrorClass : ''}`}
                  />
                  <CharCount current={description.length} max={POST_LIMITS.descriptionMax} />
                  {!fieldErrors.description &&
                    description.length > 0 &&
                    description.length < POST_LIMITS.descriptionMin && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        {t('create.descriptionMinHint', {
                          min: POST_LIMITS.descriptionMin,
                          current: description.length,
                        })}
                      </p>
                    )}
                </FormField>
              )}
            </>
          )}

          {!isPoll && (
            <MovementFields
              movementType={movementType}
              values={movementFields}
              onChange={updateMovementField}
              mapLocation={mapLocation}
              onMapChange={setMapLocation}
              errors={fieldErrors}
              disabled={loading}
            />
          )}

          {!isPoll && (
            <CategoryPicker
              value={category}
              onChange={setCategory}
              error={fieldErrors.category}
              disabled={loading}
            />
          )}

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
              <p className="mt-1 text-xs text-muted">
                Prefilled from your profile. You can change it for this movement only.
              </p>
            </FormField>
          )}
        </fieldset>

        <div className="flex flex-col-reverse gap-3 border-t border-default pt-6 sm:flex-row sm:justify-end">
          <Link
            to={isPoll ? '/polls' : '/feed'}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-default px-6 py-3 text-center text-sm font-semibold text-secondary transition hover:bg-muted"
          >
            {t('polls.cancel', { defaultValue: 'Cancel' })}
          </Link>
          <button
            type="submit"
            disabled={loading || !canPublish}
            aria-busy={loading || voiceIdBootstrapping}
            className="btn-primary motion-essential px-8 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('create.publishing')}
              </>
            ) : voiceIdBootstrapping ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('create.voiceIdLoading')}
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                {isPoll
                  ? t('create.publishPoll', { defaultValue: 'Publish Poll' })
                  : isPetition
                    ? 'Publish petition'
                    : 'Publish movement'}
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  )
}

/** Remount form when sidebar switches between movement vs poll create links. */
export function CreatePostRoute() {
  const [searchParams] = useSearchParams()
  const modeKey = searchParams.get('type') ?? 'movement'
  return <CreatePost key={modeKey} />
}
