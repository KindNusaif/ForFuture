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
      <div className="rounded-2xl border border-violet-200/90 bg-violet-50/90 px-4 py-4">
        <p className="flex items-center gap-2 text-sm font-bold text-violet-950">
          <Shield className="h-4 w-4 shrink-0 text-violet-700" aria-hidden />
          Public profile required
        </p>
        <p className="mt-2 text-xs leading-relaxed text-violet-900/85">
          Fundraising campaigns must be posted with your public profile to support trust and
          transparency. Youth Voice ID is not available for this movement type.
        </p>
      </div>
    )
  }

  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <div>
        <legend className="text-sm font-bold text-slate-900">Choose Your Voice</legend>
        <p className="mt-1 text-xs text-slate-500">How you appear to the community on this post.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = value === option.value
          const Icon = option.icon
          return (
            <label
              key={option.value}
              className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-4 transition ${
                selected
                  ? 'border-accent-500 bg-accent-50/80 ring-2 ring-accent-500/20 shadow-sm'
                  : 'border-slate-200/90 bg-white hover:border-accent-200 hover:bg-slate-50/50'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
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
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ${
                  selected
                    ? 'bg-accent-600 text-white'
                    : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-bold text-slate-900">{option.title}</span>
              <span className="mt-1 text-xs leading-relaxed text-slate-600">
                {option.description}
              </span>
              {option.value === 'youth_voice' && selected && youthVoiceId && (
                <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-accent-800 ring-1 ring-accent-200">
                  <Shield className="h-3.5 w-3.5" aria-hidden />
                  {youthVoiceId}
                </span>
              )}
            </label>
          )
        })}
      </div>
      {value === 'youth_voice' && (
        <p className="privacy-panel flex items-start gap-2.5">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" aria-hidden />
          <span>
            Your profile name will not appear publicly on this post. For platform safety, the post
            remains securely linked to your account internally.
          </span>
        </p>
      )}
    </fieldset>
  )
}
