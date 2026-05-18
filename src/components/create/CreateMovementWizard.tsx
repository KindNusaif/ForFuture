import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  Megaphone,
  Send,
  Share2,
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
import { isPetitionMovement } from '../../lib/petitions'
import {
  WIZARD_STEP_HINTS,
  WIZARD_STEP_TITLES,
  WIZARD_TYPE_OPTIONS,
  type WizardTypeOption,
} from '../../lib/createWizardConfig'
import { POST_LIMITS } from '../../lib/validation'
import type { CreatePostFieldErrors } from '../../lib/validation'
import type { usePendingMovementMedia } from '../../hooks/usePendingMovementMedia'
import type { Category, MovementType, PostingIdentity, Post } from '../../types'

type PendingMediaState = ReturnType<typeof usePendingMovementMedia>

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
    <div
      className="create-wizard-progress"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${step} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={
            i < step ? 'create-wizard-step-dot create-wizard-step-dot-active' : 'create-wizard-step-dot'
          }
        />
      ))}
    </div>
  )
}

function isTypeSelected(
  movementType: MovementType,
  option: WizardTypeOption,
  typeExplicitlyChosen: boolean,
): boolean {
  if (!typeExplicitlyChosen) return false
  if (option.kind === 'movement') return option.value === movementType
  return false
}

export interface CreateMovementWizardProps {
  step: number
  totalSteps: number
  onBack: () => void
  onContinue: () => void
  canContinue: boolean
  movementType: MovementType
  typeExplicitlyChosen: boolean
  onSelectType: (option: WizardTypeOption) => void
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
  goodFaithConfirmed: boolean
  onGoodFaithChange: (v: boolean) => void
  onSubmit: () => void
  onSaveDraft: () => void
  onCreateAnother: () => void
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
  typeExplicitlyChosen,
  onSelectType,
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
  goodFaithConfirmed,
  onGoodFaithChange,
  onSubmit,
  onSaveDraft,
  onCreateAnother,
  pendingMedia,
  uploadingMedia,
  error,
  publishedId,
}: CreateMovementWizardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const showMedia = movementSupportsAttachments(movementType)
  const isPetition = isPetitionMovement(movementType)
  const hasRegionalLocation = Boolean(
    mapLocation.location_name?.trim() ||
      movementFields.location?.trim() ||
      movementFields.action_location?.trim(),
  )

  async function handleShare(publishedIdValue: string) {
    const url = `${window.location.origin}/feed/${publishedIdValue}`
    if (navigator.share) {
      try {
        await navigator.share({ title: title.trim() || 'Youth movement', url })
        return
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* ignore */
    }
  }

  if (publishedId) {
    return (
      <section className="mx-auto min-w-0 max-w-2xl px-4 py-12 text-center sm:px-6">
        <div className="card-surface mx-auto max-w-md p-8 sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-primary">Your movement is live!</h1>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            People can now discover, support, follow, and act on it.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link to={`/feed/${publishedId}`} className="btn-primary">
              View Movement
            </Link>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void handleShare(publishedId)}
            >
              <Share2 className="h-4 w-4" aria-hidden />
              Share Movement
            </button>
            <button type="button" onClick={onCreateAnother} className="btn-ghost text-sm">
              Create Another
            </button>
            <Link to="/feed" className="btn-ghost text-sm">
              Back to feed
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="create-movement-shell mx-auto min-w-0 max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        to="/feed"
        className="mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to feed
      </Link>

      <header className="mb-6">
        <p className="text-sm font-semibold text-accent-600 dark:text-accent-400">
          {t('create.title', { defaultValue: 'Create a Youth Movement' })}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          {WIZARD_STEP_TITLES[step] ?? 'Create movement'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          {WIZARD_STEP_HINTS[step]}
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

      <div key={step} className="create-wizard-step-panel onboarding-step card-surface space-y-6 p-5 sm:p-8">
        {step === 1 && (
          <fieldset>
            <legend className="sr-only">Movement action type</legend>
            <ul className="grid gap-3 sm:grid-cols-2">
              {WIZARD_TYPE_OPTIONS.map(({ option, label, description, icon: Icon }) => {
                const selected = isTypeSelected(movementType, option, typeExplicitlyChosen)
                return (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => {
                        if (option.kind === 'relief') {
                          navigate('/relief/create')
                          return
                        }
                        if (option.kind === 'poll') {
                          navigate('/create?type=quick_youth_poll')
                          return
                        }
                        onSelectType(option)
                      }}
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
                        <span className="block text-sm font-bold text-primary">{label}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-secondary">
                          {description}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </fieldset>
        )}

        {step === 2 && (
          <CategoryPicker
            value={category}
            onChange={onCategoryChange}
            error={fieldErrors.category}
            disabled={loading}
          />
        )}

        {step === 3 && (
          <>
            <FormField label="Movement title *" id="title" error={fieldErrors.title}>
              <input
                id="title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                maxLength={POST_LIMITS.titleMax}
                placeholder="Give your movement a clear, powerful title."
                aria-invalid={Boolean(fieldErrors.title)}
                className={`${inputClass} ${fieldErrors.title ? inputErrorClass : ''}`}
              />
              <CharCount current={title.length} max={POST_LIMITS.titleMax} />
            </FormField>

            <FormField label="Short summary" id="issue_summary" error={fieldErrors.issue_summary}>
              <textarea
                id="issue_summary"
                value={movementFields.issue_summary}
                onChange={(e) => onMovementFieldChange('issue_summary', e.target.value)}
                rows={2}
                maxLength={POST_LIMITS.descriptionMax}
                placeholder="Summarize the issue in one or two lines."
                className={`${inputClass} resize-y min-h-20`}
              />
              <CharCount
                current={movementFields.issue_summary?.length ?? 0}
                max={POST_LIMITS.descriptionMax}
              />
            </FormField>

            {!isPetition && (
              <>
                <FormField
                  label="What is happening? *"
                  id="description"
                  error={fieldErrors.description}
                >
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    rows={5}
                    maxLength={POST_LIMITS.descriptionMax}
                    placeholder="Describe the problem, need, or opportunity in your community."
                    aria-invalid={Boolean(fieldErrors.description)}
                    className={`${inputClass} resize-y min-h-32 ${fieldErrors.description ? inputErrorClass : ''}`}
                  />
                  <CharCount current={description.length} max={POST_LIMITS.descriptionMax} />
                </FormField>

                <FormField label="Why does it matter?" id="expected_impact">
                  <textarea
                    id="expected_impact"
                    value={movementFields.expected_impact}
                    onChange={(e) => onMovementFieldChange('expected_impact', e.target.value)}
                    rows={3}
                    maxLength={POST_LIMITS.fieldMax}
                    placeholder="Explain who is affected and why people should care."
                    className={`${inputClass} resize-y min-h-24`}
                  />
                </FormField>

                <FormField label="Desired change" id="desired_change">
                  <textarea
                    id="desired_change"
                    value={movementFields.desired_change}
                    onChange={(e) => onMovementFieldChange('desired_change', e.target.value)}
                    rows={3}
                    maxLength={POST_LIMITS.fieldMax}
                    placeholder="What action, outcome, or response are you hoping for?"
                    className={`${inputClass} resize-y min-h-24`}
                  />
                </FormField>
              </>
            )}

            {isPetition && (
              <p className="text-sm text-secondary">
                Petition-specific details are collected in the next step.
              </p>
            )}

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
          </>
        )}

        {step === 4 && (
          <MovementFields
            movementType={movementType}
            values={movementFields}
            onChange={onMovementFieldChange}
            mapLocation={mapLocation}
            onMapChange={onMapChange}
            errors={fieldErrors}
            disabled={loading}
            wizardMode
          />
        )}

        {step === 5 && (
          <>
            <ChooseYourVoice
              value={postingIdentity}
              onChange={onPostingIdentityChange}
              youthVoiceId={youthVoiceId}
              disabled={loading}
              requireProfileOnly={requireProfileOnly}
            />
            {postingIdentity === 'youth_voice' && (
              <p className="rounded-xl border border-default bg-muted/50 px-4 py-3 text-xs leading-relaxed text-secondary">
                Your public identity stays protected while ForFuture preserves internal
                accountability for safety and trust.
              </p>
            )}
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
            {hasRegionalLocation && (
              <p className="flex gap-2 rounded-xl border border-default bg-muted/40 px-4 py-3 text-xs leading-relaxed text-secondary">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-600 dark:text-accent-400" aria-hidden />
                For safety, public activity is shown at a broad regional level when applicable.
              </p>
            )}
            <p className="text-xs leading-relaxed text-muted">
              ForFuture is a safe civic space. Please share responsibly and respectfully. See our{' '}
              <Link
                to="/community-guidelines"
                className="font-semibold text-accent-600 hover:underline dark:text-accent-400"
              >
                Community Guidelines
              </Link>
              .
            </p>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-default bg-surface px-4 py-3">
              <input
                type="checkbox"
                checked={goodFaithConfirmed}
                onChange={(e) => onGoodFaithChange(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-default text-accent-600 focus-visible:ring-2 focus-visible:ring-accent-500"
              />
              <span className="text-sm text-secondary">
                I confirm this movement is shared in good faith.
              </span>
            </label>
          </>
        )}

        {step === 6 && (
          <>
            {previewPost ? (
              <CreateMovementPreview post={previewPost} />
            ) : (
              <EmptyState
                icon={Megaphone}
                title="Complete required fields"
                description="Add a title, category, and story before publishing. Use Back to edit any step."
              />
            )}
          </>
        )}
      </div>

      <div className="create-wizard-footer mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {step > 1 && (
            <button type="button" onClick={onBack} className="btn-secondary min-h-11" disabled={loading}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back
            </button>
          )}
          {step === 6 && (
            <button type="button" onClick={onBack} className="btn-ghost min-h-11 text-sm" disabled={loading}>
              Back to edit
            </button>
          )}
          <button
            type="button"
            onClick={onSaveDraft}
            className="btn-ghost min-h-11 text-sm"
            disabled={loading}
          >
            Save draft and exit
          </button>
        </div>
        {step < totalSteps ? (
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue || loading || voiceIdBootstrapping}
            className="btn-primary min-h-11"
          >
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !canPublish || !previewPost || voiceIdBootstrapping}
            className="btn-primary min-h-11"
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
                Publish Youth Movement
              </>
            )}
          </button>
        )}
      </div>
    </section>
  )
}
