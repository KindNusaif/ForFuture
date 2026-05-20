import { useTranslation } from 'react-i18next'
import { BarChart3 } from 'lucide-react'
import PollVoteBlock from '../PollVoteBlock'
import ShareButton from '../share/ShareButton'
import PostOwnerControls from '../content/PostOwnerControls'
import PostAuthor from '../PostAuthor'
import CommentCountLink from '../comments/CommentCountLink'
import ReportContentButton from '../ReportContentButton'
import { canPostHaveComments } from '../../lib/commentEligibility'
import { getPollPurpose } from '../../lib/pollPurposes'
import { isPostOwner } from '../../lib/postOwnership'
import type { Post } from '../../types'

interface PollCardProps {
  post: Post
  guestMode?: boolean
  currentUserId?: string
  detailPath?: string
  commentCount?: number
  onPollVote?: (postId: string, optionId: string) => void | Promise<void>
  pollVoting?: boolean
  onPostDeleted?: (postId: string) => void
}

export default function PollCard({
  post,
  guestMode = false,
  currentUserId,
  detailPath,
  commentCount = 0,
  onPollVote,
  pollVoting = false,
  onPostDeleted,
}: PollCardProps) {
  const { t } = useTranslation()
  const pollPurpose = getPollPurpose(post.issue_summary)
  const isOwner = Boolean(currentUserId && isPostOwner(post, currentUserId))
  const shareMode = guestMode ? 'guest' : 'member'
  const showComments = canPostHaveComments(post) && detailPath

  return (
    <article className="poll-card card-surface min-w-0 overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-default px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="community-poll-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden />
            {t('polls.badge', { defaultValue: 'Community Poll' })}
          </span>
          {pollPurpose && (
            <span className="chip-muted text-[10px] font-semibold uppercase tracking-wide">
              {t(pollPurpose.badgeKey, { defaultValue: pollPurpose.badgeDefault })}
            </span>
          )}
          <span className="poll-status-open rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            {t('polls.pollOpen', { defaultValue: 'Open' })}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1" data-no-card-nav>
          <ShareButton post={post} variant="icon" />
          {isOwner && currentUserId ? (
            <PostOwnerControls
              post={post}
              currentUserId={currentUserId}
              shareMode={shareMode}
              detailPath={detailPath}
              compact
              onDeleted={() => onPostDeleted?.(post.id)}
            />
          ) : (
            <ReportContentButton post={post} />
          )}
        </div>
      </header>

      <div className="px-4 py-3 sm:px-5 sm:py-4">
        <PollVoteBlock
          post={post}
          guestMode={guestMode}
          onVote={onPollVote}
          voting={pollVoting}
          detailPath={detailPath}
          embedded
        />
      </div>

      <footer className="poll-card-footer flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <PostAuthor post={post} className="min-w-0 flex-1" compact />
        {showComments && (
          <CommentCountLink post={post} count={commentCount} detailPath={detailPath} />
        )}
      </footer>
    </article>
  )
}
