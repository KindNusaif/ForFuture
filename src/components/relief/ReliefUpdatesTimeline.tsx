import { useTranslation } from 'react-i18next'
import type { ReliefCampaignUpdate } from '../../lib/reliefUpdates'

export default function ReliefUpdatesTimeline({ updates }: { updates: ReliefCampaignUpdate[] }) {
  const { t } = useTranslation()

  if (updates.length === 0) {
    return (
      <p className="text-sm text-muted">{t('reliefHub.updatesEmpty')}</p>
    )
  }

  return (
    <ol className="relief-updates-timeline">
      {updates.map((u) => (
        <li key={u.id} className="relief-updates-item">
          <div className="relief-updates-meta">
            <span className="relief-updates-type">{t(`reliefHub.updateTypes.${u.update_type}`, u.update_type)}</span>
            <time className="text-xs text-muted" dateTime={u.created_at}>
              {new Date(u.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>
          <h3 className="mt-1 font-semibold text-primary">{u.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-secondary">{u.body}</p>
        </li>
      ))}
    </ol>
  )
}
