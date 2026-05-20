import { Megaphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function PollsInsightStrip() {
  const { t } = useTranslation()

  return (
    <div
      className="community-polls-insight-strip mb-5 flex gap-3 px-4 py-3.5 sm:items-center sm:px-5"
      role="note"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-700 dark:bg-accent-950/50 dark:text-accent-300"
        aria-hidden
      >
        <Megaphone className="h-4 w-4" />
      </span>
      <p className="text-sm leading-relaxed text-secondary">
        {t('polls.insightStrip', {
          defaultValue:
            'A civic listening space where young people test ideas, gather opinions, understand community priorities, and guide future movements.',
        })}
      </p>
    </div>
  )
}
