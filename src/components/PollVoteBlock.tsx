import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3, Check, Loader2 } from 'lucide-react'
import { useAuthGate } from '../hooks/useAuthGate'
import { getPollPurpose } from '../lib/pollPurposes'
import type { Post } from '../types'

interface PollVoteBlockProps {
  post: Post
  guestMode?: boolean
  onVote?: (postId: string, optionId: string) => void | Promise<void>
  voting?: boolean
  detailPath?: string
  /** Inside PollCard — skip outer panel chrome */
  embedded?: boolean
}

function pollContextText(post: Post): string | null {
  const desc = post.description?.trim() ?? ''
  if (!desc || desc === 'Community poll' || desc === post.title.trim()) return null
  const first = desc.split(/\n/)[0]?.trim() ?? desc
  return first.length > 200 ? `${first.slice(0, 197)}…` : first
}

export default function PollVoteBlock({
  post,
  guestMode = false,
  onVote,
  voting = false,
  detailPath,
  embedded = false,
}: PollVoteBlockProps) {
  const { t } = useTranslation()
  const { gate } = useAuthGate()
  const poll = post.poll
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)

  const contextText = useMemo(() => pollContextText(post), [post])

  const formattedDate = useMemo(() => {
    try {
      return new Date(post.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return null
    }
  }, [post.created_at])

  const hasVoted = Boolean(poll?.myVoteOptionId)
  const showResults = hasVoted || guestMode
  const totalVotes = poll?.totalVotes ?? 0

  const winningOptionId = useMemo(() => {
    if (!poll || !showResults || totalVotes === 0) return null
    let best = poll.options[0]
    for (const opt of poll.options) {
      if ((opt.vote_count ?? 0) > (best.vote_count ?? 0)) best = opt
    }
    const tied = poll.options.filter((o) => (o.vote_count ?? 0) === (best.vote_count ?? 0))
    return tied.length === 1 ? best.id : null
  }, [poll, showResults, totalVotes])

  if (!poll) {
    return (
      <p className="alert-info mt-3 px-3 py-2 text-sm">
        {t('polls.loadError', { defaultValue: 'Poll details could not be loaded. Try refreshing the page.' })}
      </p>
    )
  }

  if (poll.options.length === 0) {
    return (
      <p className="alert-info mt-3 px-3 py-2 text-sm">
        {t('polls.noOptions', { defaultValue: 'This poll has no voting options yet.' })}
      </p>
    )
  }

  const activeSelection = hasVoted ? poll.myVoteOptionId : selectedOptionId

  async function handleVote() {
    if (guestMode) {
      gate('poll')
      return
    }
    if (!activeSelection || !onVote || hasVoted) return
    await onVote(post.id, activeSelection)
  }

  const pollPurpose = getPollPurpose(post.issue_summary)
  const categoryLabel = post.category && post.category !== 'Other' ? post.category : null

  const sectionClass = embedded
    ? 'community-poll-block community-poll-block--embedded'
    : 'community-poll-block mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3.5 sm:p-4 dark:border-cyan-400/25 dark:bg-cyan-950/25'

  return (
    <section className={sectionClass} aria-labelledby={`poll-${post.id}-heading`}>
      <div className={`flex flex-wrap items-start justify-between gap-2 ${embedded ? 'mb-3' : 'mb-3'}`}>
        <div className="min-w-0 space-y-2">
          {!embedded && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="community-poll-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                <BarChart3 className="h-3.5 w-3.5" aria-hidden />
                {t('polls.badge', { defaultValue: 'Community Poll' })}
              </span>
              {pollPurpose && (
                <span className="chip-muted text-[10px] font-semibold uppercase tracking-wide">
                  {t(pollPurpose.badgeKey, { defaultValue: pollPurpose.badgeDefault })}
                </span>
              )}
              {categoryLabel && !pollPurpose && (
                <span className="chip-muted text-[10px] font-semibold uppercase tracking-wide">
                  {categoryLabel}
                </span>
              )}
            </div>
          )}
          <p
            id={`poll-${post.id}-heading`}
            className="wrap-user-text text-base font-semibold leading-snug text-primary sm:text-lg"
          >
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
          </p>
          {contextText && (
            <p className="wrap-user-text text-sm leading-relaxed text-secondary">{contextText}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <span className="chip-muted tabular-nums text-xs">
            {t(totalVotes === 1 ? 'polls.totalVotes_one' : 'polls.totalVotes_other', {
              count: totalVotes,
            })}
          </span>
          {formattedDate && (
            <time className="text-[11px] text-muted" dateTime={post.created_at}>
              {formattedDate}
            </time>
          )}
        </div>
      </div>

      <ul className="space-y-2" role={showResults ? 'list' : 'radiogroup'} aria-label={t('polls.optionsAria', { defaultValue: 'Poll options' })}>
        {poll.options.map((option) => {
          const pct = option.percentage ?? 0
          const isSelected = activeSelection === option.id
          const isMyVote = poll.myVoteOptionId === option.id
          const isLeading = winningOptionId === option.id && totalVotes > 0

          if (showResults) {
            return (
              <li
                key={option.id}
                className={`community-poll-result relative overflow-hidden rounded-lg border bg-surface ${
                  isMyVote
                    ? 'border-cyan-400 ring-1 ring-cyan-500/25 dark:border-cyan-500/40'
                    : isLeading
                      ? 'border-accent-300/80 dark:border-accent-500/35'
                      : 'border-default'
                }`}
              >
                <div
                  className="community-poll-result-bar absolute inset-y-0 left-0 bg-cyan-200/45 dark:bg-cyan-500/20"
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
                <div className="relative flex items-center justify-between gap-3 px-3 py-2.5 sm:py-3">
                  <span
                    className={`wrap-user-text min-w-0 text-sm font-medium ${
                      isMyVote ? 'text-cyan-900 dark:text-cyan-200' : 'text-primary'
                    }`}
                  >
                    {isMyVote && (
                      <Check className="mr-1 inline h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" aria-hidden />
                    )}
                    {option.option_text}
                  </span>
                  <div className="shrink-0 text-right">
                    <span className="block text-xs font-bold tabular-nums text-primary">{pct}%</span>
                    <span className="block text-[10px] tabular-nums text-muted">
                      {t(
                        (option.vote_count ?? 0) === 1
                          ? 'polls.optionVotes_one'
                          : 'polls.optionVotes_other',
                        { count: option.vote_count ?? 0 },
                      )}
                    </span>
                  </div>
                </div>
              </li>
            )
          }

          return (
            <li key={option.id}>
              <label
                className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition sm:py-3 ${
                  isSelected
                    ? 'border-cyan-400 bg-surface ring-1 ring-cyan-500/25 dark:border-cyan-500/50'
                    : 'border-default bg-surface hover:border-cyan-300 dark:hover:border-cyan-600'
                } ${voting ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  type="radio"
                  name={`poll-${post.id}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => setSelectedOptionId(option.id)}
                  disabled={voting || guestMode}
                  className="h-4 w-4 shrink-0 border-default text-cyan-600 focus:ring-cyan-500"
                />
                <span className="wrap-user-text text-sm font-medium text-primary">
                  {option.option_text}
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      {!showResults && (
        <button
          type="button"
          onClick={() => void handleVote()}
          disabled={voting || (!guestMode && !activeSelection)}
          className="btn-primary mt-3 w-full sm:w-auto"
        >
          {voting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t('polls.submitting', { defaultValue: 'Submitting vote…' })}
            </>
          ) : guestMode ? (
            t('polls.submitVoteGuest', { defaultValue: 'Submit Vote' })
          ) : (
            t('polls.submitVote', { defaultValue: 'Submit Vote' })
          )}
        </button>
      )}

      {guestMode && !hasVoted && (
        <p className="alert-info mt-3 px-3 py-2 text-center text-xs leading-relaxed">
          <button type="button" onClick={() => gate('poll')} className="link-primary font-semibold">
            {t('polls.guestJoinCta', { defaultValue: 'Create an account' })}
          </button>{' '}
          {t('polls.guestVotePrompt', {
            defaultValue: 'to vote in community polls.',
          })}
        </p>
      )}

      {hasVoted && !guestMode && (
        <p className="mt-3 text-center text-xs font-medium text-brand-700 dark:text-brand-400">
          {t('polls.voteRecorded', { defaultValue: 'Your vote has been recorded.' })}
        </p>
      )}
    </section>
  )
}
