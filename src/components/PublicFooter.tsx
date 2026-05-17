import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'

const TRUST_LINKS = [
  { to: '/privacy', labelKey: 'trust.privacy' as const, fallback: 'Privacy Policy' },
  { to: '/terms', labelKey: 'trust.terms' as const, fallback: 'Terms of Use' },
  {
    to: '/community-guidelines',
    labelKey: 'trust.guidelines' as const,
    fallback: 'Community Guidelines',
  },
  { to: '/contact', labelKey: 'trust.contact' as const, fallback: 'Contact' },
]

export default function PublicFooter() {
  const { t } = useTranslation()

  return (
    <footer className="landing-footer border-t border-default">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <section className="max-w-sm">
          <Logo showTagline />
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            {t('landing.footerTagline', {
              defaultValue:
                'A youth-centered civic platform to launch movements, polls, petitions, and volunteer drives.',
            })}
          </p>
        </section>

        <nav className="flex flex-wrap gap-x-8 gap-y-3" aria-label={t('landing.footerNav', { defaultValue: 'Footer' })}>
          {TRUST_LINKS.map(({ to, labelKey, fallback }) => (
            <Link
              key={to}
              to={to}
              className="text-sm font-medium text-secondary transition hover:text-accent-600 dark:hover:text-accent-300"
            >
              {t(labelKey, { defaultValue: fallback })}
            </Link>
          ))}
          <a
            href="/#why-forfuture"
            className="text-sm font-medium text-secondary transition hover:text-accent-600 dark:hover:text-accent-300"
          >
            {t('landing.footerFaq', { defaultValue: 'FAQ' })}
          </a>
        </nav>
      </section>

      <section className="border-t border-default">
        <p className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} ForFuture.{' '}
          {t('landing.footerRights', { defaultValue: 'All rights reserved.' })}
        </p>
      </section>
    </footer>
  )
}
