import { HeartHandshake, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ReliefCreateRequestCardProps {
  onCreate: () => void
  className?: string
}

/** Relief-specific create CTA — blood/item drives for members; auth gate for guests. */
export default function ReliefCreateRequestCard({
  onCreate,
  className = '',
}: ReliefCreateRequestCardProps) {
  const { t } = useTranslation()

  return (
    <section
      className={`relief-hub-create-card card-surface ${className}`.trim()}
      aria-labelledby="relief-create-card-title"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="relief-hub-create-card-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            aria-hidden
          >
            <HeartHandshake className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 id="relief-create-card-title" className="text-base font-semibold text-primary sm:text-lg">
              {t('relief.createTitle')}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-secondary">
              {t('reliefHub.createBarHint')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="btn-primary inline-flex w-full shrink-0 items-center justify-center gap-2 sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('reliefHub.createReliefCta', { defaultValue: 'Start a Relief Request' })}
        </button>
      </div>
    </section>
  )
}
