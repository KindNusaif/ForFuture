import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import EmptyState from '../components/EmptyState'
import { usePageMeta } from '../hooks/usePageMeta'

export default function NotFound() {
  const { t } = useTranslation()

  usePageMeta({
    title: t('notFound.title'),
    description: t('notFound.description'),
    indexable: false,
  })

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
      <EmptyState
        icon={Compass}
        title={t('notFound.title')}
        description={t('notFound.description')}
        action={{ label: t('notFound.backHome'), to: '/' }}
      />
      <p className="mt-6 text-center">
        <Link to="/explore" className="text-sm font-semibold text-accent-600 hover:underline dark:text-accent-400">
          {t('notFound.browseMovements')}
        </Link>
      </p>
    </div>
  )
}
