import { Link } from 'react-router-dom'
import { Activity, Compass, Heart, Map, Sparkles, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const tips = [
  {
    icon: Sparkles,
    title: 'Speak freely',
    text: 'Use your Youth Voice ID when you want privacy on public posts.',
  },
  {
    icon: Users,
    title: 'Organize boldly',
    text: 'Start volunteer drives, civic actions, and community movements.',
  },
  {
    icon: Heart,
    title: 'Build trust',
    text: 'Look for Verified Organization and Trusted Campaign badges.',
  },
]

export default function TrendingPanel() {
  const { t } = useTranslation()

  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="sticky top-6 space-y-4">
        <div className="card-surface community-pulse-card overflow-hidden p-5">
          <p className="eyebrow">{t('feed.communityPulseEyebrow', { defaultValue: 'Community pulse' })}</p>
          <h2 className="mt-1 text-lg font-bold text-primary">
            {t('feed.communityPulseTitle', { defaultValue: 'Shape tomorrow' })}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            {t('feed.communityPulseBody', {
              defaultValue: 'Speak freely. Organize boldly. Build the future together.',
            })}
          </p>
          <Link to="/discover" className="community-pulse-cta btn-secondary mt-4 w-full">
            <Compass className="h-4 w-4 shrink-0" aria-hidden />
            {t('feed.exploreParticipate', { defaultValue: 'Explore ways to participate' })}
          </Link>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-sm font-semibold text-primary">
            {t('feed.quickLinksTitle', { defaultValue: 'Quick links' })}
          </h3>
          <ul className="mt-3 space-y-2">
            {tips.map(({ icon: Icon, title, text }) => (
              <li key={title} className="quick-link-item">
                <span className="quick-link-icon">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-secondary">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <Link to="/impact" className="dashboard-side-link card-surface flex items-center gap-3 p-4">
          <span className="tip-icon h-10! w-10!">
            <Activity className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">{t('nav.impactPulse')}</p>
            <p className="text-xs text-muted">{t('impactPulse.tagline')}</p>
          </div>
        </Link>

        <Link
          to="/impact-map"
          className="dashboard-side-link card-surface flex items-center gap-3 p-4"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
            <Map className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">{t('nav.impactMap')}</p>
            <p className="text-xs text-muted">Volunteer, civic action &amp; issues near you</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
