import { Shield } from 'lucide-react'
import { getPostAuthorPresentation } from '../lib/postIdentity'
import { shouldShowAuthorVerification } from '../lib/trust'
import VerifiedOrganizerBadge from './VerifiedOrganizerBadge'
import type { Post } from '../types'

interface PostAuthorProps {
  post: Pick<
    Post,
    | 'author_name'
    | 'posting_identity'
    | 'youth_voice_id'
    | 'author_is_verified_organizer'
    | 'author_is_verified_organization'
    | 'author_organizer_verification_type'
    | 'author_organization_verification_type'
  >
  className?: string
  compact?: boolean
}

export default function PostAuthor({ post, className = '', compact = false }: PostAuthorProps) {
  const { displayName, isAnonymous, youthVoiceId } = getPostAuthorPresentation(post)
  const showVerified = shouldShowAuthorVerification(post)

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        {isAnonymous ? (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-100 to-slate-200 text-slate-600 ring-2 ring-white shadow-sm"
            aria-hidden
          >
            <Shield className="h-4 w-4" />
          </span>
        ) : (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent-100 to-accent-200 text-xs font-bold text-accent-800 ring-2 ring-white shadow-sm"
            aria-hidden
          >
            {displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || '?'}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {isAnonymous ? 'Posted with Youth Voice ID' : 'Posted as profile'}
          </p>
          <p className="wrap-user-text text-sm font-semibold text-slate-800">{displayName}</p>
          {isAnonymous && youthVoiceId && !compact && (
            <p className="mt-0.5 font-mono text-[11px] font-medium text-slate-500">{youthVoiceId}</p>
          )}
        </div>
      </div>
      {showVerified && (
        <VerifiedOrganizerBadge
          verificationType={
            post.author_organizer_verification_type ??
            post.author_organization_verification_type
          }
          size="sm"
        />
      )}
    </div>
  )
}
