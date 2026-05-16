import { useState } from 'react'
import { BarChart3, Check, Loader2, Lock } from 'lucide-react'
import type { Post } from '../types'

interface PollVoteBlockProps {
  post: Post
  guestMode?: boolean
  onVote?: (postId: string, optionId: string) => void | Promise<void>
  voting?: boolean
}

export default function PollVoteBlock({
  post,
  guestMode = false,
  onVote,
  voting = false,
}: PollVoteBlockProps) {
  const poll = post.poll
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)

  if (!poll || poll.options.length === 0) {
    return (
      <p className="mt-3 text-sm italic text-slate-500">Poll options are loading…</p>
    )
  }

  const hasVoted = Boolean(poll.myVoteOptionId)
  const showResults = hasVoted || guestMode
  const activeSelection = hasVoted ? poll.myVoteOptionId : selectedOptionId
  const totalVotes = poll.totalVotes

  async function handleVote() {
    if (!activeSelection || !onVote || guestMode || hasVoted) return
    await onVote(post.id, activeSelection)
  }

  return (
    <section
      className="mt-3 rounded-xl border border-cyan-100/90 bg-cyan-50/25 p-3.5 sm:p-4"
      aria-labelledby={`poll-${post.id}-heading`}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            id={`poll-${post.id}-heading`}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-cyan-800"
          >
            <BarChart3 className="h-3.5 w-3.5" aria-hidden />
            Quick Youth Poll
          </p>
          <p className="wrap-user-text mt-1 text-base font-semibold leading-snug text-slate-900">
            {post.title}
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold tabular-nums text-slate-600 ring-1 ring-slate-200/80">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      <ul className="space-y-2" role={showResults ? 'list' : 'radiogroup'} aria-label="Poll options">
        {poll.options.map((option) => {
          const pct = option.percentage ?? 0
          const isSelected = activeSelection === option.id
          const isMyVote = poll.myVoteOptionId === option.id

          if (showResults) {
            return (
              <li
                key={option.id}
                className={`relative overflow-hidden rounded-lg border bg-white ${
                  isMyVote
                    ? 'border-cyan-300 ring-1 ring-cyan-500/20'
                    : 'border-slate-100'
                }`}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-cyan-200/40 transition-all duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
                <div className="relative flex items-center justify-between gap-2 px-3 py-2.5">
                  <span
                    className={`wrap-user-text text-sm font-medium ${
                      isMyVote ? 'text-cyan-900' : 'text-slate-800'
                    }`}
                  >
                    {isMyVote && (
                      <Check className="mr-1 inline h-3.5 w-3.5 shrink-0 text-cyan-600" aria-hidden />
                    )}
                    {option.option_text}
                  </span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-slate-600">
                    {pct}%
                  </span>
                </div>
              </li>
            )
          }

          return (
            <li key={option.id}>
              <label
                className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition ${
                  isSelected
                    ? 'border-cyan-400 bg-white ring-1 ring-cyan-500/25'
                    : 'border-slate-200/90 bg-white hover:border-cyan-200'
                } ${voting ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  type="radio"
                  name={`poll-${post.id}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => setSelectedOptionId(option.id)}
                  disabled={voting || guestMode}
                  className="h-4 w-4 shrink-0 border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="wrap-user-text text-sm font-medium text-slate-800">
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
          onClick={() => {
            if (guestMode) {
              onVote?.(post.id, '')
              return
            }
            void handleVote()
          }}
          disabled={voting || (!guestMode && !activeSelection)}
          className="btn-primary mt-3 w-full sm:w-auto"
        >
          {voting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Submitting vote…
            </>
          ) : guestMode ? (
            <>
              <Lock className="h-4 w-4" aria-hidden />
              Vote Now
            </>
          ) : (
            'Vote Now'
          )}
        </button>
      )}

      {guestMode && showResults && (
        <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-center text-xs text-slate-600 ring-1 ring-slate-200/70">
          <button
            type="button"
            onClick={() => onVote?.(post.id, '')}
            className="font-semibold text-accent-600 hover:text-accent-700"
          >
            Join ForFuture
          </button>{' '}
          to vote and add your voice
        </p>
      )}

      {hasVoted && !guestMode && (
        <p className="mt-2 text-center text-xs font-medium text-brand-700">
          Thanks — your vote is counted.
        </p>
      )}
    </section>
  )
}
