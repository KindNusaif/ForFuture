import { Mic, User } from 'lucide-react'
import { getOwnerIdentityBadgeLabel } from '../lib/postIdentity'
import type { PostingIdentity } from '../types'

interface IdentityBadgeProps {
  postingIdentity: PostingIdentity
}

export default function IdentityBadge({ postingIdentity }: IdentityBadgeProps) {
  const label = getOwnerIdentityBadgeLabel(postingIdentity)
  const isYouthVoice = postingIdentity === 'youth_voice'

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
        isYouthVoice
          ? 'bg-slate-100/95 text-slate-700 ring-slate-200/90'
          : 'bg-accent-50/95 text-accent-800 ring-accent-200/80'
      }`}
    >
      {isYouthVoice ? (
        <Mic className="h-3 w-3 shrink-0" aria-hidden />
      ) : (
        <User className="h-3 w-3 shrink-0" aria-hidden />
      )}
      <span className="truncate">{label}</span>
    </span>
  )
}
