import { Link } from 'react-router-dom'
import { Activity, BadgeCheck, Map, Mic, Quote, Sparkles, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'

interface QuickLink {
  to: string
  icon: LucideIcon
  titleKey: string
  titleDefault: string
  descKey: string
  descDefault: string
}

const QUICK_LINKS: QuickLink[] = [
  {
    to: '/create?type=raise_voice',
    icon: Mic,
    titleKey: 'feed.quickLinkSpeakTitle',
    titleDefault: 'Speak Freely',
    descKey: 'feed.quickLinkSpeakDesc',
    descDefault: 'Share concerns safely through Youth Voice ID.',
  },
  {
    to: '/create',
    icon: Users,
    titleKey: 'feed.quickLinkStartTitle',
    titleDefault: 'Start a Movement',
    descKey: 'feed.quickLinkStartDesc',
    descDefault: 'Create petitions, polls, volunteer drives, or civic actions.',
  },
  {
    to: '/impact',
    icon: BadgeCheck,
    titleKey: 'feed.quickLinkTrustTitle',
    titleDefault: 'Find Trusted Causes',
    descKey: 'feed.quickLinkTrustDesc',
    descDefault: 'Explore verified organizations and trusted campaigns.',
  },
]

/**
 * Logged-in feed sidebar: Youth Momentum inspiration panel + quick links.
 */
export default function TrendingPanel() {
  const { t } = useTranslation()

  return (
    <aside className="feed-sidebar hidden w-72 shrink-0 xl:block" aria-label={t('feed.sidebarLabel', { defaultValue: 'Your action hub' })}>
      <div className="sticky top-6 space-y-4">
        <div
          className="card-surface youth-momentum-card overflow-hidden p-5"
          aria-label={t('feed.youthMomentumAria', { defaultValue: 'Youth momentum inspiration' })}
        >
          <p className="feed-action-hub-eyebrow eyebrow">
            {t('feed.communityPulseEyebrow', { defaultValue: 'Your action hub' })}
          </p>
          <h2 className="feed-action-hub-title mt-1.5 font-sans text-lg font-bold tracking-tight text-primary">
            {t('feed.communityPulseTitle', { defaultValue: 'Make your next move' })}
          </h2>

          <div className="youth-momentum-divider mt-4" aria-hidden />

          <p className="youth-momentum-label mt-4">
            {t('feed.youthMomentumLabel', { defaultValue: 'Youth momentum' })}
          </p>

          <blockquote className="youth-momentum-quote-block mt-3">
            <Quote className="youth-momentum-quote-icon" aria-hidden />
            <p className="youth-momentum-quote">
              {t('feed.youthMomentumQuote', {
                defaultValue:
                  'Young people should be at the forefront of global change and innovation.',
              })}
            </p>
            <footer className="youth-momentum-attribution">
              {t('feed.youthMomentumAttribution', { defaultValue: '— Kofi Annan' })}
            </footer>
          </blockquote>

          <p className="youth-momentum-closing mt-3">
            {t('feed.youthMomentumClosing', { defaultValue: 'Your voice can become action.' })}
          </p>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-sm font-semibold text-primary">
            {t('feed.quickLinksTitle', { defaultValue: 'Quick links' })}
          </h3>
          <ul className="mt-3 space-y-2">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <li key={link.to}>
                  <Link to={link.to} className="quick-link-item">
                    <span className="quick-link-icon">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary">
                        {t(link.titleKey, { defaultValue: link.titleDefault })}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-secondary">
                        {t(link.descKey, { defaultValue: link.descDefault })}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <Link to="/inspire" className="dashboard-side-link card-surface group flex items-center gap-3 p-4">
          <span className="tip-icon h-10! w-10!">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary">
              {t('feed.inspireHubTitle', { defaultValue: 'Inspire Hub' })}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-secondary">
              {t('feed.inspireHubDesc', {
                defaultValue: 'Explore achievements, ideas, stories, and lessons worth your time.',
              })}
            </p>
            <p className="mt-2 text-xs font-semibold text-accent-600 dark:text-accent-400">
              {t('feed.openInspireHub', { defaultValue: 'Open Inspire Hub →' })}
            </p>
          </div>
        </Link>

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
            <p className="text-xs text-muted">{t('feed.impactMapHint', { defaultValue: 'Volunteer, civic action & issues near you' })}</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
