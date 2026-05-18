import { Link } from 'react-router-dom'
import { getMovementConfig, isPollMovement } from '../lib/movements'
import { isPetitionMovement } from '../lib/petitions'
import { getMomentumLabel, getMovementVisual, shouldShowMomentumPill } from '../lib/movementVisual'
import { getReliefDisplaySubtype, isReliefPost } from '../lib/reliefHub'
import { getPostAuthorPresentation } from '../lib/postIdentity'
import {
  shouldShowAuthorVerification,
  shouldShowCampaignReview,
  shouldShowUnderReviewLabel,
} from '../lib/trust'
import ProtectedVoicePill from './ProtectedVoicePill'
import MovementCardExtras from './MovementCardExtras'
import MovementTypeBadge from './MovementTypeBadge'
import PollVoteBlock from './PollVoteBlock'
import MovementActionButton from './MovementActionButton'
import PetitionActionButton from './PetitionActionButton'
import PostAuthor from './PostAuthor'
import CampaignReviewBadge from './CampaignReviewBadge'
import ReliefActionButton from './relief/ReliefActionButton'
import ReliefSubtypeBadge from './relief/ReliefSubtypeBadge'
import UnderReviewBadge from './UnderReviewBadge'
import VerifiedOrganizerBadge from './VerifiedOrganizerBadge'
import ReportContentButton from './ReportContentButton'
import FollowMovementButton from './FollowMovementButton'
import MovementMediaFeedPreview from './media/MovementMediaFeedPreview'
import MovementMediaDetail from './media/MovementMediaDetail'
import type { Post } from '../types'

const categoryColors: Record<string, string> = {
  Education: 'bg-blue-50/90 text-blue-800 ring-blue-200/80 dark:bg-blue-950/50 dark:text-blue-200 dark:ring-blue-800/50',
  Environment: 'bg-emerald-50/90 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/50',
  Health: 'bg-rose-50/90 text-rose-800 ring-rose-200/80 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/50',
  Justice: 'bg-purple-50/90 text-purple-800 ring-purple-200/80 dark:bg-purple-950/50 dark:text-purple-200 dark:ring-purple-800/50',
  Technology: 'bg-violet-50/90 text-violet-800 ring-violet-200/80 dark:bg-violet-950/50 dark:text-violet-200 dark:ring-violet-800/50',
  Community: 'bg-amber-50/90 text-amber-900 ring-amber-200/80 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-800/50',
  Economy: 'bg-orange-50/90 text-orange-900 ring-orange-200/80 dark:bg-orange-950/50 dark:text-orange-200 dark:ring-orange-800/50',
  Other: 'chip-muted',
}

interface PostCardProps {
  post: Post
  onSupport?: (postId: string) => void
  onPetitionSign?: (postId: string) => void
  onPollVote?: (postId: string, optionId: string) => void | Promise<void>
  supporting?: boolean
  petitionSigning?: boolean
  pollVoting?: boolean
  showSupport?: boolean
  highlight?: boolean
  guestMode?: boolean
  showIdentityBadge?: boolean
  showEngagementHint?: boolean
  detailPath?: string
  /** Full gallery + documents on movement detail */
  showFullMedia?: boolean
  showFollow?: boolean
  isFollowing?: boolean
  followLoading?: boolean
  followerCount?: number
  onFollowToggle?: () => void
}

export default function PostCard({
  post,
  onSupport,
  onPetitionSign,
  onPollVote,
  supporting,
  petitionSigning,
  pollVoting,
  showSupport = true,
  highlight,
  guestMode = false,
  showEngagementHint = false,
  detailPath,
  showFullMedia = false,
  showFollow = false,
  isFollowing = false,
  followLoading = false,
  followerCount,
  onFollowToggle,
}: PostCardProps) {
  const movement = getMovementConfig(post.movement_type)
  const visual = getMovementVisual(post.movement_type)
  const isPoll = isPollMovement(post.movement_type)
  const isPetition = isPetitionMovement(post.movement_type)
  const { isAnonymous } = getPostAuthorPresentation(post)
  const reliefSubtype = getReliefDisplaySubtype(post)
  const isRelief = isReliefPost(post)
  const showReviewed = shouldShowCampaignReview(post)
  const showUnderReview = shouldShowUnderReviewLabel(post)
  const showAuthorVerified = shouldShowAuthorVerification(post)
  const badgeClass = categoryColors[post.category] ?? categoryColors.Other
  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const participating = !guestMode && Boolean(post.supported_by_me)
  const actionCount = post.support_count ?? 0
  const pollVotes = post.poll?.totalVotes ?? 0
  const showMomentum = shouldShowMomentumPill(post.movement_type, actionCount, pollVotes)
  const momentumLabel = getMomentumLabel(post.movement_type, actionCount, pollVotes)

  const description = post.description?.trim() ?? ''
  const showDescription =
    (!isPoll && !isPetition) || (description && description !== 'Community poll')
  const showDetailLink = Boolean(detailPath) && !showFullMedia

  return (
    <article
      className={`post-card-interactive group min-w-0 max-w-full border-l-4 ${visual.accentBar} ${
        highlight ? 'border-accent-300/80 ring-2 ring-accent-500/15 shadow-lg shadow-accent-900/5' : ''
      }`}
    >
      <div
        className={`card-header-wash bg-linear-to-r px-4 pb-3 pt-4 sm:px-5 sm:pt-5 ${visual.headerWash}`}
      >
        <header className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {reliefSubtype ? (
              <ReliefSubtypeBadge subtype={reliefSubtype} />
            ) : (
              <MovementTypeBadge movementType={post.movement_type} />
            )}
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${badgeClass}`}
            >
              {post.category}
            </span>
            {showReviewed && !isRelief && (
              <CampaignReviewBadge
                movementType={post.movement_type}
                reviewedCampaignType={
                  post.reviewed_campaign_type ?? post.trusted_campaign_type
                }
              />
            )}
            {showUnderReview && <UnderReviewBadge />}
            {showAuthorVerified && (
              <VerifiedOrganizerBadge
                verificationType={
                  post.author_organizer_verification_type ??
                  post.author_organization_verification_type
                }
                size="sm"
              />
            )}
            {isAnonymous && (
              <ProtectedVoicePill youthVoiceId={post.youth_voice_id} />
            )}
            {showMomentum && momentumLabel && (
              <span className="momentum-pill">
                {momentumLabel}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-start gap-2">
            {showFollow && onFollowToggle && (
              <FollowMovementButton
                isFollowing={isFollowing}
                loading={followLoading}
                followerCount={followerCount}
                onClick={onFollowToggle}
                compact
              />
            )}
            <div className="flex flex-col items-end gap-1">
              <ReportContentButton post={post} />
              <time className="text-xs font-medium text-muted" dateTime={post.created_at}>
                {date}
              </time>
            </div>
          </div>
        </header>
      </div>

      <div className="px-4 sm:px-5">
        {!isPoll && (
          <h3 className="wrap-user-text pt-3 text-lg font-bold leading-snug text-primary sm:text-xl">
            {detailPath ? (
              <Link
                to={detailPath}
                className="transition hover:text-accent-700 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
              >
                {post.title}
              </Link>
            ) : (
              post.title
            )}
          </h3>
        )}

        {showDescription && !isPetition && (
          <p
            className={`wrap-user-text mt-2 text-sm leading-relaxed text-secondary ${
              showFullMedia ? '' : 'line-clamp-card'
            }`}
          >
            {post.description}
          </p>
        )}
        {isPetition && post.petition_issue && (
          <p
            className={`wrap-user-text mt-2 text-sm leading-relaxed text-secondary ${
              showFullMedia ? '' : 'line-clamp-card'
            }`}
          >
            {post.petition_issue}
          </p>
        )}

        {post.attachments && post.attachments.length > 0 && !showFullMedia && (
          <MovementMediaFeedPreview attachments={post.attachments} />
        )}
      </div>

      {showFullMedia && post.attachments && post.attachments.length > 0 && (
        <div className="px-4 sm:px-5">
          <MovementMediaDetail attachments={post.attachments} />
        </div>
      )}

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        {isPoll ? (
          <PollVoteBlock
            post={post}
            guestMode={guestMode}
            onVote={onPollVote}
            voting={pollVoting}
            detailPath={showFullMedia ? undefined : detailPath}
          />
        ) : (
          <MovementCardExtras post={post} />
        )}

        {showDetailLink && (
          <Link
            to={detailPath!}
            className="mt-4 inline-block text-xs font-semibold text-accent-600 hover:text-accent-700"
          >
            {isPoll ? 'View full poll →' : 'View full movement →'}
          </Link>
        )}

        <footer className="mt-5 flex flex-col gap-4 border-t border-default pt-4 sm:flex-row sm:items-end sm:justify-between">
          <PostAuthor post={post} className="min-w-0 max-w-full flex-1" compact />

          {isPoll ? (
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                Community poll
              </p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-primary">
                {pollVotes} {pollVotes === 1 ? 'vote' : 'votes'}
              </p>
            </div>
          ) : isPetition && showSupport && onPetitionSign ? (
            <PetitionActionButton
              post={post}
              loading={petitionSigning}
              guestMode={guestMode}
              showHint={showEngagementHint}
              onSign={() => onPetitionSign(post.id)}
            />
          ) : showSupport && onSupport && isRelief ? (
            <ReliefActionButton
              post={post}
              count={actionCount}
              active={participating}
              loading={supporting}
              guestMode={guestMode}
              showHint={showEngagementHint}
              onClick={() => onSupport(post.id)}
            />
          ) : showSupport && onSupport ? (
            <MovementActionButton
              movementType={post.movement_type}
              count={actionCount}
              active={participating}
              loading={supporting}
              guestMode={guestMode}
              showHint={showEngagementHint}
              onClick={() => onSupport(post.id)}
            />
          ) : actionCount > 0 ? (
            <p className="text-xs font-medium text-muted sm:text-right">
              {movement.countLabel(actionCount)}
            </p>
          ) : null}
        </footer>
      </div>
    </article>
  )
}
