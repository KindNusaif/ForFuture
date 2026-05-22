import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import FeatureGuideCard from '../components/guidance/FeatureGuideCard'
import PageContainer from '../components/ui/PageContainer'
import PrototypeDemoShowcase from '../components/guidance/PrototypeDemoShowcase'
import { shouldShowPrototypeDemoSection } from '../lib/guidanceDemo'
import { GUIDANCE_FEATURES, GUIDANCE_STEPS } from '../lib/guidanceFeatures'

export default function HowItWorks() {
  const { t } = useTranslation()

  return (
    <PageContainer className="!py-10 lg:!py-14">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-wider text-accent-600 dark:text-accent-400">
          {t('guidance.page.eyebrow', { defaultValue: 'How it works' })}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          {t('guidance.page.title', { defaultValue: 'How ForFuture works' })}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-secondary">
          {t('guidance.page.subtitle', {
            defaultValue:
              'ForFuture helps young people turn concerns, ideas, and community needs into organized civic action.',
          })}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/explore" className="btn-primary">
            {t('guidance.page.exploreCta', { defaultValue: 'Explore Movements' })}
          </Link>
          <Link to="/signup" className="btn-secondary">
            {t('guidance.page.joinCta', { defaultValue: 'Create an account' })}
          </Link>
        </div>
      </header>

      <section className="mt-14" aria-labelledby="how-steps-heading">
        <h2 id="how-steps-heading" className="text-xl font-bold text-primary">
          {t('guidance.page.stepsHeading', { defaultValue: 'Four steps to get started' })}
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GUIDANCE_STEPS.map((step, index) => (
            <li key={step.titleKey} className="guidance-step-card card-surface">
              <span className="guidance-step-num" aria-hidden>
                {index + 1}
              </span>
              <h3 className="mt-3 font-semibold text-primary">
                {t(step.titleKey, { defaultValue: step.titleDefault })}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                {t(step.descriptionKey, { defaultValue: step.descriptionDefault })}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 rounded-2xl border border-default bg-muted/20 px-5 py-5 sm:px-6">
        <h2 className="text-base font-semibold text-primary">
          {t('guidance.page.accountHeading', { defaultValue: 'What needs an account?' })}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          {t('guidance.page.accountBody', {
            defaultValue:
              'Anyone can browse public movements, polls, relief campaigns, the Impact Map, and Inspire Hub as a guest. Creating an account unlocks following, signing, voting, volunteering, commenting, and creating your own movements.',
          })}
        </p>
      </section>

      <section className="mt-14" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-xl font-bold text-primary">
          {t('guidance.page.featuresHeading', { defaultValue: 'What you can do on ForFuture' })}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDANCE_FEATURES.map((feature) => (
            <FeatureGuideCard key={feature.id} feature={feature} />
          ))}
        </div>
      </section>

      <section id="youth-voice" className="mt-14 scroll-mt-24 card-surface p-6 sm:p-8">
        <h2 className="text-lg font-bold text-primary">
          {t('guidance.features.youthVoiceId.title', { defaultValue: 'Youth Voice ID' })}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary">
          {t('guidance.tooltips.youthVoice', {
            defaultValue:
              'Your Youth Voice ID lets you speak publicly while keeping your personal profile identity private.',
          })}
        </p>
        <p className="guidance-hint mt-4">
          {t('guidance.microcopy.youthVoice', {
            defaultValue: 'Use protected expression when you want privacy on public posts.',
          })}
        </p>
      </section>

      {shouldShowPrototypeDemoSection() ? (
        <div className="mt-14">
          <PrototypeDemoShowcase />
        </div>
      ) : null}

      <p className="mt-14 text-center text-sm text-muted">
        {t('guidance.footer.tagline', {
          defaultValue: 'ForFuture helps youth move from concern to action — safely, visibly, and together.',
        })}
      </p>
    </PageContainer>
  )
}
