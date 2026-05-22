import { Link } from 'react-router-dom'
import type { GuidanceFeature } from '../../lib/guidanceFeatures'
import { useTranslation } from 'react-i18next'

interface FeatureGuideCardProps {
  feature: GuidanceFeature
}

export default function FeatureGuideCard({ feature }: FeatureGuideCardProps) {
  const { t } = useTranslation()
  const Icon = feature.icon

  return (
    <article className="guidance-feature-card card-surface">
      <span className="guidance-feature-icon" aria-hidden>
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-base font-semibold text-primary">
        {t(feature.titleKey, { defaultValue: feature.titleDefault })}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-secondary">
        {t(feature.descriptionKey, { defaultValue: feature.descriptionDefault })}
      </p>
      <Link to={feature.to} className="guidance-feature-cta mt-4 inline-flex text-sm font-semibold">
        {t(feature.ctaKey, { defaultValue: feature.ctaDefault })}
        <span aria-hidden> →</span>
      </Link>
    </article>
  )
}
