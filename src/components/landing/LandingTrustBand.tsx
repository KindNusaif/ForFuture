import { Eye, Lock, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SectionHeader from './SectionHeader'

const TRUST_POINTS = [
  {
    icon: Shield,
    titleKey: 'landing.trustSafeTitle',
    textKey: 'landing.trustSafeText',
    fallbackTitle: 'Community guidelines',
    fallbackText: 'Clear standards, reporting tools, and moderation workflows help keep civic spaces respectful.',
  },
  {
    icon: Lock,
    titleKey: 'landing.trustPrivacyTitle',
    textKey: 'landing.trustPrivacyText',
    fallbackTitle: 'Privacy-first options',
    fallbackText: 'Youth Voice ID lets you participate with protected identity when you need it.',
  },
  {
    icon: Eye,
    titleKey: 'landing.trustVisibleTitle',
    textKey: 'landing.trustVisibleText',
    fallbackTitle: 'Transparent impact',
    fallbackText: 'Track signatures, votes, volunteers, and momentum — so change is visible, not hidden.',
  },
] as const

export default function LandingTrustBand() {
  const { t } = useTranslation()

  return (
    <section id="trust" className="page-section scroll-mt-24 px-4">
      <div className="page-container">
        <div className="trust-panel p-6 sm:p-10">
          <SectionHeader
            align="center"
            eyebrow={t('landing.trustEyebrow', { defaultValue: 'Trust & safety' })}
            title={t('landing.trustTitle', { defaultValue: 'Built for real youth civic participation' })}
            subtitle={t('landing.trustSubtitle', {
              defaultValue:
                'ForFuture is designed to feel empowering — with guardrails that help communities stay safe, accountable, and welcoming.',
            })}
          />
          <ul className="trust-panel-grid mt-10 sm:grid-cols-3">
            {TRUST_POINTS.map(({ icon: Icon, titleKey, textKey, fallbackTitle, fallbackText }) => (
              <li key={titleKey} className="trust-panel-cell px-5 py-5 sm:px-6">
                <span className="landing-feature-icon inline-flex" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold text-primary">
                  {t(titleKey, { defaultValue: fallbackTitle })}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary">
                  {t(textKey, { defaultValue: fallbackText })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
