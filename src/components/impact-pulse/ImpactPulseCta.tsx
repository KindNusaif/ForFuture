import { Link } from 'react-router-dom'
import { ArrowRight, Compass, PlusCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  isMember: boolean
}

export default function ImpactPulseCta({ isMember }: Props) {
  const { t } = useTranslation()
  const createTo = isMember ? '/create' : '/signup'

  return (
    <section aria-labelledby="impact-cta-heading" className="band-promo px-6 py-12 text-center sm:px-10">
      <h2 id="impact-cta-heading" className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
        {t('impactPulse.cta.title')}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-secondary sm:text-base">
        {t('impactPulse.cta.subtitle')}
      </p>
      <div className="relative mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <Link to={createTo} className="btn-primary w-full sm:w-auto">
          <PlusCircle className="h-5 w-5" aria-hidden />
          {t('impactPulse.cta.create')}
        </Link>
        <Link to={isMember ? '/feed' : '/movements'} className="btn-secondary w-full sm:w-auto">
          <Compass className="h-5 w-5 text-accent-600" aria-hidden />
          {t('impactPulse.cta.explore')}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
