import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  HeartHandshake,
  Loader2,
  Megaphone,
  Mic,
  Send,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import CategoryPicker from '../CategoryPicker'
import ChooseYourVoice from '../ChooseYourVoice'
import MovementFields from '../MovementFields'
import MovementMediaUploader from '../media/MovementMediaUploader'
import PostCard from '../PostCard'
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
  { value: 'raise_voice', label: 'Voice', description: 'Raise awareness and stand with a cause.', icon: Mic },
  {
    value: 'youth_petition',
    label: 'Petition',
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
]

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

function WizardProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6" aria-hidden>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
        Step {step} of {total}
      </p>
      <div className="onboarding-progress">
        <div className="onboarding-progress-fill" style={{ width: `${(step / total) * 100}%` }} />
      </div>
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
  onSubmit: () => void
  onSaveDraft: () => void
  pendingMedia: PendingMediaState
  uploadingMedia: boolean
  error: string | null
  publishedId: string | null
  children?: ReactNode
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
  onSubmit,
  onSaveDraft,
  pendingMedia,
  uploadingMedia,
  error,
  publishedId,
}: CreateMovementWizardProps) {
  const showMedia = movementSupportsAttachments(movementType)

  if (publishedId) {
    return (
      <section className="mx-auto min-w-0 max-w-2xl px-4 py-12 text-center sm:px-6">
        <div className="card-surface mx-auto max-w-md p-8">
          <h1 className="text-2xl font-extrabold text-primary">Your movement is live!</h1>
          <p className="mt-2 text-sm text-secondary">
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
    2: 'Why does this matter? Who is affected?',
    3: 'Choose action type',
    4: 'Action details',
    5: 'Preview & publish',
  }

  return (
    <section className="mx-auto min-w-0 max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/feed"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to feed
      </Link>

      <header className="mb-6">
        <p className="text-sm font-semibold text-accent-600">Start a Movement</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          {stepTitles[step] ?? 'Create movement'}
        </h1>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          ForFuture is a safe civic space. Please share responsibly and follow our{' '}
          <Link to="/community-guidelines" className="font-semibold text-accent-600 hover:underline">
            Community Guidelines
          </Link>
          .
        </p>
      </header>

      <WizardProgress step={step} total={totalSteps} />

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div key={step} className="onboarding-step card-surface space-y-6 p-6 sm:p-8">
        {step === 1 && (
          <>
            <FormField label="Movement title" id="title" error={fieldErrors.title}>
              <input
                id="title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                maxLength={POST_LIMITS.titleMax}
                placeholder="Give your movement a clear, compelling title"
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
              <CharCount
                current={movementFields.issue_summary?.length ?? 0}
                max={POST_LIMITS.descriptionMax}
              />
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
            <FormField label="Full description" id="description" error={fieldErrors.description}>
              <textarea
                id="description"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                rows={8}
                maxLength={POST_LIMITS.descriptionMax}
                placeholder="Explain why this matters, who is affected, and what change you hope to see."
                className={`${inputClass} resize-y min-h-40 ${fieldErrors.description ? inputErrorClass : ''}`}
              />
              <CharCount current={description.length} max={POST_LIMITS.descriptionMax} />
            </FormField>
          </>
        )}

        {step === 3 && (
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
                      selected ? 'onboarding-card-option onboarding-card-option-selected' : 'onboarding-card-option'
                    }
                    aria-pressed={selected}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-accent-600">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-primary">{opt.label}</span>
                      <span className="mt-0.5 block text-xs text-secondary">{opt.description}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
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

        {step === 5 && previewPost && (
          <div className="space-y-4">
            <p className="text-sm text-secondary">This is how your movement will appear in the feed.</p>
            <PostCard post={previewPost} detailPath="#" showFollow={false} />
          </div>
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
          <button type="button" onClick={onSaveDraft} className="btn-ghost text-sm" disabled={loading}>
            Save draft and exit
          </button>
        </div>
        {step < totalSteps ? (
          <button type="button" onClick={onContinue} disabled={!canContinue || loading} className="btn-primary">
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !canPublish}
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
