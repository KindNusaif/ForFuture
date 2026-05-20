import { BarChart3, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '../ui/Button'

const STARTER_IDEAS = [
  { key: 'polls.ideaPriority', defaultValue: 'Choose a local priority' },
  { key: 'polls.ideaSupport', defaultValue: 'Test support for an idea' },
  { key: 'polls.ideaDecision', defaultValue: 'Guide a movement decision' },
  { key: 'polls.ideaAction', defaultValue: 'Ask what action should happen next' },
] as const

const WHY_ITEMS = [
  { key: 'polls.whyUnderstand', defaultValue: 'Understand what people care about' },
  { key: 'polls.whyValidate', defaultValue: 'Validate a movement idea' },
  { key: 'polls.whyPrioritize', defaultValue: 'Help communities prioritize action' },
] as const

export interface PollsEmptyPanelProps {
  variant: 'all' | 'trending' | 'mine'
  onCreatePoll: () => void
}

export default function PollsEmptyPanel({ variant, onCreatePoll }: PollsEmptyPanelProps) {
  const { t } = useTranslation()

  const title =
    variant === 'mine'
      ? t('polls.myPollsEmptyTitle', { defaultValue: "You haven't created a poll yet." })
      : variant === 'trending'
        ? t('polls.trendingEmptyTitle', { defaultValue: 'No trending polls yet' })
        : t('polls.emptyTitle', { defaultValue: 'No community polls yet' })

  const description =
    variant === 'mine'
      ? t('polls.myPollsEmptyDescription', {
          defaultValue: 'Start one to gather public opinion before taking action.',
        })
      : variant === 'trending'
        ? t('polls.trendingEmptyDescription', {
            defaultValue: 'Start a poll and invite people to participate.',
          })
        : t('polls.emptyDescription', {
            defaultValue:
              'Start the first poll and help your community share opinions on issues, priorities, and actions that matter.',
          })

  const showIdeas = variant === 'all'
  const showCreate = variant === 'all' || variant === 'mine' || variant === 'trending'

  return (
    <div className="polls-empty-grid community-polls-content-zone">
      <div className="polls-empty-main card-surface flex flex-col px-6 py-10 text-center sm:px-8 sm:py-12">
        <span
          className="empty-state-premium-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
          aria-hidden
        >
          <BarChart3 className="h-7 w-7 text-accent-600 dark:text-accent-400" />
        </span>
        <h2 className="mt-5 text-lg font-bold text-primary sm:text-xl">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-secondary">{description}</p>
        <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-muted">
          {t('polls.emptyHint', { defaultValue: 'Polls help movements listen before they act.' })}
        </p>

        {showIdeas && (
          <div className="mx-auto mt-8 w-full max-w-sm text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t('polls.ideasLabel', { defaultValue: 'Poll ideas to get started' })}
            </p>
            <ul className="mt-2.5 space-y-2 text-sm text-secondary">
              {STARTER_IDEAS.map(({ key, defaultValue }) => (
                <li key={key} className="flex gap-2.5">
                  <span className="mt-0.5 text-accent-600 dark:text-accent-400" aria-hidden>
                    •
                  </span>
                  <span>{t(key, { defaultValue })}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showCreate && (
          <Button type="button" variant="primary" className="mx-auto mt-8 min-h-11 gap-2" onClick={onCreatePoll}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('polls.createPoll', { defaultValue: 'Create a Poll' })}
          </Button>
        )}
      </div>

      <aside className="polls-why-panel card-surface flex flex-col p-5 sm:p-6">
        <h3 className="text-base font-bold tracking-tight text-primary">
          {t('polls.whyUseTitle', { defaultValue: 'Why use Community Polls?' })}
        </h3>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
          {WHY_ITEMS.map(({ key, defaultValue }) => (
            <li key={key} className="flex gap-2.5">
              <span className="text-accent-600 dark:text-accent-400" aria-hidden>
                •
              </span>
              <span>{t(key, { defaultValue })}</span>
            </li>
          ))}
        </ul>
        <p className="mt-auto pt-6 text-xs leading-relaxed text-muted">
          {t('polls.whyUseFooter', {
            defaultValue: 'A civic listening space for youth priorities, movement decisions, and public opinion.',
          })}
        </p>
      </aside>
    </div>
  )
}
