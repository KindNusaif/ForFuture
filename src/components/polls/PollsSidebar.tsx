import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCreatePoll } from '../../hooks/useCreatePoll'

const EXAMPLES = [
  { key: 'polls.sidebar.examplePriority', defaultValue: 'What should our town prioritize next?' },
  { key: 'polls.sidebar.examplePetition', defaultValue: 'Should this issue become a petition?' },
  { key: 'polls.sidebar.exampleVolunteer', defaultValue: 'Which volunteer action should happen first?' },
] as const

export default function PollsSidebar() {
  const { t } = useTranslation()
  const { openCreatePoll } = useCreatePoll()

  return (
    <aside
      className="polls-sidebar hidden shrink-0 lg:block"
      aria-label={t('polls.sidebarAria', { defaultValue: 'About community polls' })}
    >
      <div className="sticky top-6 space-y-4">
        <div className="card-surface p-5">
          <h2 className="text-base font-bold tracking-tight text-primary">
            {t('polls.sidebarTitle', { defaultValue: 'Why polls matter' })}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            {t('polls.sidebarBody', {
              defaultValue:
                'Polls help communities listen before launching petitions, drives, or civic action.',
            })}
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('polls.sidebarExamplesLabel', { defaultValue: 'Quick examples' })}
          </p>
          <ul className="mt-2 space-y-2 text-sm text-secondary">
            {EXAMPLES.map(({ key, defaultValue }) => (
              <li key={key} className="flex gap-2">
                <span className="text-accent-600 dark:text-accent-400" aria-hidden>
                  •
                </span>
                <span>{t(key, { defaultValue })}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={openCreatePoll}
            className="btn-primary mt-5 w-full gap-2"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('polls.createPoll', { defaultValue: 'Create a Poll' })}
          </button>
        </div>
      </div>
    </aside>
  )
}
