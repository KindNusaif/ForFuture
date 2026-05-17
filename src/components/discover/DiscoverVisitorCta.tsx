import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function DiscoverVisitorCta() {
  const { t } = useTranslation()

  return (
    <section className="band-promo px-6 py-12 text-center sm:px-10">
      <div className="mx-auto max-w-xl">
        <h2 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          {t('discover.ctaTitle')}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-secondary sm:text-base">
          {t('discover.ctaSubtitle')}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/signup" className="btn-primary w-full sm:w-auto">
            {t('discover.createAccount')}
          </Link>
          <Link to="/movements" className="btn-secondary w-full sm:w-auto">
            {t('discover.exploreMovements')}
          </Link>
        </div>
      </div>
    </section>
  )
}
