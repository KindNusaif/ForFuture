import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { dismissQuickStart, isQuickStartDismissed } from '../../lib/guidanceStorage'

const ITEMS = [
  { key: 'guidance.quickStart.item1', defaultValue: 'Explore a movement' },
  { key: 'guidance.quickStart.item2', defaultValue: 'Follow a cause' },
  { key: 'guidance.quickStart.item3', defaultValue: 'Vote in a poll' },
  { key: 'guidance.quickStart.item4', defaultValue: 'Create your first movement' },
  { key: 'guidance.quickStart.item5', defaultValue: 'Share your progress in Inspire Hub' },
] as const

export default function QuickStartPanel() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(!isQuickStartDismissed())

  if (!visible) return null

  function handleDismiss() {
    dismissQuickStart()
    setVisible(false)
  }

  return (
    <aside className="guidance-quick-start card-surface mb-6" aria-labelledby="quick-start-title">
      <div className="flex items-start justify-between gap-2">
        <h2 id="quick-start-title" className="text-base font-semibold text-primary">
          {t('guidance.quickStart.title', { defaultValue: 'Quick Start' })}
        </h2>
        <button
          type="button"
          className="btn-ghost shrink-0 p-1.5"
          onClick={handleDismiss}
          aria-label={t('common.close', { defaultValue: 'Close' })}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {ITEMS.map(({ key, defaultValue }, index) => (
          <li key={key} className="flex items-start gap-2 text-sm text-secondary">
            {index === 0 ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-600 dark:text-accent-400" aria-hidden />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
            )}
            <span>{t(key, { defaultValue })}</span>
          </li>
        ))}
      </ul>
      <Link to="/discover" className="btn-primary mt-4 inline-flex text-sm" onClick={handleDismiss}>
        {t('guidance.quickStart.cta', { defaultValue: 'Start Exploring' })}
      </Link>
    </aside>
  )
}
