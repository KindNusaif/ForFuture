import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import InspireCreateForm from '../components/inspire/InspireCreateForm'
import PageContainer from '../components/ui/PageContainer'
import { useAuthUser } from '../hooks/useAuthUser'
import { useToast } from '../hooks/useToast'
import { createInspirePost } from '../lib/inspire'
import { navigateAfterSuccess } from '../lib/navigationTiming'
import { INSPIRE_CATEGORIES, isInspireCategory } from '../lib/inspireCategories'
import type { InspireCategory, InspireFieldData } from '../types/inspire'

export default function InspireCreate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthUser()
  const [searchParams] = useSearchParams()
  const typeParam = searchParams.get('type')
  const [selected, setSelected] = useState<InspireCategory | null>(
    typeParam && isInspireCategory(typeParam) ? typeParam : null,
  )
  const [loading, setLoading] = useState(false)
  const [publishedId, setPublishedId] = useState<string | null>(null)

  async function handlePublish(payload: {
    title: string
    body: string
    field_data: InspireFieldData
    could_become_movement?: boolean
  }) {
    if (!user?.id) return
    setLoading(true)
    try {
      const post = await createInspirePost(user.id, {
        category: selected!,
        title: payload.title,
        body: payload.body,
        field_data: payload.field_data,
        could_become_movement: payload.could_become_movement,
      })
      toast.success(
        t('inspire.published', { defaultValue: 'Your story has been shared.' }),
      )
      setPublishedId(post.id)
      navigateAfterSuccess(navigate, `/inspire/${post.id}`, { replace: true })
    } catch (err) {
      console.error(err)
      toast.error(
        t('inspire.publishError', {
          defaultValue: 'We couldn’t publish your story. Please try again.',
        }),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer className="mx-auto max-w-2xl !py-6 lg:!py-8">
      {publishedId ? (
        <div className="card-surface flex flex-col items-center gap-4 p-10 text-center" role="status" aria-live="polite">
          <CheckCircle2 className="h-12 w-12 text-brand-600" aria-hidden />
          <h2 className="text-xl font-bold text-primary">
            {t('inspire.published', { defaultValue: 'Your story has been shared.' })}
          </h2>
          <p className="text-sm text-secondary">
            {t('inspire.publishedRedirect', { defaultValue: 'Opening your story…' })}
          </p>
        </div>
      ) : (
        <>
      <Link
        to="/inspire"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('inspire.backToHub', { defaultValue: 'Back to Inspire Hub' })}
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          {selected
            ? t('inspire.createTitle', { defaultValue: 'Share in Inspire Hub' })
            : t('inspire.selectCategoryTitle', { defaultValue: 'What would you like to share?' })}
        </h1>
        <p className="mt-2 text-secondary">
          {t('inspire.createSubtitle', {
            defaultValue: 'Choose a category and share something that could help another young person grow.',
          })}
        </p>
      </header>

      {!selected ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {INSPIRE_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <li key={cat.value}>
                <button
                  type="button"
                  onClick={() => setSelected(cat.value)}
                  className="inspire-category-picker card-surface flex w-full items-start gap-3 rounded-xl p-4 text-left outline-none transition hover:border-accent-300 focus-visible:ring-2 focus-visible:ring-accent-500 dark:hover:border-accent-600"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${cat.badgeClass}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-primary">
                      {t(cat.labelKey, { defaultValue: cat.labelDefault })}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-secondary">
                      {t(cat.descriptionKey, { defaultValue: cat.descriptionDefault })}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mb-4 text-sm font-medium text-accent-600 hover:underline dark:text-accent-400"
          >
            {t('inspire.changeCategory', { defaultValue: '← Change category' })}
          </button>
          <InspireCreateForm category={selected} loading={loading} onSubmit={handlePublish} />
        </>
      )}
        </>
      )}
    </PageContainer>
  )
}
