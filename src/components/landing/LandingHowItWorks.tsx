import { Megaphone, Rocket, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SectionHeader from './SectionHeader'

const STEPS = [
  { icon: Megaphone, titleKey: 'landing.howStep1Title', textKey: 'landing.howStep1Text', fallbackTitle: 'Share your voice', fallbackText: 'Post ideas, petitions, polls, or volunteer drives with your Youth Voice ID or profile.' },
  { icon: Users, titleKey: 'landing.howStep2Title', textKey: 'landing.howStep2Text', fallbackTitle: 'Grow community support', fallbackText: 'Others discover, vote, sign, volunteer, and amplify movements that matter.' },
  { icon: Rocket, titleKey: 'landing.howStep3Title', textKey: 'landing.howStep3Text', fallbackTitle: 'Track real impact', fallbackText: 'See momentum on the feed, impact map, and Youth Impact Pulse dashboard.' },
] as const

export default function LandingHowItWorks() {
  const { t } = useTranslation()

  return (
    <section id="how-it-works" className="page-section scroll-mt-24 px-4">
      <div className="page-container">
        <SectionHeader
          eyebrow={t('landing.howEyebrow', { defaultValue: 'How it works' })}
          title={t('landing.howTitle', { defaultValue: 'From voice to action in three steps' })}
          subtitle={t('landing.howSubtitle', {
            defaultValue:
              'ForFuture is built for young people who want to organize, participate, and measure civic change — safely and visibly.',
          })}
        />
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, titleKey, textKey, fallbackTitle, fallbackText }, index) => (
            <li key={titleKey} className="step-card">
              <span className="step-number" aria-hidden>
                {index + 1}
              </span>
              <span className="landing-feature-icon mt-5 inline-flex" aria-hidden>
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-primary">
                {t(titleKey, { defaultValue: fallbackTitle })}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                {t(textKey, { defaultValue: fallbackText })}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
