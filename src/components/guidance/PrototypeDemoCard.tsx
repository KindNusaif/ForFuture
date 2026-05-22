import { useTranslation } from 'react-i18next'
import type { PrototypeDemoItem } from '../../lib/guidanceDemo'

interface PrototypeDemoCardProps {
  item: PrototypeDemoItem
}

/** Explanatory demo card — not interactive (no links or click affordance). */
export default function PrototypeDemoCard({ item }: PrototypeDemoCardProps) {
  const { t } = useTranslation()
  const Icon = item.icon

  return (
    <article className="prototype-demo-card" aria-labelledby={`demo-card-${item.id}-title`}>
      <div className="prototype-demo-card-top">
        <span className="prototype-demo-icon" aria-hidden>
          <Icon className="h-5 w-5" />
        </span>
        <span className="prototype-demo-type">{t(item.typeKey, { defaultValue: item.typeDefault })}</span>
      </div>
      <h3 id={`demo-card-${item.id}-title`} className="prototype-demo-title">
        “{t(item.titleKey, { defaultValue: item.titleDefault })}”
      </h3>
      <p className="prototype-demo-description">
        {t(item.descriptionKey, { defaultValue: item.descriptionDefault })}
      </p>
      <span className="prototype-demo-pill">{t('guidance.demo.label', { defaultValue: 'Demo example' })}</span>
    </article>
  )
}
