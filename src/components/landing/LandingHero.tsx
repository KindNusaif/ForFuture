import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Compass,
  Megaphone,
  Sparkles,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CTAButton from './CTAButton'

const AVATAR_COLORS = [
  'bg-accent-500',
  'bg-brand-500',
  'bg-accent-400',
  'bg-brand-400',
  'bg-accent-600',
]

export default function LandingHero() {
  const { t } = useTranslation()

  const previewItems = [
    {
      icon: BarChart3,
      label: t('landing.previewPoll'),
      title: t('landing.previewPollExample'),
      featured: true,
    },
    {
      icon: Megaphone,
      label: t('landing.previewRaiseVoice'),
      title: t('landing.previewVoiceExample'),
    },
    {
      icon: Users,
      label: t('landing.previewVolunteer'),
      title: t('landing.previewVolunteerExample'),
    },
  ]

  return (
    <section className="landing-hero relative overflow-hidden px-4 py-16 sm:py-20 lg:py-28">
      <div className="landing-hero-glow landing-hero-glow-accent" aria-hidden />
      <div className="landing-hero-glow landing-hero-glow-brand" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="landing-stagger text-center lg:text-left">
          <span className="landing-eyebrow sm:text-xs">
            <Sparkles className="h-4 w-4" aria-hidden />
            {t('landing.eyebrow')}
          </span>
          <h1 className="hero-display mt-6">
            {t('landing.heroTitle')}
          </h1>
          <p className="mt-3 text-sm font-semibold sm:text-base" style={{ color: 'var(--ff-landing-tagline)' }}>
            {t('landing.heroTagline')}
          </p>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-secondary lg:mx-0">
            {t('landing.heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <CTAButton to="/signup" icon={ArrowRight} className="w-full sm:w-auto">
              {t('landing.joinCta')}
            </CTAButton>
            <CTAButton to="/discover" variant="secondary" icon={Compass} className="w-full sm:w-auto">
              {t('landing.exploreCta')}
            </CTAButton>
          </div>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-center lg:justify-start">
            <ul className="flex -space-x-2" aria-hidden>
              {AVATAR_COLORS.map((color, i) => (
                <li
                  key={color}
                  className={`flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-[var(--ff-surface)] ${color} text-xs font-bold text-white`}
                >
                  {String.fromCharCode(65 + i)}
                </li>
              ))}
            </ul>
            <p className="max-w-xs text-center text-sm text-secondary sm:text-left">{t('landing.socialProof')}</p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:max-w-none" aria-hidden>
          <div className="landing-hero-visual card-surface p-6 shadow-xl sm:p-8">
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-default pb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-accent-600 dark:text-accent-300">
                {t('landing.heroVisualLabel')}
              </p>
              <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-bold uppercase text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                {t('landing.heroVisualLive')}
              </span>
            </div>
            <div className="relative space-y-3">
              {previewItems.map(({ icon: Icon, label, title, featured }) => (
                <div
                  key={label}
                  className={
                    featured ? 'landing-preview-item landing-preview-item-featured' : 'landing-preview-item'
                  }
                >
                  <span className="tip-icon h-12! w-12!">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="poll-heading text-xs font-semibold uppercase">{label}</p>
                    <p className="wrap-user-text text-sm font-medium text-primary">{title}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/60 p-3">
              {[
                t('landing.heroMetricMovements'),
                t('landing.heroMetricPetitions'),
                t('landing.heroMetricRelief'),
              ].map((label) => (
                <div key={label} className="rounded-lg bg-surface px-2 py-2 text-center ring-1 ring-default">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
                  <p className="mt-0.5 text-sm font-bold text-accent-600 dark:text-accent-300">
                    {t('landing.heroMetricGrowing')}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <Link
            to="/discover"
            tabIndex={-1}
            className="pointer-events-none absolute -bottom-3 -left-3 hidden rounded-2xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-lg lg:block"
            aria-hidden
          >
            {t('landing.heroFloatingBadge')}
          </Link>
        </div>
      </div>
    </section>
  )
}
