import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
import { createPost } from '../lib/posts'
import { formatError } from '../lib/errors'
import { hasFieldErrors, POST_LIMITS, validateReliefCreate } from '../lib/validation'
import type { Category, PostingIdentity } from '../types'

const SUBTYPES: ReliefCreateSubtype[] = ['blood_donation', 'item_donation', 'fundraising']

export default function CreateReliefPost() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const subtypeParam = searchParams.get('subtype') as ReliefCreateSubtype | null

  const [subtype, setSubtype] = useState<ReliefCreateSubtype | null>(
    subtypeParam && SUBTYPES.includes(subtypeParam) ? subtypeParam : null,
  )
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [postingIdentity, setPostingIdentity] = useState<PostingIdentity>('profile')
  const [reliefFields, setReliefFields] = useState<ReliefFieldValues>(emptyReliefFields())
  const [mapLocation, setMapLocation] = useState<MapLocation>({
    location_name: '',
    latitude: null,
    longitude: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})

  const requiresProfile = subtype ? requiresProfileForReliefSubtype(subtype) : false
  const effectivePostingIdentity = requiresProfile ? 'profile' : postingIdentity
  const authorName = profile?.display_name ?? ''

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
    if (!user || !profile || !subtype) return

    const errors = validateReliefCreate({
      title,
      description,
      category,
      authorName,
      postingIdentity: effectivePostingIdentity,
      subtype,
      reliefFields,
    })
    setFieldErrors(errors)
    if (hasFieldErrors(errors)) return

    setLoading(true)
    setError(null)

    try {
      const movementType = movementTypeForReliefSubtype(subtype)
      await createPost({
        userId: user.id,
        title: title.trim(),
        description: description.trim(),
        category: category as Category,
        authorName,
        postingIdentity: effectivePostingIdentity,
        youthVoiceId: profile.youth_voice_id,
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
        location: mapLocation.location_name || reliefFields.collection_location,
        location_name: mapLocation.location_name || undefined,
        latitude: mapLocation.latitude,
        longitude: mapLocation.longitude,
        fundraising_goal_amount: reliefFields.fundraising_goal_amount
          ? parseFloat(reliefFields.fundraising_goal_amount)
          : null,
        fundraising_purpose: reliefFields.fundraising_purpose,
        beneficiary_description: reliefFields.beneficiary_description,
        organizer_transparency_note: reliefFields.organizer_transparency_note,
      })
      navigate('/relief', {
        state: { toast: { type: 'success', message: t('relief.publishSuccess') } },
      })
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto min-w-0 max-w-2xl px-4 py-8 sm:px-6">
      <Link to="/relief" className="btn-ghost mb-6 !min-h-[40px] !px-0">
        <ArrowLeft className="h-4 w-4" />
        {t('relief.backToHub')}
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {t('relief.createTitle')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('relief.createSubtitle')}</p>
      </header>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
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
                className={`${inputClass} min-h-[100px] resize-y`}
                disabled={loading}
              />
            </FormField>

            <CategoryPicker
              value={category}
              onChange={setCategory}
              error={fieldErrors.category}
              disabled={loading}
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

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t('create.publishing')}
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
