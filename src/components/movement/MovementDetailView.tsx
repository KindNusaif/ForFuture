import { Link } from 'react-router-dom'
import { Calendar, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import MovementTypeBadge from '../MovementTypeBadge'
import ReliefSubtypeBadge from '../relief/ReliefSubtypeBadge'
import PostAuthor from '../PostAuthor'
import PollVoteBlock from '../PollVoteBlock'
import MovementMediaDetail from '../media/MovementMediaDetail'
import MovementCardExtras from '../MovementCardExtras'
import MovementActionButton from '../MovementActionButton'
import PetitionActionButton from '../PetitionActionButton'
import ReliefActionButton from '../relief/ReliefActionButton'
import FollowMovementButton from '../FollowMovementButton'
import ReportContentButton from '../ReportContentButton'
import PostCard from '../PostCard'
import { PostCardSkeleton } from '../Skeleton'
import {
  MovementDetailPanel,
  MovementDetailEyebrow,
  MovementDetailStat,
  MovementDetailField,
} from './MovementDetailPrimitives'
import {
  detailPanelVariant,
  getDesiredOutcome,
  getMovementLocationLabel,
  getWhyThisMatters,
} from '../../lib/movementDetailContent'
import { getMovementVisual } from '../../lib/movementVisual'
import { getReliefDisplaySubtype, isReliefPost } from '../../lib/reliefHub'
import { isPollMovement } from '../../lib/movements'
import { isPetitionMovement } from '../../lib/petitions'
import type { Post } from '../../types'

export interface MovementDetailViewProps {
  post: Post
  guestMode?: boolean
  detailPath?: string
  relatedPosts?: Post[]
  relatedLoading?: boolean
  relatedDetailBase?: string
  showFollow?: boolean
  isFollowing?: boolean
  followLoading?: boolean
  followerCount?: number
  onFollowToggle?: () => void
  onSupport?: (postId: string) => void
  onPetitionSign?: (postId: string) => void
  onPollVote?: (postId: string, optionId: string) => void | Promise<void>
  supporting?: boolean
  petitionSigning?: boolean
  pollVoting?: boolean
}

export default function MovementDetailView({
  post,
  guestMode = false,
  relatedPosts = [],
  relatedLoading = false,
  relatedDetailBase = '/movements',
  showFollow = false,
  isFollowing = false,
  followLoading = false,
  followerCount,
  onFollowToggle,
  onSupport,
  onPetitionSign,
  onPollVote,
  supporting,
  petitionSigning,
  pollVoting,
}: MovementDetailViewProps) {
  const { t } = useTranslation()
  const visual = getMovementVisual(post.movement_type)
  const panelVariant = detailPanelVariant(post)
  const isPoll = isPollMovement(post.movement_type)
  const isPetition = isPetitionMovement(post.movement_type)
  const isRelief = isReliefPost(post)
  const reliefSubtype = getReliefDisplaySubtype(post)
  const why = getWhyThisMatters(post)
  const outcome = getDesiredOutcome(post)
  const location = getMovementLocationLabel(post)
  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const participating = !guestMode && Boolean(post.supported_by_me)
  const actionCount = post.support_count ?? 0

  return (
    <div className="space-y-6">
      <header
        className={`overflow-hidden rounded-3xl border border-default bg-linear-to-br ${visual.headerWash} border-l-4 ${visual.accentBar}`}
      >
        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {reliefSubtype ? (
                <ReliefSubtypeBadge subtype={reliefSubtype} />
              ) : (
                <MovementTypeBadge movementType={post.movement_type} />
              )}
              <span className="chip-muted rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                {post.category}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!guestMode && <ReportContentButton post={post} />}
              {showFollow && onFollowToggle && (
                <FollowMovementButton
                  isFollowing={isFollowing}
                  loading={followLoading}
                  followerCount={followerCount ?? post.follower_count}
                  onClick={onFollowToggle}
                />
              )}
            </div>
          </div>

          {!isPoll && (
            <h1 className="wrap-user-text mt-4 text-2xl font-extrabold leading-tight text-primary sm:text-3xl">
              {post.title}
            </h1>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-secondary">
            <PostAuthor post={post} compact />
            <time className="flex items-center gap-1.5 text-muted" dateTime={post.created_at}>
              <Calendar className="h-4 w-4 shrink-0" aria-hidden />
              {date}
            </time>
            {location && (
              <span className="flex min-w-0 items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                <span className="wrap-user-text">{location}</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {why && (
        <MovementDetailPanel variant={panelVariant} aria-labelledby="why-heading">
          <h2 id="why-heading" className="movement-detail-eyebrow">
            {t('movement.whyThisMatters', { defaultValue: 'Why this matters' })}
          </h2>
          <p className="wrap-user-text mt-3 whitespace-pre-wrap text-sm leading-relaxed text-secondary sm:text-base">
            {why}
          </p>
        </MovementDetailPanel>
      )}

      {outcome && (
        <MovementDetailPanel variant={panelVariant} aria-labelledby="outcome-heading">
          <h2 id="outcome-heading" className="movement-detail-eyebrow">
            {t('movement.desiredOutcome', { defaultValue: 'Desired outcome' })}
          </h2>
          <MovementDetailField label={outcome.label} value={outcome.value} />
        </MovementDetailPanel>
      )}

      {post.attachments && post.attachments.length > 0 && (
        <MovementDetailPanel variant={panelVariant}>
          <MovementDetailEyebrow>
            {t('movement.media', { defaultValue: 'Photos & documents' })}
          </MovementDetailEyebrow>
          <div className="mt-4">
            <MovementMediaDetail attachments={post.attachments} />
          </div>
        </MovementDetailPanel>
      )}

      <MovementDetailPanel variant={panelVariant} aria-labelledby="progress-heading">
        <h2 id="progress-heading" className="movement-detail-eyebrow">
          {t('movement.takeAction', { defaultValue: 'Take action' })}
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {isPoll ? (
            <MovementDetailStat
              label={t('movement.statsVotes', { defaultValue: 'Votes' })}
              value={post.poll?.totalVotes ?? 0}
            />
          ) : isPetition ? (
            <>
              <MovementDetailStat
                label={t('movement.statsSignatures', { defaultValue: 'Signatures' })}
                value={actionCount}
              />
              {post.petition_support_goal != null && post.petition_support_goal > 0 && (
                <MovementDetailStat
                  label={t('movement.statsGoal', { defaultValue: 'Goal' })}
                  value={post.petition_support_goal}
                />
              )}
            </>
          ) : (
            <MovementDetailStat
              label={t('movement.statsSupporters', { defaultValue: 'Supporters' })}
              value={actionCount}
            />
          )}
          {(followerCount ?? post.follower_count ?? 0) > 0 && (
            <MovementDetailStat
              label={t('movement.statsTracking', { defaultValue: 'Tracking' })}
              value={followerCount ?? post.follower_count ?? 0}
            />
          )}
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-default pt-5 sm:flex-row sm:items-center sm:justify-between">
          {isPoll ? (
            <PollVoteBlock
              post={post}
              guestMode={guestMode}
              onVote={onPollVote}
              voting={pollVoting}
            />
          ) : isPetition && onPetitionSign ? (
            <PetitionActionButton
              post={post}
              loading={petitionSigning}
              guestMode={guestMode}
              showHint
              onSign={() => onPetitionSign(post.id)}
            />
          ) : onSupport && isRelief ? (
            <ReliefActionButton
              post={post}
              count={actionCount}
              active={participating}
              loading={supporting}
              guestMode={guestMode}
              showHint
              onClick={() => onSupport(post.id)}
            />
          ) : onSupport ? (
            <MovementActionButton
              movementType={post.movement_type}
              count={actionCount}
              active={participating}
              loading={supporting}
              guestMode={guestMode}
              showHint
              onClick={() => onSupport(post.id)}
            />
          ) : null}
        </div>
      </MovementDetailPanel>

      {!isPoll && <MovementCardExtras post={post} />}

      {(relatedLoading || relatedPosts.length > 0) && (
        <section aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-lg font-bold text-primary">
            {t('movement.relatedTitle', { defaultValue: 'Related movements' })}
          </h2>
          <p className="mt-1 text-sm text-secondary">
            {t('movement.relatedSubtitle', {
              defaultValue: 'More {{category}} causes you can support.',
              category: post.category,
            })}
          </p>
          <ul className="mt-4 space-y-4">
            {relatedLoading
              ? [1, 2].map((i) => (
                  <li key={i}>
                    <PostCardSkeleton />
                  </li>
                ))
              : relatedPosts.map((related) => (
                  <li key={related.id}>
                    <PostCard
                      post={related}
                      detailPath={`${relatedDetailBase}/${related.id}`}
                      guestMode={guestMode}
                    />
                  </li>
                ))}
          </ul>
          {!relatedLoading && relatedPosts.length === 0 && (
            <p className="mt-3 text-sm text-muted">
              {t('movement.relatedEmpty', { defaultValue: 'No related movements right now.' })}
            </p>
          )}
        </section>
      )}

      <p className="text-center">
        <Link to={guestMode ? '/movements' : '/feed'} className="auth-link text-sm">
          {t('movement.backToFeed', { defaultValue: '← Back to movements' })}
        </Link>
      </p>
    </div>
  )
}
