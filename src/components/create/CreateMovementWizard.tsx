import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Lightbulb,
  Loader2,
  Megaphone,
  Mic,
  Scale,
  Send,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CategoryPicker from '../CategoryPicker'
import ChooseYourVoice from '../ChooseYourVoice'
import MovementFields from '../MovementFields'
import MovementMediaUploader from '../media/MovementMediaUploader'
import CreateMovementPreview from './CreateMovementPreview'
import EmptyState from '../EmptyState'
import { FormField, inputClass, inputErrorClass } from '../AuthForm'
import type { MovementFieldValues } from '../../lib/movementFieldValues'
import type { MapLocation } from '../../lib/googleMaps'
import { movementSupportsAttachments } from '../../lib/mediaConfig'
import { POST_LIMITS } from '../../lib/validation'
import type { CreatePostFieldErrors } from '../../lib/validation'
import type { usePendingMovementMedia } from '../../hooks/usePendingMovementMedia'
import type { Category, MovementType, PostingIdentity, Post } from '../../types'

type PendingMediaState = ReturnType<typeof usePendingMovementMedia>

const WIZARD_TYPES: {
  value: MovementType
  label: string
  description: string
  icon: typeof Mic
}[] = [
  {
    value: 'raise_voice',
    label: 'Raise Your Voice',
    description: 'Speak out about issues that deserve attention.',
    icon: Mic,
  },
  {
    value: 'idea_for_change',
    label: 'Idea for Change',
    description: 'Share a practical idea to improve your community.',
    icon: Lightbulb,
  },
  {
    value: 'youth_petition',
    label: 'Youth Petition',
    description: 'Collect signatures for a specific change.',
    icon: Megaphone,
  },
  {
    value: 'volunteer_drive',
    label: 'Volunteer Drive',
    description: 'Organize people to show up and help.',
    icon: Users,
  },
  {
    value: 'fundraising',
    label: 'Relief Appeal',
    description: 'Mobilize support for urgent community needs.',
    icon: HeartHandshake,
  },
  {
    value: 'peaceful_civic_action',
    label: 'Peaceful Civic Action',
    description: 'Plan lawful awareness or community action.',
    icon: Scale,
  },
]

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

function WizardProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="create-wizard-progress" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={total} aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={i < step ? 'create-wizard-step-dot create-wizard-step-dot-active' : 'create-wizard-step-dot'}
        />
      ))}
    </div>
  )
}

export interface CreateMovementWizardProps {
  step: number
  totalSteps: number
  onBack: () => void
  onContinue: () => void
  canContinue: boolean
  movementType: MovementType
  onMovementTypeChange: (t: MovementType) => void
  title: string
  onTitleChange: (v: string) => void
  description: string
  onDescriptionChange: (v: string) => void
  movementFields: MovementFieldValues
  onMovementFieldChange: (key: keyof MovementFieldValues, value: string) => void
  category: Category | ''
  onCategoryChange: (c: Category | '') => void
  postingIdentity: PostingIdentity
  onPostingIdentityChange: (p: PostingIdentity) => void
  authorName: string
  onAuthorNameChange: (v: string) => void
  youthVoiceId?: string | null
  requireProfileOnly: boolean
  mapLocation: MapLocation
  onMapChange: (loc: MapLocation) => void
  fieldErrors: CreatePostFieldErrors
  previewPost: Post | null
  loading: boolean
  canPublish: boolean
  voiceIdBootstrapping?: boolean
  onSubmit: () => void
  onSaveDraft: () => void
  pendingMedia: PendingMediaState
  uploadingMedia: boolean
  error: string | null
  publishedId: string | null
}

export default function CreateMovementWizard({
  step,
  totalSteps,
  onBack,
  onContinue,
  canContinue,
  movementType,
  onMovementTypeChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  movementFields,
  onMovementFieldChange,
  category,
  onCategoryChange,
  postingIdentity,
  onPostingIdentityChange,
  authorName,
  onAuthorNameChange,
  youthVoiceId,
  requireProfileOnly,
  mapLocation,
  onMapChange,
  fieldErrors,
  previewPost,
  loading,
  canPublish,
  voiceIdBootstrapping,
  onSubmit,
  onSaveDraft,
  pendingMedia,
  uploadingMedia,
  error,
  publishedId,
}: CreateMovementWizardProps) {
  const { t } = useTranslation()
  const showMedia = movementSupportsAttachments(movementType)
  const isPetition = movementType === 'youth_petition'

  if (publishedId) {
    return (
      <section className="mx-auto min-w-0 max-w-2xl px-4 py-12 text-center sm:px-6">
        <div className="card-surface mx-auto max-w-md p-8 sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-primary">Your movement is live!</h1>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            Thank you for raising your voice. Your community can now discover and support it.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link to={`/feed/${publishedId}`} className="btn-primary">
              View Movement
            </Link>
            <Link to="/feed" className="btn-secondary">
              Back to feed
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const stepTitles: Record<number, string> = {
    1: 'What issue do you want to raise?',
    2: 'Why does this matter?',
    3: 'Choose your action type',
    4: 'Details & category',
    5: 'Review & publish',
  }

  const stepHints: Record<number, string> = {
    1: 'Give your movement a clear title and a short summary of the problem.',
    2: 'Help others understand who is affected and why action is needed.',
    3: 'Pick how you want to make a difference. You can change this before publishing.',
    4: 'Add any type-specific details, choose a category, and set how you appear.',
    5: 'Check everything looks right, then publish to the feed.',
  }

  return (
    <section className="create-movement-shell mx-auto min-w-0 max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        to="/feed"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to feed
      </Link>

      <header className="mb-6">
        <p className="text-sm font-semibold text-accent-600 dark:text-accent-400">
          {t('create.title', { defaultValue: 'Create a Youth Movement' })}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          {stepTitles[step] ?? 'Create movement'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">{stepHints[step]}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          ForFuture is a safe civic space. Please share responsibly and follow our{' '}
          <Link to="/community-guidelines" className="font-semibold text-accent-600 hover:underline dark:text-accent-400">
            Community Guidelines
          </Link>
          .
        </p>
      </header>

      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
        Step {step} of {totalSteps}
      </p>
      <WizardProgress step={step} total={totalSteps} />

      {voiceIdBootstrapping && (
        <p className="mb-4 rounded-xl border border-accent-200/80 bg-accent-50/80 px-4 py-3 text-sm text-accent-800 dark:border-accent-700/50 dark:bg-accent-950/40 dark:text-accent-200">
          {t('create.voiceIdLoading', { defaultValue: 'Setting up your Youth Voice ID…' })}
        </p>
      )}

      {error && (
        <p
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      )}

      <div key={step} className="onboarding-step card-surface space-y-6 p-5 sm:p-8">
        {step === 1 && (
          <>
            <FormField label="Movement title *" id="title" error={fieldErrors.title}>
              <input
                id="title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                maxLength={POST_LIMITS.titleMax}
                placeholder="e.g. Safer routes to school for every student"
                aria-invalid={Boolean(fieldErrors.title)}
                className={`${inputClass} ${fieldErrors.title ? inputErrorClass : ''}`}
              />
              <CharCount current={title.length} max={POST_LIMITS.titleMax} />
            </FormField>
            <FormField label="Short issue summary" id="issue_summary" error={fieldErrors.issue_summary}>
              <textarea
                id="issue_summary"
                value={movementFields.issue_summary}
                onChange={(e) => onMovementFieldChange('issue_summary', e.target.value)}
                rows={4}
                maxLength={POST_LIMITS.descriptionMax}
                placeholder="Summarize the problem in a few sentences."
                className={`${inputClass} resize-y min-h-28`}
              />
              <CharCount current={movementFields.issue_summary?.length ?? 0} max={POST_LIMITS.descriptionMax} />
            </FormField>
          </>
        )}

        {step === 2 && (
          <>
            {showMedia && (
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
            {!isPetition && (
              <FormField label="Full description *" id="description" error={fieldErrors.description}>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  rows={8}
                  maxLength={POST_LIMITS.descriptionMax}
                  placeholder="Explain why this matters, who is affected, and what change you hope to see."
                  aria-invalid={Boolean(fieldErrors.description)}
                  className={`${inputClass} resize-y min-h-40 ${fieldErrors.description ? inputErrorClass : ''}`}
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
            {isPetition && (
              <p className="text-sm text-secondary">
                Petition details are collected in the next step after you choose action type.
              </p>
            )}
          </>
        )}

        {step === 3 && (
          <fieldset>
            <legend className="sr-only">Movement action type</legend>
            <ul className="grid gap-3 sm:grid-cols-2">
              {WIZARD_TYPES.map((opt) => {
                const Icon = opt.icon
                const selected = movementType === opt.value
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => onMovementTypeChange(opt.value)}
                      className={
                        selected
                          ? 'onboarding-card-option onboarding-card-option-selected'
                          : 'onboarding-card-option'
                      }
                      aria-pressed={selected}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-accent-600 dark:text-accent-400">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 text-left">
                        <span className="block text-sm font-bold text-primary">{opt.label}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-secondary">
                          {opt.description}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </fieldset>
        )}

        {step === 4 && (
          <>
            <MovementFields
              movementType={movementType}
              values={movementFields}
              onChange={onMovementFieldChange}
              mapLocation={mapLocation}
              onMapChange={onMapChange}
              errors={fieldErrors}
              disabled={loading}
            />
            <CategoryPicker
              value={category}
              onChange={onCategoryChange}
              error={fieldErrors.category}
              disabled={loading}
            />
            <ChooseYourVoice
              value={postingIdentity}
              onChange={onPostingIdentityChange}
              youthVoiceId={youthVoiceId}
              disabled={loading}
              requireProfileOnly={requireProfileOnly}
            />
            {(requireProfileOnly || postingIdentity === 'profile') && (
              <FormField label="Author name" id="authorName" error={fieldErrors.authorName}>
                <input
                  id="authorName"
                  value={authorName}
                  onChange={(e) => onAuthorNameChange(e.target.value)}
                  maxLength={POST_LIMITS.authorMax}
                  className={`${inputClass} ${fieldErrors.authorName ? inputErrorClass : ''}`}
                />
              </FormField>
            )}
          </>
        )}

        {step === 5 && (
          <>
            {previewPost ? (
              <CreateMovementPreview post={previewPost} />
            ) : (
              <EmptyState
                icon={Megaphone}
                title="Complete required fields"
                description="Add a title, description, and category before publishing. Use Back to edit any step."
              />
            )}
          </>
        )}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {step > 1 && (
            <button type="button" onClick={onBack} className="btn-secondary" disabled={loading}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back
            </button>
          )}
          {step === 5 && (
            <button type="button" onClick={onBack} className="btn-ghost text-sm" disabled={loading}>
              Back to edit
            </button>
          )}
          <button type="button" onClick={onSaveDraft} className="btn-ghost text-sm" disabled={loading}>
            Save draft and exit
          </button>
        </div>
        {step < totalSteps ? (
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue || loading || voiceIdBootstrapping}
            className="btn-primary"
          >
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !canPublish || !previewPost || voiceIdBootstrapping}
            className="btn-primary"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Publishing…
              </>
            ) : (
              <>
                <Send className="h-5 w-5" aria-hidden />
                Publish Movement
              </>
            )}
          </button>
        )}
      </div>
    </section>
  )
}
