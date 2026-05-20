import {
  BarChart3,
  Compass,
  Fingerprint,
  HandHeart,
  HeartHandshake,
  Lightbulb,
  Map,
  Megaphone,
  Rocket,
  Shield,
  Sparkles,
  Users,
  Vote,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CTAButton from '../components/landing/CTAButton'
import FeatureCard from '../components/landing/FeatureCard'
import LandingHero from '../components/landing/LandingHero'
import LandingHowItWorks from '../components/landing/LandingHowItWorks'
import LandingImpactPreview from '../components/landing/LandingImpactPreview'
import LandingImpactStats from '../components/landing/LandingImpactStats'
import LandingTrustBand from '../components/landing/LandingTrustBand'
import SectionHeader from '../components/landing/SectionHeader'

export default function Landing() {
  const { t } = useTranslation()

  const valueCards = [
    {
      icon: Megaphone,
      title: t('landing.valueRaiseTitle'),
      text: t('landing.valueRaiseText'),
    },
    {
      icon: Rocket,
      title: t('landing.valueActionTitle'),
      text: t('landing.valueActionText'),
    },
    {
      icon: BarChart3,
      title: t('landing.valueImpactTitle'),
      text: t('landing.valueImpactText'),
    },
  ]

  const toolkitCards = [
    {
      icon: Compass,
      title: t('landing.toolkitFeedTitle'),
      text: t('landing.toolkitFeedText'),
      link: '/explore',
      linkLabel: t('landing.toolkitFeedCta'),
      featured: true,
      className: 'lg:col-span-2 lg:row-span-2',
    },
    {
      icon: Users,
      title: t('landing.toolkitVolunteerTitle'),
      text: t('landing.toolkitVolunteerText'),
    },
    {
      icon: HeartHandshake,
      title: t('landing.toolkitReliefTitle'),
      text: t('landing.toolkitReliefText'),
      link: '/explore/relief',
      linkLabel: t('relief.landingCta'),
    },
    {
      icon: HandHeart,
      title: t('landing.toolkitCivicTitle'),
      text: t('landing.toolkitCivicText'),
    },
    {
      icon: Vote,
      title: t('landing.toolkitPollTitle'),
      text: t('landing.toolkitPollText'),
    },
    {
      icon: Shield,
      title: t('landing.toolkitTrustTitle'),
      text: t('landing.toolkitTrustText'),
    },
  ]

  const whyPoints = [
    { title: t('landing.whySafeTitle'), text: t('landing.whySafeText') },
    { title: t('landing.whyBarriersTitle'), text: t('landing.whyBarriersText') },
    { title: t('landing.whyVisibleTitle'), text: t('landing.whyVisibleText') },
  ]

  return (
    <>
      <LandingHero />

      <LandingHowItWorks />

      <section className="landing-value-band page-section px-4">
        <div className="page-container">
          <SectionHeader
            title={t('landing.valueTitle')}
            subtitle={t('landing.valueSubtitle')}
          />
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {valueCards.map(({ icon: Icon, title, text }) => (
              <li key={title} className="landing-value-card">
                <span className="landing-feature-icon" aria-hidden>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="toolkit" className="page-section scroll-mt-24 px-4">
        <div className="page-container">
          <SectionHeader
            title={t('landing.toolkitTitle')}
            subtitle={t('landing.toolkitSubtitle')}
          />
          <ul className="landing-toolkit-grid mt-12">
            {toolkitCards.map(
              ({ icon, title, text, link, linkLabel, featured, className }) => (
                <li key={title} className={className}>
                  <FeatureCard
                    icon={icon}
                    title={title}
                    description={text}
                    link={link}
                    linkLabel={linkLabel}
                    featured={featured}
                    className="h-full"
                  />
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      <LandingImpactPreview />

      <LandingTrustBand />

      <section id="why-forfuture" className="landing-why-band page-section scroll-mt-24 px-4">
        <div className="page-container grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <section>
            <p className="eyebrow">{t('landing.whyEyebrow')}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              {t('landing.differentTitle')}
            </h2>
            <ul className="mt-8 space-y-6">
              {whyPoints.map(({ title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-600 dark:bg-accent-950/50 dark:text-accent-300">
                    <Lightbulb className="h-4 w-4" aria-hidden />
                  </span>
                  <section>
                    <h3 className="font-semibold text-primary">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-secondary">{text}</p>
                  </section>
                </li>
              ))}
            </ul>
          </section>

          <LandingImpactStats />
        </div>
      </section>

      <section id="innovation" className="page-section scroll-mt-24 px-4">
        <div className="page-container">
          <SectionHeader title={t('landing.innovationTitle')} />
          <ul className="mt-12 grid gap-6 lg:grid-cols-2">
            <li className="landing-innovation-card">
              <span className="landing-feature-icon" aria-hidden>
                <Fingerprint className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-primary">{t('landing.voiceIdTitle')}</h3>
              <p className="mt-3 text-sm leading-relaxed text-secondary sm:text-base">
                {t('landing.voiceIdText')}
              </p>
            </li>
            <li className="landing-innovation-card landing-innovation-card-accent">
              <span className="landing-feature-icon landing-feature-icon-brand" aria-hidden>
                <Sparkles className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-primary">{t('landing.actionPathTitle')}</h3>
              <p className="mt-3 text-sm leading-relaxed text-secondary sm:text-base">
                {t('landing.actionPathText')}
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section className="page-section px-4">
        <div className="landing-final-cta page-container max-w-5xl px-6 py-14 text-center sm:px-10 sm:py-16">
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">{t('landing.finalCtaTitle')}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-accent-100 sm:text-lg">{t('landing.finalCtaSubtitle')}</p>
          <p className="mt-2 text-sm text-accent-200/90">{t('landing.finalCtaNote')}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CTAButton to="/signup" variant="inverse">
              {t('landing.finalCtaButton')}
            </CTAButton>
            <CTAButton to="/discover" variant="inverse-outline" icon={Map}>
              {t('landing.exploreCta')}
            </CTAButton>
          </div>
        </div>
      </section>
    </>
  )
}
