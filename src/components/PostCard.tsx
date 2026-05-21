import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { isPollMovement } from '../lib/movements'
import { isPetitionMovement } from '../lib/petitions'
import { getMomentumLabel, getMovementVisual, shouldShowMomentumPill } from '../lib/movementVisual'
import { safeArray, safeFormatShortDate } from '../lib/safeData'
import { getReliefDisplaySubtype, isReliefPost } from '../lib/reliefHub'
import { getPostAuthorPresentation } from '../lib/postIdentity'
import { getMovementSummary } from '../lib/movementDetailContent'
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
import ShareButton from './share/ShareButton'
import PostOwnerControls from './content/PostOwnerControls'
import PostOwnerBadge from './content/PostOwnerBadge'
import { isPostOwner } from '../lib/postOwnership'
import FollowMovementButton from './FollowMovementButton'
import MovementMediaFeedPreview from './media/MovementMediaFeedPreview'
import MovementMediaDetail from './media/MovementMediaDetail'
import MovementCardStats from './movement/MovementCardStats'
import CommentCountLink from './comments/CommentCountLink'
import type { MovementAttachment, Post } from '../types'

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
  showFullMedia?: boolean
  showFollow?: boolean
  isFollowing?: boolean
  followLoading?: boolean
  followerCount?: number
  onFollowToggle?: () => void
  currentUserId?: string
  onPostDeleted?: (postId: string) => void
  commentCount?: number
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest('button, a, input, textarea, select, [role="button"], [data-no-card-nav]'),
  )
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
  currentUserId,
  onPostDeleted,
  commentCount = 0,
}: PostCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
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
  const summary = getMovementSummary(post)
  const date = safeFormatShortDate(post.created_at)
  const attachments = safeArray<MovementAttachment>(post.attachments)

  const participating = !guestMode && Boolean(post.supported_by_me)
  const actionCount = post.support_count ?? 0
  const pollVotes = post.poll?.totalVotes ?? 0
  const showMomentum = shouldShowMomentumPill(post.movement_type, actionCount, pollVotes)
  const momentumLabel = getMomentumLabel(post.movement_type, actionCount, pollVotes)
  const cardNavigable = Boolean(detailPath) && !showFullMedia
  const isOwner = isPostOwner(post, currentUserId)
  const shareMode = guestMode ? 'guest' : 'member'

  function openDetail() {
    if (detailPath) navigate(detailPath)
  }

  function handleCardClick(e: React.MouseEvent) {
    if (!cardNavigable || isInteractiveTarget(e.target)) return
    openDetail()
  }

  function handleCardKeyDown(e: React.KeyboardEvent) {
    if (!cardNavigable) return
    if (e.key === 'Enter' || e.key === ' ') {
      if (isInteractiveTarget(e.target)) return
      e.preventDefault()
      openDetail()
    }
  }

  return (
    <article
      className={`post-card-interactive group min-w-0 max-w-full border-l-4 ${visual.accentBar} ${
        cardNavigable ? 'movement-card-navigable' : ''
      } ${highlight ? 'border-accent-300/80 ring-2 ring-accent-500/15 shadow-lg shadow-accent-900/5' : ''}`}
      onClick={cardNavigable ? handleCardClick : undefined}
      onKeyDown={cardNavigable ? handleCardKeyDown : undefined}
      tabIndex={cardNavigable ? 0 : undefined}
      role={cardNavigable ? 'link' : undefined}
      aria-label={cardNavigable ? `View movement: ${post.title}` : undefined}
    >
      <div
        className={`card-header-wash bg-linear-to-r px-4 pb-3 pt-4 sm:px-5 sm:pt-5 ${visual.headerWash}`}
        data-no-card-nav
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
            {isOwner && isAnonymous && <PostOwnerBadge />}
            {showMomentum && momentumLabel && (
              <span className="momentum-pill">{momentumLabel}</span>
            )}
          </div>
          <div className="flex shrink-0 items-start gap-2" data-no-card-nav>
            {showFollow && onFollowToggle && !isOwner && (
              <FollowMovementButton
                isFollowing={isFollowing}
                loading={followLoading}
                followerCount={followerCount}
                onClick={onFollowToggle}
                compact
              />
            )}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <ShareButton post={post} variant="icon" />
                {isOwner && currentUserId ? (
                  <PostOwnerControls
                    post={post}
                    currentUserId={currentUserId}
                    shareMode={shareMode}
                    detailPath={detailPath}
                    compact
                    showAnonymousBadge={false}
                    onDeleted={() => onPostDeleted?.(post.id)}
                  />
                ) : (
                  <ReportContentButton post={post} />
                )}
              </div>
              <time className="text-xs font-medium text-muted" dateTime={post.created_at}>
                {date}
              </time>
            </div>
          </div>
        </header>
      </div>

      <div className={`px-4 sm:px-5 ${cardNavigable ? 'movement-card-body-link' : ''}`}>
        {!isPoll && (
          <h3 className="wrap-user-text pt-3 text-lg font-bold leading-snug text-primary sm:text-xl">
            {post.title}
          </h3>
        )}

        {!showFullMedia && summary && (
          <p className="wrap-user-text mt-2 text-sm leading-relaxed text-secondary line-clamp-2">
            {summary}
          </p>
        )}

        {showFullMedia && !isPoll && !isPetition && (
          <p className="wrap-user-text mt-2 text-sm leading-relaxed text-secondary">
            {post.description}
          </p>
        )}
        {showFullMedia && isPetition && post.petition_issue && (
          <p className="wrap-user-text mt-2 text-sm leading-relaxed text-secondary">
            {post.petition_issue}
          </p>
        )}

        {attachments.length > 0 && !showFullMedia && (
          <div data-no-card-nav>
            <MovementMediaFeedPreview attachments={attachments} />
          </div>
        )}
      </div>

      {showFullMedia && attachments.length > 0 && (
        <div className="px-4 sm:px-5">
          <MovementMediaDetail attachments={attachments} />
        </div>
      )}

      <div className="px-4 pb-4 sm:px-5 sm:pb-5" data-no-card-nav>
        {!showFullMedia && (
          <div className="movement-card-footer-metrics mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <MovementCardStats post={post} showPrimary className="!mt-0 !border-0 !pt-0" />
              {detailPath && (
                <CommentCountLink post={post} count={commentCount} detailPath={detailPath} />
              )}
            </div>
            {cardNavigable && detailPath && (
              <button
                type="button"
                data-no-card-nav
                className="movement-card-view-link shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  openDetail()
                }}
              >
                {t('movement.viewMovement', { defaultValue: 'View Movement' })}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        )}

        {isPoll ? (
          <PollVoteBlock
            post={post}
            guestMode={guestMode}
            onVote={onPollVote}
            voting={pollVoting}
            detailPath={showFullMedia ? undefined : detailPath}
          />
        ) : (
          !showFullMedia && <MovementCardExtras post={post} />
        )}

        <footer className="mt-5 flex flex-col gap-4 border-t border-default pt-4 sm:flex-row sm:items-end sm:justify-between">
          <PostAuthor post={post} className="min-w-0 max-w-full flex-1" compact />

          {isPoll ? null : isPetition && showSupport && onPetitionSign ? (
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
          ) : null}
        </footer>
      </div>
    </article>
  )
}
