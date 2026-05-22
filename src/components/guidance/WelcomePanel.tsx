import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Map, PlusCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { dismissWelcome, isWelcomeDismissed } from '../../lib/guidanceStorage'

export default function WelcomePanel() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(!isWelcomeDismissed())

  if (!visible) return null

  function handleDismiss() {
    dismissWelcome()
    setVisible(false)
  }

  return (
    <aside className="guidance-welcome card-surface mb-6" aria-labelledby="welcome-panel-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="welcome-panel-title" className="text-lg font-semibold text-primary">
            {t('guidance.welcome.title', { defaultValue: 'Welcome to ForFuture' })}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-secondary">
            {t('guidance.welcome.description', {
              defaultValue:
                'Start by exploring movements, following causes you care about, or creating your first civic action.',
            })}
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost shrink-0 p-2"
          onClick={handleDismiss}
          aria-label={t('guidance.welcome.dismiss', { defaultValue: 'Got it' })}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/discover" className="btn-secondary inline-flex items-center gap-2 text-sm">
          <Compass className="h-4 w-4" aria-hidden />
          {t('guidance.welcome.explore', { defaultValue: 'Explore Movements' })}
        </Link>
        <Link to="/create" className="btn-secondary inline-flex items-center gap-2 text-sm">
          <PlusCircle className="h-4 w-4" aria-hidden />
          {t('guidance.welcome.create', { defaultValue: 'Create a Movement' })}
        </Link>
        <Link to="/impact-map" className="btn-secondary inline-flex items-center gap-2 text-sm">
          <Map className="h-4 w-4" aria-hidden />
          {t('guidance.welcome.map', { defaultValue: 'View Impact Map' })}
        </Link>
      </div>
      <button type="button" className="guidance-welcome-dismiss mt-3 text-sm font-medium text-accent-600 dark:text-accent-400" onClick={handleDismiss}>
        {t('guidance.welcome.gotIt', { defaultValue: 'Got it' })}
      </button>
    </aside>
  )
}
