import { Mic, Shield, User } from 'lucide-react'
import type { PostingIdentity } from '../types'

interface ChooseYourVoiceProps {
  value: PostingIdentity
  onChange: (value: PostingIdentity) => void
  youthVoiceId: string | null | undefined
  disabled?: boolean
  requireProfileOnly?: boolean
}

const options: {
  value: PostingIdentity
  title: string
  description: string
  icon: typeof User
}[] = [
  {
    value: 'profile',
    title: 'Post as My Profile',
    description: 'Your name and profile will be visible.',
    icon: User,
  },
  {
    value: 'youth_voice',
    title: 'Post with Youth Voice ID',
    description: 'Share freely while keeping your profile identity hidden from public viewers.',
    icon: Mic,
  },
]

export default function ChooseYourVoice({
  value,
  onChange,
  youthVoiceId,
  disabled,
  requireProfileOnly = false,
}: ChooseYourVoiceProps) {
  if (requireProfileOnly) {
    return (
      <div className="alert-info rounded-2xl px-4 py-4">
        <p className="flex items-center gap-2 text-sm font-bold text-primary">
          <Shield className="h-4 w-4 shrink-0 text-accent-600 dark:text-accent-400" aria-hidden />
          Public profile required
        </p>
        <p className="mt-2 text-xs leading-relaxed text-secondary">
          Fundraising campaigns must be posted with your public profile to support trust and
          transparency. Youth Voice ID is not available for this movement type.
        </p>
      </div>
    )
  }

  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <div>
        <legend className="form-label">Choose Your Voice</legend>
        <p className="form-hint mt-1">How you appear to the community on this post.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = value === option.value
          const Icon = option.icon
          return (
            <label
              key={option.value}
              className={`voice-option ${selected ? 'voice-option-selected' : ''} ${
                disabled ? 'cursor-not-allowed opacity-60' : ''
              }`}
            >
              <input
                type="radio"
                name="postingIdentity"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                className={`voice-option-icon ${
                  selected ? 'voice-option-icon-selected' : 'voice-option-icon-idle'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-bold text-primary">{option.title}</span>
              <span className="mt-1 text-xs leading-relaxed text-secondary">
                {option.description}
              </span>
              {option.value === 'youth_voice' && selected && youthVoiceId && (
                <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 font-mono text-xs font-bold text-accent-700 ring-1 ring-default dark:text-accent-300">
                  <Shield className="h-3.5 w-3.5" aria-hidden />
                  {youthVoiceId}
                </span>
              )}
            </label>
          )
        })}
      </div>
      {value === 'youth_voice' && (
        <>
          <p className="privacy-panel flex items-start gap-2.5">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent-600 dark:text-accent-400" aria-hidden />
            <span>
              Your profile name will not appear publicly on this post. For platform safety, the post
              remains securely linked to your account internally.
            </span>
          </p>
          <p className="youth-voice-trust-note text-xs leading-relaxed text-secondary">
            Your identity stays hidden from the public, and you can manage or delete this post anytime
            from your profile.
          </p>
        </>
      )}
    </fieldset>
  )
}
