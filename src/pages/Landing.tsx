import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Compass,
  HandHeart,
  Lightbulb,
  Megaphone,
  MessageCircle,
  Shield,
  Sparkles,
  Users,
  Vote,
  HeartHandshake,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Landing() {
  const { t } = useTranslation()

  const impactStats = [
    { value: '10K+', label: t('landing.statVoices') },
    { value: '500+', label: t('landing.statMovements') },
    { value: '2K+', label: t('landing.statVolunteers') },
    { value: '1K+', label: t('landing.statPolls') },
  ]

  const previewItems = [
    {
      icon: BarChart3,
      label: t('landing.previewPoll'),
      title: 'What should we tackle first?',
      iconWrap: 'tip-icon',
      to: '/create?type=quick_youth_poll',
      featured: true,
    },
    {
      icon: Megaphone,
      label: t('landing.previewRaiseVoice'),
      title: 'Climate justice starts in our schools',
      iconWrap: 'tip-icon',
    },
    {
      icon: Users,
      label: t('landing.previewVolunteer'),
      title: 'Weekend community cleanup',
      iconWrap:
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300',
    },
  ]

  const features = [
    {
      icon: MessageCircle,
      title: t('landing.featureSpeakTitle'),
      text: t('landing.featureSpeakText'),
    },
    {
      icon: Lightbulb,
      title: t('landing.featureActionTitle'),
      text: t('landing.featureActionText'),
    },
    {
      icon: Vote,
      title: t('landing.featurePollTitle'),
      text: t('landing.featurePollText'),
    },
    {
      icon: Shield,
      title: t('landing.featureTrustTitle'),
      text: t('landing.featureTrustText'),
    },
    {
      icon: HeartHandshake,
      title: t('relief.landingTitle'),
      text: t('relief.landingText'),
      link: '/explore/relief',
      linkLabel: t('relief.landingCta'),
    },
    {
      icon: Activity,
      title: t('landing.impactPulseTitle'),
      text: t('landing.impactPulseText'),
      link: '/impact',
      linkLabel: t('landing.impactPulseCta'),
    },
  ]

  const whyPoints = [
    { title: t('landing.whyIdeasTitle'), text: t('landing.whyIdeasText') },
    { title: t('landing.whyIdentityTitle'), text: t('landing.whyIdentityText') },
    { title: t('landing.whyActionTitle'), text: t('landing.whyActionText') },
  ]

  return (
    <>
      <section className="relative overflow-hidden px-4 py-16 sm:py-24 lg:py-28">
        <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-accent-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-brand-200/35 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <span className="landing-eyebrow sm:text-xs">
              <Sparkles className="h-4 w-4" aria-hidden />
              {t('landing.eyebrow')}
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-primary sm:text-5xl sm:leading-[1.1] lg:text-[3.25rem]">
              {t('landing.heroTitle')}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-secondary lg:mx-0">
              {t('landing.heroSubtitle')}
            </p>
            <p className="mt-3 text-sm font-medium" style={{ color: 'var(--ff-landing-tagline)' }}>
              {t('landing.heroTagline')}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link to="/signup" className="btn-primary w-full sm:w-auto">
                {t('landing.joinCta')}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/explore" className="btn-secondary w-full sm:w-auto">
                <Compass className="h-5 w-5" aria-hidden />
                {t('landing.exploreCta')}
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none" aria-hidden>
            <div className="card-surface landing-preview-panel p-6 shadow-xl sm:p-8">
              <div className="relative space-y-3">
                {previewItems.map(
                  ({ icon: Icon, label, title, iconWrap, to, featured }) => {
                    const inner = (
                      <>
                        <span
                          className={`${iconWrap} ${iconWrap === 'tip-icon' ? '!h-12 !w-12' : ''}`}
                        >
                          <Icon className="h-6 w-6" aria-hidden />
                        </span>
                        <div className="min-w-0 text-left">
                          <p className="poll-heading text-xs font-semibold uppercase">{label}</p>
                          <p className="wrap-user-text text-sm font-medium text-primary">{title}</p>
                        </div>
                      </>
                    )
                    const className = featured
                      ? 'landing-preview-item landing-preview-item-featured'
                      : 'landing-preview-item'
                    return to ? (
                      <Link key={label} to={to} className={`${className} hover:opacity-95`}>
                        {inner}
                      </Link>
                    ) : (
                      <div key={label} className={className}>
                        {inner}
                      </div>
                    )
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-stats-band">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 text-center sm:grid-cols-4">
          {impactStats.map(({ value, label }) => (
            <li key={label}>
              <p className="text-2xl font-bold text-accent-500 sm:text-3xl">{value}</p>
              <p className="mt-1 text-xs font-medium text-secondary sm:text-sm">{label}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-primary">{t('landing.featuresTitle')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-secondary">{t('landing.featuresSubtitle')}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {features.map(({ icon: Icon, title, text, link, linkLabel }) => (
            <article
              key={title}
              className="card-surface group p-6 transition hover:border-accent-400/40 hover:shadow-lg"
            >
              <span className="tip-icon !rounded-xl !p-3">
                <Icon className="h-7 w-7" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">{text}</p>
              {link && linkLabel && (
                <Link
                  to={link}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent-500 hover:text-accent-400"
                >
                  {linkLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section id="why-forfuture" className="landing-why-band scroll-mt-24 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="eyebrow">{t('landing.whyEyebrow')}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-primary">
              {t('landing.whyTitle')}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-secondary">{t('landing.whySubtitle')}</p>
          </div>
          <ul className="grid gap-6 md:grid-cols-3">
            {whyPoints.map(({ title, text }) => (
              <li key={title} className="card-surface p-6">
                <HandHeart className="h-8 w-8 text-brand-500 dark:text-brand-400" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-4 mb-20 sm:mx-auto sm:max-w-4xl">
        <div className="overflow-hidden rounded-3xl bg-linear-to-br from-accent-600 via-accent-700 to-brand-700 px-8 py-14 text-center text-white shadow-2xl shadow-accent-900/20">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('landing.ctaTitle')}</h2>
          <p className="mx-auto mt-3 max-w-lg text-accent-100">{t('landing.ctaSubtitle')}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-accent-700 shadow-lg transition hover:bg-accent-50"
            >
              {t('landing.joinCta')}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/explore"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-white/40 px-8 py-3.5 font-semibold text-white transition hover:bg-white/10"
            >
              <Compass className="h-5 w-5" />
              {t('landing.exploreCta')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

