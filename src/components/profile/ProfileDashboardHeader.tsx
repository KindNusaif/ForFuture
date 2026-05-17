import { User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import VerifiedOrganizerBadge from '../VerifiedOrganizerBadge'
import YouthVoiceIdCard from './YouthVoiceIdCard'
import type { Profile } from '../../types'

const BIO_MAX = 280

export type BioSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface ProfileDashboardHeaderProps {
  profile: Profile
  email?: string | null
  bioDraft: string
  onBioChange: (value: string) => void
  onSaveBio: () => Promise<void>
  bioSaveStatus: BioSaveStatus
  bioError?: string | null
}

export default function ProfileDashboardHeader({
  profile,
  email,
  bioDraft,
  onBioChange,
  onSaveBio,
  bioSaveStatus,
  bioError,
}: ProfileDashboardHeaderProps) {
  const { t } = useTranslation()
  const displayName = profile.display_name ?? t('profile.title')
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : null

  const isVerified = profile.is_verified_organizer ?? profile.is_verified_organization
  const bioDirty = bioDraft !== (profile.bio ?? '')
  const canSave = bioDirty && bioSaveStatus !== 'saving'

  return (
    <header className="card-surface overflow-hidden">
      <div className="profile-hero-wash">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start lg:flex-col lg:items-center">
            <span
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-accent-600 to-brand-600 text-2xl font-bold text-white shadow-lg shadow-accent-600/20"
              aria-hidden
            >
              {initials || <User className="h-9 w-9" />}
            </span>
            {profile.youth_voice_id && (
              <div className="w-full min-w-0 lg:hidden">
                <YouthVoiceIdCard youthVoiceId={profile.youth_voice_id} />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
                {displayName}
              </h2>
              {isVerified && (
                <VerifiedOrganizerBadge
                  verificationType={
                    profile.organizer_verification_type ?? profile.organization_verification_type
                  }
                  size="md"
                  prominent
                />
              )}
            </div>
            {memberSince && (
              <p className="mt-1 text-sm text-muted">
                {t('profile.memberSince')} {memberSince}
              </p>
            )}
            {email && (
              <p className="mt-2 truncate text-sm text-secondary" title={email}>
                {email}
              </p>
            )}

            <div className="mt-6">
              <label
                htmlFor="profile-bio"
                className="form-label text-xs font-bold uppercase tracking-wide text-muted"
              >
                {t('profile.bio')}
              </label>
              <textarea
                id="profile-bio"
                value={bioDraft}
                onChange={(e) => onBioChange(e.target.value)}
                rows={3}
                maxLength={BIO_MAX}
                placeholder={t('profile.bioPlaceholder')}
                className="input-field wrap-user-text mt-2"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="form-hint" aria-live="polite">
                  {bioDraft.length}/{BIO_MAX}
                </span>
                <div className="flex items-center gap-3">
                  {bioSaveStatus === 'saved' && (
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      {t('profile.bioSaved')}
                    </span>
                  )}
                  {bioSaveStatus === 'error' && bioError && (
                    <span className="form-error">{bioError}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => void onSaveBio()}
                    disabled={!canSave}
                    className="btn-secondary min-h-9! px-4! py-2! text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {bioSaveStatus === 'saving' ? t('profile.saving') : t('profile.saveBio')}
                  </button>
                </div>
              </div>
            </div>

            {isVerified && (
              <div className="alert-success mt-5 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide">
                  {t('profile.verificationTitle')}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-secondary">
                  {t('profile.verificationBody')}
                </p>
              </div>
            )}
          </div>

          {profile.youth_voice_id && (
            <div className="hidden min-w-0 lg:block lg:w-72 lg:shrink-0">
              <YouthVoiceIdCard youthVoiceId={profile.youth_voice_id} />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}



