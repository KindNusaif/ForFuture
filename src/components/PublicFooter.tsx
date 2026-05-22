import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'

const EXPLORE_LINKS = [
  { to: '/explore', labelKey: 'nav.exploreShort' as const, fallback: 'Explore' },
  { to: '/discover', labelKey: 'nav.discover' as const, fallback: 'Discover' },
  { to: '/impact', labelKey: 'nav.impactNav' as const, fallback: 'Impact' },
] as const

const TRUST_LINKS = [
  { to: '/privacy', labelKey: 'trust.privacy' as const, fallback: 'Privacy Policy' },
  { to: '/terms', labelKey: 'trust.terms' as const, fallback: 'Terms of Use' },
  {
    to: '/community-guidelines',
    labelKey: 'trust.guidelines' as const,
    fallback: 'Community Guidelines',
  },
  { to: '/contact', labelKey: 'trust.contact' as const, fallback: 'Contact' },
] as const

export default function PublicFooter() {
  const { t } = useTranslation()

  return (
    <footer className="landing-footer border-t border-default">
      <section className="page-container grid gap-10 py-12 lg:grid-cols-[1.2fr_1fr_1fr] lg:gap-12">
        <section className="max-w-sm">
          <Logo showTagline />
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            {t('guidance.footer.tagline', {
              defaultValue:
                'ForFuture helps youth move from concern to action — safely, visibly, and together.',
            })}
          </p>
        </section>

        <nav aria-label={t('landing.footerExplore', { defaultValue: 'Explore' })}>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            {t('landing.footerExplore', { defaultValue: 'Explore' })}
          </p>
          <ul className="mt-4 space-y-2.5">
            {EXPLORE_LINKS.map(({ to, labelKey, fallback }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-sm font-medium text-secondary transition hover:text-accent-600 dark:hover:text-accent-300"
                >
                  {t(labelKey, { defaultValue: fallback })}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/how-it-works"
                className="text-sm font-medium text-secondary transition hover:text-accent-600 dark:hover:text-accent-300"
              >
                {t('landing.footerHow', { defaultValue: 'How it works' })}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label={t('landing.footerLegal', { defaultValue: 'Legal & trust' })}>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            {t('landing.footerLegal', { defaultValue: 'Legal & trust' })}
          </p>
          <ul className="mt-4 space-y-2.5">
            {TRUST_LINKS.map(({ to, labelKey, fallback }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-sm font-medium text-secondary transition hover:text-accent-600 dark:hover:text-accent-300"
                >
                  {t(labelKey, { defaultValue: fallback })}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="/#why-forfuture"
                className="text-sm font-medium text-secondary transition hover:text-accent-600 dark:hover:text-accent-300"
              >
                {t('landing.footerFaq', { defaultValue: 'About' })}
              </a>
            </li>
          </ul>
        </nav>
      </section>

      <section className="border-t border-default">
        <p className="page-container py-5 text-center text-xs text-muted">
          © {new Date().getFullYear()} ForFuture.{' '}
          {t('landing.footerRights', { defaultValue: 'All rights reserved.' })}
        </p>
      </section>
    </footer>
  )
}
