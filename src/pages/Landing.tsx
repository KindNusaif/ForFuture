import { Link } from 'react-router-dom'
import {
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
            <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-accent-200/80 bg-accent-50 px-4 py-2 sm:text-xs">
              <Sparkles className="h-4 w-4" aria-hidden />
              {t('landing.eyebrow')}
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.1] lg:text-[3.25rem]">
              {t('landing.heroTitle')}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
              {t('landing.heroSubtitle')}
            </p>
            <p className="mt-3 text-sm font-medium text-accent-700">{t('landing.heroTagline')}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link to="/signup" className="btn-primary w-full sm:w-auto">
                {t('landing.joinCta')}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/explore" className="btn-secondary w-full sm:w-auto">
                <Compass className="h-5 w-5 text-accent-600" />
                {t('landing.exploreCta')}
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none" aria-hidden>
            <div className="card-surface relative overflow-hidden p-8 shadow-xl shadow-accent-900/5">
              <div className="absolute inset-0 bg-linear-to-br from-accent-50 via-white to-brand-50" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/80">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                    <Megaphone className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-semibold uppercase text-accent-600">
                      {t('landing.previewRaiseVoice')}
                    </p>
                    <p className="wrap-user-text text-sm font-medium text-slate-800">
                      Climate justice starts in our schools
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/80">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <Users className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-semibold uppercase text-brand-700">
                      {t('landing.previewVolunteer')}
                    </p>
                    <p className="text-sm font-medium text-slate-800">Weekend community cleanup</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/80">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <BarChart3 className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-semibold uppercase text-indigo-700">
                      {t('landing.previewPoll')}
                    </p>
                    <p className="text-sm font-medium text-slate-800">What should we tackle first?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white py-12">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 text-center sm:grid-cols-4">
          {impactStats.map(({ value, label }) => (
            <li key={label}>
              <p className="text-2xl font-bold text-accent-600 sm:text-3xl">{value}</p>
              <p className="mt-1 text-xs font-medium text-slate-600 sm:text-sm">{label}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">{t('landing.featuresTitle')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">{t('landing.featuresSubtitle')}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="card-surface group p-6 transition hover:border-accent-200 hover:shadow-lg"
            >
              <span className="inline-flex rounded-xl bg-accent-50 p-3 text-accent-600 transition group-hover:bg-accent-100">
                <Icon className="h-7 w-7" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="why-forfuture" className="scroll-mt-24 bg-slate-100/60 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="eyebrow">{t('landing.whyEyebrow')}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              {t('landing.whyTitle')}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">{t('landing.whySubtitle')}</p>
          </div>
          <ul className="grid gap-6 md:grid-cols-3">
            {whyPoints.map(({ title, text }) => (
              <li key={title} className="card-surface p-6">
                <HandHeart className="h-8 w-8 text-brand-600" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
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
