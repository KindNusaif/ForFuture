import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CategoryPicker from '../components/CategoryPicker'
import ChooseYourVoice from '../components/ChooseYourVoice'
import ReliefHubFields from '../components/relief/ReliefHubFields'
import ReliefSubtypePicker from '../components/relief/ReliefSubtypePicker'
import { FormField, inputClass, inputErrorClass } from '../components/AuthForm'
import { useAuth } from '../hooks/useAuth'
import { emptyReliefFields } from '../lib/reliefFieldValues'
import type { ReliefFieldValues } from '../lib/reliefFieldValues'
import type { MapLocation } from '../lib/googleMaps'
import {
  donationSubtypeForCreate,
  movementTypeForReliefSubtype,
  requiresProfileForReliefSubtype,
  type ReliefCreateSubtype,
} from '../lib/reliefHub'
import { scrollToFirstFieldError } from '../lib/createPostForm'
import { createPost } from '../lib/posts'
import { ensureYouthVoiceId } from '../lib/auth'
import { uploadMovementAttachments } from '../lib/movementAttachments'
import MovementMediaUploader from '../components/media/MovementMediaUploader'
import { usePendingMovementMedia } from '../hooks/usePendingMovementMedia'
import { formatError } from '../lib/errors'
import { enrichReliefDescription } from '../lib/reliefDescription'
import {
  formatFieldErrorsSummary,
  hasFieldErrors,
  POST_LIMITS,
  validateReliefCreate,
} from '../lib/validation'
import type { Category, PostingIdentity } from '../types'

const SUBTYPES: ReliefCreateSubtype[] = ['blood_donation', 'item_donation', 'fundraising']

interface ActionPathReliefDraft {
  subtype: ReliefCreateSubtype
  title: string
  description: string
  reliefHints?: Partial<Record<keyof ReliefFieldValues, string>>
}

export default function CreateReliefPost() {
  const { t } = useTranslation()
  const { user, profile, refreshProfile } = useAuth()
  const submittingRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const subtypeParam = searchParams.get('subtype') as ReliefCreateSubtype | null
  const actionPathDraft = (location.state as { actionPathDraft?: ActionPathReliefDraft } | null)
    ?.actionPathDraft

  const [subtype, setSubtype] = useState<ReliefCreateSubtype | null>(() => {
    if (actionPathDraft?.subtype) return actionPathDraft.subtype
    if (subtypeParam && SUBTYPES.includes(subtypeParam)) return subtypeParam
    return null
  })
  const [title, setTitle] = useState(actionPathDraft?.title ?? '')
  const [description, setDescription] = useState(actionPathDraft?.description ?? '')
  const [category, setCategory] = useState<Category | ''>('')
  const [authorNameOverride, setAuthorNameOverride] = useState<string | null>(null)
  const [postingIdentity, setPostingIdentity] = useState<PostingIdentity>('profile')
  const [reliefFields, setReliefFields] = useState<ReliefFieldValues>(() => {
    const base = emptyReliefFields()
    const hints = actionPathDraft?.reliefHints
    if (!hints) return base
    return { ...base, ...hints }
  })
  const [mapLocation, setMapLocation] = useState<MapLocation>({
    location_name: '',
    latitude: null,
    longitude: null,
  })
  const [loading, setLoading] = useState(false)
  const [voiceIdBootstrapping, setVoiceIdBootstrapping] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})
  const pendingMedia = usePendingMovementMedia()

  const requiresProfile = subtype ? requiresProfileForReliefSubtype(subtype) : false
  const effectivePostingIdentity = requiresProfile ? 'profile' : postingIdentity
  const defaultAuthorName = profile?.display_name ?? ''
  const authorName = authorNameOverride ?? defaultAuthorName
  const showAuthorField =
    effectivePostingIdentity === 'profile' &&
    (!defaultAuthorName.trim() || Boolean(fieldErrors.authorName))

  function handleSubtypeChange(next: ReliefCreateSubtype) {
    setSubtype(next)
    setReliefFields(emptyReliefFields())
    setMapLocation({ location_name: '', latitude: null, longitude: null })
    if (requiresProfileForReliefSubtype(next)) setPostingIdentity('profile')
  }

  function updateField(key: keyof ReliefFieldValues, value: string) {
    setReliefFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || loading) return

    if (!user) {
      setError(t('relief.loginRequired'))
      return
    }

    if (!subtype) {
      setError(t('relief.chooseSubtype'))
      return
    }

    let youthVoiceId = profile?.youth_voice_id
    if (effectivePostingIdentity === 'youth_voice' && !youthVoiceId) {
      setVoiceIdBootstrapping(true)
      setError(null)
      try {
        const updated = await ensureYouthVoiceId(user.id)
        youthVoiceId = updated.youth_voice_id
        await refreshProfile()
      } catch (err) {
        setError(formatError(err) || t('relief.voiceIdRequired'))
        setVoiceIdBootstrapping(false)
        return
      } finally {
        setVoiceIdBootstrapping(false)
      }
    }

    if (effectivePostingIdentity === 'youth_voice' && !youthVoiceId) {
      setError(t('relief.voiceIdRequired'))
      return
    }

    const resolvedAuthorName =
      effectivePostingIdentity === 'profile' ? authorName.trim() : authorName

    const publishDescription = enrichReliefDescription(description, title, subtype, reliefFields)

    const errors = validateReliefCreate({
      title,
      description: publishDescription,
      category,
      authorName: resolvedAuthorName,
      postingIdentity: effectivePostingIdentity,
      subtype,
      reliefFields,
    })
    setFieldErrors(errors)
    if (hasFieldErrors(errors)) {
      setError(formatFieldErrorsSummary(errors) || t('relief.fixValidation'))
      scrollToFirstFieldError(errors)
      return
    }

    if (pendingMedia.hasFiles && !pendingMedia.validation.valid) {
      setError(pendingMedia.validation.issues[0]?.message ?? 'Check your attachments.')
      return
    }

    const locationLabel =
      mapLocation.location_name.trim() ||
      reliefFields.collection_location.trim() ||
      reliefFields.hospital_or_organizer.trim() ||
      undefined

    submittingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const movementType = movementTypeForReliefSubtype(subtype)
      const post = await createPost({
        userId: user.id,
        title: title.trim(),
        description: publishDescription,
        category: category as Category,
        authorName: resolvedAuthorName,
        postingIdentity: effectivePostingIdentity,
        youthVoiceId: youthVoiceId ?? profile?.youth_voice_id ?? '',
        movementType,
        donation_subtype: donationSubtypeForCreate(subtype),
        contact_note: reliefFields.contact_note,
        blood_group: reliefFields.blood_group,
        hospital_or_organizer: reliefFields.hospital_or_organizer,
        urgency_level: reliefFields.urgency_level,
        donors_needed: reliefFields.donors_needed
          ? parseInt(reliefFields.donors_needed, 10)
          : null,
        needed_by_date: reliefFields.needed_by_date || undefined,
        item_category: reliefFields.item_category,
        items_needed: reliefFields.items_needed,
        quantity_needed: reliefFields.quantity_needed
          ? parseInt(reliefFields.quantity_needed, 10)
          : null,
        beneficiary_group: reliefFields.beneficiary_group,
        collection_location: reliefFields.collection_location,
        relief_deadline: reliefFields.relief_deadline || undefined,
        location: locationLabel,
        location_name: locationLabel,
        latitude: mapLocation.latitude,
        longitude: mapLocation.longitude,
        fundraising_goal_amount: reliefFields.fundraising_goal_amount
          ? parseFloat(reliefFields.fundraising_goal_amount)
          : null,
        fundraising_purpose: reliefFields.fundraising_purpose,
        beneficiary_description: reliefFields.beneficiary_description,
        organizer_transparency_note: reliefFields.organizer_transparency_note,
      })

      if (pendingMedia.hasFiles) {
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
            `${formatError(uploadErr)} Your relief post was published, but some files could not be attached.`,
          )
          setLoading(false)
          setUploadingMedia(false)
          return
        } finally {
          setUploadingMedia(false)
        }
      }

      navigate('/relief', {
        state: { toast: { type: 'success', message: t('relief.publishSuccess') } },
      })
    } catch (err) {
      setError(formatError(err))
      formRef.current?.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto min-w-0 max-w-2xl px-4 py-8 sm:px-6">
      <Link to="/relief" className="btn-ghost mb-6 min-h-10! px-0!">
        <ArrowLeft className="h-4 w-4" />
        {t('relief.backToHub')}
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          {t('relief.createTitle')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">{t('relief.createSubtitle')}</p>
      </header>

      <form ref={formRef} onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-6">
        {error && (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}

        {voiceIdBootstrapping && (
          <p className="rounded-xl border border-accent-200/80 bg-accent-50/80 px-4 py-3 text-sm text-accent-800 dark:border-accent-700/50 dark:bg-accent-950/40 dark:text-accent-200">
            {t('create.voiceIdLoading')}
          </p>
        )}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
            {t('relief.chooseSubtype')}
          </p>
          <ReliefSubtypePicker value={subtype} onChange={handleSubtypeChange} disabled={loading} />
        </div>

        {subtype && (
          <>
            {requiresProfile ? (
              <p className="rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-900">
                {t('relief.fundraisingProfileRequired')}
              </p>
            ) : (
              <ChooseYourVoice
                value={postingIdentity}
                onChange={setPostingIdentity}
                youthVoiceId={profile?.youth_voice_id}
                disabled={loading}
              />
            )}

            <FormField label={t('create.titleLabel')} id="title" error={fieldErrors.title}>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={POST_LIMITS.titleMax}
                aria-invalid={Boolean(fieldErrors.title)}
                className={`${inputClass} ${fieldErrors.title ? inputErrorClass : ''}`}
                disabled={loading}
              />
            </FormField>

            <FormField
              label={t('create.descriptionLabel')}
              id="description"
              error={fieldErrors.description}
            >
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={POST_LIMITS.descriptionMax}
                aria-invalid={Boolean(fieldErrors.description)}
                className={`${inputClass} min-h-25 resize-y ${fieldErrors.description ? inputErrorClass : ''}`}
                disabled={loading}
              />
              {!fieldErrors.description &&
                description.length > 0 &&
                description.length < POST_LIMITS.reliefDescriptionMin && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    {t('relief.descriptionMinHint', {
                      min: POST_LIMITS.reliefDescriptionMin,
                      current: description.length,
                    })}
                  </p>
                )}
              <p className="mt-1 text-xs text-muted">
                {t('relief.descriptionReliefHint')}
              </p>
            </FormField>

            {showAuthorField && (
              <FormField label={t('relief.authorNameLabel')} id="authorName" error={fieldErrors.authorName}>
                <input
                  id="authorName"
                  value={authorName}
                  onChange={(e) => setAuthorNameOverride(e.target.value)}
                  maxLength={POST_LIMITS.authorMax}
                  placeholder={t('relief.authorNamePh')}
                  aria-invalid={Boolean(fieldErrors.authorName)}
                  className={`${inputClass} ${fieldErrors.authorName ? inputErrorClass : ''}`}
                  disabled={loading}
                />
              </FormField>
            )}

            <CategoryPicker
              value={category}
              onChange={setCategory}
              error={fieldErrors.category}
              disabled={loading}
            />

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

            <ReliefHubFields
              subtype={subtype}
              values={reliefFields}
              onChange={updateField}
              mapLocation={mapLocation}
              onMapChange={setMapLocation}
              errors={fieldErrors}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || uploadingMedia || voiceIdBootstrapping}
              aria-busy={loading || uploadingMedia || voiceIdBootstrapping}
              className="btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading || uploadingMedia ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t('relief.publishing')}
                </>
              ) : voiceIdBootstrapping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t('create.voiceIdLoading')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden />
                  {t('relief.publish')}
                </>
              )}
            </button>
          </>
        )}
      </form>
    </section>
  )
}
