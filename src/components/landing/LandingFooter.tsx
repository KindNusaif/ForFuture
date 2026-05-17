import { useTranslation } from 'react-i18next'
import Logo from '../Logo'

export default function LandingFooter() {
  const { t } = useTranslation()

  const links = [
    { label: t('landing.footerPrivacy'), href: 'mailto:privacy@forfuture.app' },
    { label: t('landing.footerTerms'), href: 'mailto:legal@forfuture.app' },
    { label: t('landing.footerContact'), href: 'mailto:hello@forfuture.app' },
    { label: t('landing.footerFaq'), href: '/#why-forfuture' },
  ]

  return (
    <footer className="landing-footer border-t border-default">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <section className="max-w-sm">
          <Logo showTagline />
          <p className="mt-4 text-sm leading-relaxed text-secondary">{t('landing.footerTagline')}</p>
        </section>

        <nav className="flex flex-wrap gap-x-8 gap-y-3" aria-label={t('landing.footerNav')}>
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm font-medium text-secondary transition hover:text-accent-600 dark:hover:text-accent-300"
            >
              {label}
            </a>
          ))}
        </nav>
      </section>

      <section className="border-t border-default">
        <p className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} ForFuture. {t('landing.footerRights')}
        </p>
      </section>
    </footer>
  )
}
