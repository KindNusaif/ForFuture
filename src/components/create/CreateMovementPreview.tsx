import MovementTypeBadge from '../MovementTypeBadge'
import { getMovementConfig } from '../../lib/movements'
import { getPostAuthorPresentation } from '../../lib/postIdentity'
import ProtectedVoicePill from '../ProtectedVoicePill'
import type { Post } from '../../types'

interface CreateMovementPreviewProps {
  post: Post
}

/**
 * Read-only preview for the create wizard — avoids PostCard side effects
 * (report modal, navigation, action buttons) that can crash on id `preview`.
 */
export default function CreateMovementPreview({ post }: CreateMovementPreviewProps) {
  const config = getMovementConfig(post.movement_type)
  const { isAnonymous } = getPostAuthorPresentation(post)
  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <article className="create-preview-card" aria-label="Movement preview">
      <div className="create-preview-card-header">
        <div className="flex flex-wrap items-center gap-2">
          <MovementTypeBadge movementType={post.movement_type} />
          <span className="chip-muted rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
            {post.category}
          </span>
          {isAnonymous && <ProtectedVoicePill youthVoiceId={post.youth_voice_id} />}
        </div>
        <time className="text-xs text-muted" dateTime={post.created_at}>
          {date}
        </time>
      </div>

      <h3 className="mt-4 text-lg font-bold leading-snug text-primary sm:text-xl">{post.title}</h3>

      <p className="mt-2 text-sm leading-relaxed text-secondary line-clamp-4">
        {post.description}
      </p>

      <dl className="mt-4 grid gap-2 border-t border-default pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Action type</dt>
          <dd className="mt-0.5 font-medium text-primary">{config.label}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Posted as</dt>
          <dd className="mt-0.5 font-medium text-primary">
            {isAnonymous ? 'Youth Voice ID' : post.author_name}
          </dd>
        </div>
      </dl>
    </article>
  )
}
