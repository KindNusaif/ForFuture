import { Link } from 'react-router-dom'
import { ArrowRight, HeartHandshake, MapPin, Megaphone, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SectionHeader from './SectionHeader'

const MARKERS = [
  { top: '22%', left: '28%', color: 'bg-accent-500', icon: Megaphone },
  { top: '48%', left: '58%', color: 'bg-brand-500', icon: Users },
  { top: '62%', left: '22%', color: 'bg-accent-400', icon: HeartHandshake },
  { top: '34%', left: '72%', color: 'bg-brand-400', icon: MapPin },
]

export default function LandingImpactPreview() {
  const { t } = useTranslation()

  const legend = [
    { icon: Megaphone, label: t('landing.impactLegendVoices'), count: t('landing.impactLegendActive') },
    { icon: Users, label: t('landing.impactLegendVolunteer'), count: t('landing.impactLegendGrowing') },
    { icon: HeartHandshake, label: t('landing.impactLegendRelief'), count: t('landing.impactLegendActive') },
  ]

  return (
    <section id="impact-preview" className="scroll-mt-24 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          title={t('landing.impactSectionTitle')}
          subtitle={t('landing.impactSectionSubtitle')}
        />

        <div className="mt-12 overflow-hidden rounded-3xl border border-default bg-nav shadow-xl ring-1 ring-default">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-default px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent-600 dark:text-accent-300">
                {t('landing.impactPreviewLabel')}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-primary">{t('landing.impactPreviewHint')}</p>
            </div>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              {t('landing.impactPreviewBadge')}
            </span>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
            <div className="relative min-h-[280px] bg-linear-to-br from-accent-50/80 via-surface to-brand-50/60 p-6 dark:from-accent-950/30 dark:via-surface dark:to-brand-950/20 sm:min-h-[340px]">
              <div
                className="absolute inset-4 rounded-2xl border border-dashed border-accent-200/60 dark:border-accent-800/40"
                aria-hidden
              />
              <svg
                className="absolute inset-0 h-full w-full text-accent-200/50 dark:text-accent-800/30"
                aria-hidden
              >
                <defs>
                  <pattern id="landing-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#landing-grid)" />
              </svg>

              {MARKERS.map(({ top, left, color, icon: Icon }, i) => (
                <span
                  key={i}
                  className={`absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-lg ${color}`}
                  style={{ top, left }}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}

              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 sm:right-auto">
                {['District A', 'District B', 'District C'].map((d) => (
                  <span
                    key={d}
                    className="rounded-lg bg-surface/95 px-2.5 py-1 text-xs font-semibold text-primary shadow-sm ring-1 ring-default backdrop-blur"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <aside className="border-t border-default bg-muted/30 p-5 lg:border-t-0 lg:border-l">
              <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                {t('landing.impactLegendTitle')}
              </p>
              <ul className="mt-4 space-y-3">
                {legend.map(({ icon: Icon, label, count }) => (
                  <li key={label} className="flex items-center gap-3 rounded-xl bg-surface p-3 ring-1 ring-default">
                    <span className="tip-icon h-9! w-9! rounded-lg!">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-primary">{label}</p>
                      <p className="text-xs text-secondary">{count}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                to="/impact"
                className="btn-primary mt-5 w-full"
              >
                {t('landing.impactCta')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}
