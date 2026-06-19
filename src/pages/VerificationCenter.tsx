import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Loader2, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import {
  fetchMyOrganizationVerificationRequest,
  submitOrganizationVerification,
  type OrganizationType,
  type OrganizationVerificationRequest,
} from '../lib/organizationVerification'
import { isVerifiedOrganizer } from '../lib/reliefCampaignPublic'
import { formatError } from '../lib/errors'
import { isMissingRelation } from '../lib/supabaseErrors'

const ORG_TYPES: OrganizationType[] = [
  'ngo',
  'charity',
  'nonprofit',
  'youth_organization',
  'community_group',
  'other',
]

export default function VerificationCenter() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const toast = useToast()
  const verified = isVerifiedOrganizer(profile)

  const [existing, setExisting] = useState<OrganizationVerificationRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [setupUnavailable, setSetupUnavailable] = useState(false)

  const [organization_name, setOrganizationName] = useState('')
  const [organization_type, setOrganizationType] = useState<OrganizationType>('ngo')
  const [mission, setMission] = useState('')
  const [contact_name, setContactName] = useState('')
  const [contact_email, setContactEmail] = useState('')
  const [contact_phone, setContactPhone] = useState('')
  const [operating_area, setOperatingArea] = useState('')
  const [website_url, setWebsiteUrl] = useState('')
  const [registration_reference, setRegistrationReference] = useState('')
  const [confirm_accuracy, setConfirmAccuracy] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchMyOrganizationVerificationRequest()
      .then((row) => {
        if (cancelled) return
        setExisting(row)
        if (row) {
          setOrganizationName(row.organization_name)
          setOrganizationType(row.organization_type)
          setMission(row.mission)
          setContactName(row.contact_name)
          setContactEmail(row.contact_email)
          setContactPhone(row.contact_phone ?? '')
          setOperatingArea(row.operating_area ?? '')
          setWebsiteUrl(row.website_url ?? '')
          setRegistrationReference(row.registration_reference ?? '')
        }
      })
      .catch((err) => {
        if (cancelled) return
        if (isMissingRelation(err)) {
          setSetupUnavailable(true)
          setError(formatError(err, { verificationCenter: true }))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!confirm_accuracy) {
      setError(t('reliefHub.verificationConfirmRequired'))
      return
    }
    setSubmitting(true)
    try {
      const row = await submitOrganizationVerification({
        organization_name,
        organization_type,
        mission,
        contact_name,
        contact_email,
        contact_phone,
        operating_area,
        website_url,
        registration_reference,
        confirm_accuracy,
      })
      setExisting(row)
      toast.success(t('reliefHub.verificationSubmitted'))
    } catch (err) {
      if (isMissingRelation(err)) {
        setSetupUnavailable(true)
      }
      setError(formatError(err, { verificationCenter: true }))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="verification-center-page mx-auto max-w-2xl px-4 py-8 sm:px-6" aria-busy="true">
        <div className="skeleton-shimmer mb-6 h-4 w-36 rounded" aria-hidden />
        <div className="card-surface space-y-4 p-6 sm:p-8">
          <div className="skeleton-shimmer h-4 w-28 rounded-full" aria-hidden />
          <div className="skeleton-shimmer h-8 w-3/4 rounded-lg" aria-hidden />
          <div className="skeleton-shimmer h-4 w-full rounded" aria-hidden />
          <div className="skeleton-shimmer h-4 w-11/12 rounded" aria-hidden />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="skeleton-shimmer h-11 rounded-xl" aria-hidden />
            <div className="skeleton-shimmer h-11 rounded-xl" aria-hidden />
          </div>
          <div className="skeleton-shimmer h-32 w-full rounded-xl" aria-hidden />
        </div>
      </section>
    )
  }

  return (
    <section className="verification-center-page mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link to="/relief" className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('reliefHub.backToRelief')}
      </Link>

      <header className="mt-6 card-surface p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wide text-mint">{t('reliefHub.verificationEyebrow')}</p>
        <h1 className="mt-2 text-2xl font-extrabold text-primary sm:text-3xl">{t('reliefHub.verificationTitle')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-secondary">{t('reliefHub.verificationSubtitle')}</p>
      </header>

      {verified && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-mint/30 bg-mint/10 p-5">
          <BadgeCheck className="h-6 w-6 shrink-0 text-mint" aria-hidden />
          <div>
            <p className="font-semibold text-primary">{t('reliefHub.verificationApprovedBanner')}</p>
            <p className="mt-1 text-sm text-secondary">{t('reliefHub.verificationApprovedHint')}</p>
            <Link to="/relief/create?subtype=fundraising" className="btn-primary mt-4 inline-flex">
              {t('reliefHub.createFundraisingCta')}
            </Link>
          </div>
        </div>
      )}

      {existing && !verified && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-primary">{t('reliefHub.verificationStatusLabel')}</p>
          <p className="mt-1 capitalize text-secondary">{existing.status.replace(/_/g, ' ')}</p>
          {existing.admin_note && (
            <p className="mt-3 text-sm text-secondary">
              <span className="font-medium">{t('reliefHub.verificationAdminNote')}:</span> {existing.admin_note}
            </p>
          )}
        </div>
      )}

      {!verified && (
        <form onSubmit={handleSubmit} className="mt-6 card-surface space-y-5 p-6 sm:p-8" noValidate>
          {setupUnavailable && error && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100" role="alert">
              {error}
            </p>
          )}

          {error && !setupUnavailable && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200" role="alert">
              {error}
            </p>
          )}

          <label className="block">
            <span className="text-sm font-medium text-primary">{t('reliefHub.verificationOrgName')}</span>
            <input
              className="ff-input mt-1 w-full"
              value={organization_name}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-primary">{t('reliefHub.verificationOrgType')}</span>
            <select
              className="ff-input mt-1 w-full"
              value={organization_type}
              onChange={(e) => setOrganizationType(e.target.value as OrganizationType)}
            >
              {ORG_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`reliefHub.orgTypes.${type}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-primary">{t('reliefHub.verificationMission')}</span>
            <textarea
              className="ff-input mt-1 min-h-[100px] w-full"
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-primary">{t('reliefHub.verificationContactName')}</span>
              <input className="ff-input mt-1 w-full" value={contact_name} onChange={(e) => setContactName(e.target.value)} required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-primary">{t('reliefHub.verificationContactEmail')}</span>
              <input type="email" className="ff-input mt-1 w-full" value={contact_email} onChange={(e) => setContactEmail(e.target.value)} required />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-primary">{t('reliefHub.verificationOperatingArea')}</span>
            <input className="ff-input mt-1 w-full" value={operating_area} onChange={(e) => setOperatingArea(e.target.value)} />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-primary">{t('reliefHub.verificationRegistration')}</span>
            <input className="ff-input mt-1 w-full" value={registration_reference} onChange={(e) => setRegistrationReference(e.target.value)} />
          </label>

          <label className="flex items-start gap-3 text-sm text-secondary">
            <input
              type="checkbox"
              className="mt-1"
              checked={confirm_accuracy}
              onChange={(e) => setConfirmAccuracy(e.target.checked)}
              required
            />
            <span>{t('reliefHub.verificationConfirm')}</span>
          </label>

          <button type="submit" disabled={submitting || setupUnavailable} className="btn-primary w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {submitting ? t('reliefHub.verificationSubmitting') : t('reliefHub.verificationSubmit')}
          </button>
        </form>
      )}
    </section>
  )
}
