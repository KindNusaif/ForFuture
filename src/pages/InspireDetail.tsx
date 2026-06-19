import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import InspireCategoryBadge from '../components/inspire/InspireCategoryBadge'
import InspireCommentsSection from '../components/inspire/InspireCommentsSection'
import InspireSaveButton from '../components/inspire/InspireSaveButton'
import InspireShareButton from '../components/inspire/InspireShareButton'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import PageContainer from '../components/ui/PageContainer'
import { InspireDetailSkeleton } from '../components/Skeleton'
import { usePageMeta } from '../hooks/usePageMeta'
import { useAuthUser } from '../hooks/useAuthUser'
import { useToast } from '../hooks/useToast'
import { deleteInspirePost, fetchInspirePostById } from '../lib/inspire'
import { getInspireCategoryConfig } from '../lib/inspireCategories'
import { formatError } from '../lib/errors'
import type { InspirePost } from '../types/inspire'

interface InspireDetailProps {
  backTo?: string
  backLabel?: string
}

function StructuredBody({ post }: { post: InspirePost }) {
  const { t } = useTranslation()
  const f = post.field_data

  const blocks: { label: string; value?: string }[] = []

  switch (post.category) {
    case 'achievement':
      blocks.push(
        { label: t('inspire.form.achievementWhat', { defaultValue: 'What did you achieve?' }), value: f.achievement_what },
        { label: t('inspire.form.achievementWhy', { defaultValue: 'Why does it matter to you?' }), value: f.achievement_why },
        { label: t('inspire.form.achievementLearned', { defaultValue: 'What did you learn?' }), value: f.achievement_learned },
      )
      break
    case 'success_story':
      blocks.push(
        { label: t('inspire.form.storyChallenge', { defaultValue: 'Challenge' }), value: f.story_challenge },
        { label: t('inspire.form.storyAction', { defaultValue: 'Action taken' }), value: f.story_action },
        { label: t('inspire.form.storyResult', { defaultValue: 'Result' }), value: f.story_result },
        { label: t('inspire.form.storyLesson', { defaultValue: 'Lesson for others' }), value: f.story_lesson },
      )
      break
    case 'motivation':
      blocks.push(
        { label: t('inspire.form.reflection', { defaultValue: 'Reflection' }), value: f.reflection },
        { label: t('inspire.form.reflectionInspired', { defaultValue: 'What inspired this' }), value: f.reflection_inspired_by },
      )
      break
    case 'entrepreneurship':
      blocks.push(
        { label: t('inspire.form.building', { defaultValue: 'Building / learning' }), value: f.building },
        { label: t('inspire.form.problemSolving', { defaultValue: 'Problem being solved' }), value: f.problem_solving },
        { label: t('inspire.form.challengeFaced', { defaultValue: 'Challenge faced' }), value: f.challenge_faced },
        { label: t('inspire.form.advice', { defaultValue: 'Advice' }), value: f.advice },
      )
      break
    case 'innovation':
      blocks.push(
        { label: t('inspire.form.ideaProblem', { defaultValue: 'Problem' }), value: f.idea_problem },
        { label: t('inspire.form.ideaHow', { defaultValue: 'How it could work' }), value: f.idea_how },
        { label: t('inspire.form.ideaBenefit', { defaultValue: 'Who benefits' }), value: f.idea_benefit },
      )
      break
    case 'book_idea':
      if (f.book_title?.trim()) {
        blocks.push({
          label: t('inspire.form.bookTitle', { defaultValue: 'Book' }),
          value: `${f.book_title}${f.book_author?.trim() ? ` — ${f.book_author}` : ''}`,
        })
      }
      blocks.push(
        { label: t('inspire.form.bookStandout', { defaultValue: 'Standout idea' }), value: f.book_standout },
        { label: t('inspire.form.bookLearned', { defaultValue: 'What I learned' }), value: f.book_learned },
        { label: t('inspire.form.bookApply', { defaultValue: 'How to apply it' }), value: f.book_apply },
      )
      break
  }

  const visible = blocks.filter((b) => b.value?.trim())

  if (visible.length === 0) {
    return <p className="wrap-user-text whitespace-pre-wrap text-secondary leading-relaxed">{post.body}</p>
  }

  return (
    <dl className="space-y-5">
      {visible.map((block) => (
        <div key={block.label}>
          <dt className="text-xs font-bold uppercase tracking-wide text-muted">{block.label}</dt>
          <dd className="wrap-user-text mt-1.5 text-sm leading-relaxed text-primary sm:text-base">
            {block.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export default function InspireDetail({ backTo = '/inspire', backLabel }: InspireDetailProps) {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { user, isGuest } = useAuthUser()
  const isGuestMode = isGuest

  const [post, setPost] = useState<InspirePost | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    void fetchInspirePostById(id, user?.id)
      .then((p) => {
        if (!cancelled) {
          setPost(p)
          setError(p ? null : t('inspire.notFound', { defaultValue: 'This story could not be found.' }))
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err)
          setError(
            t('inspire.storyLoadFailed', {
              defaultValue: 'We couldn’t load this story right now. Please try again.',
            }),
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, user?.id, t])

  const isOwner = post && user?.id === post.user_id
  const config = post ? getInspireCategoryConfig(post.category) : null

  usePageMeta({
    title: post?.title ?? t('inspire.pageTitle', { defaultValue: 'Inspire story' }),
    description: post?.body?.slice(0, 160),
    path: id ? `/inspire/${id}` : '/inspire',
  })

  async function handleDelete() {
    if (!post || !user?.id || deleting) return
    setDeleting(true)
    try {
      await deleteInspirePost(post.id, user.id)
      toast.success(t('inspire.deleted', { defaultValue: 'Story removed.' }))
      navigate(backTo, { replace: true })
    } catch (err) {
      toast.error(formatError(err))
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <InspireDetailSkeleton />
      </PageContainer>
    )
  }

  if (!post || error) {
    return (
      <PageContainer>
        <p className="alert-warning px-4 py-3 text-sm" role="alert">
          {error ?? t('inspire.notFound', { defaultValue: 'This story could not be found.' })}
        </p>
        <Link to={backTo} className="btn-secondary mt-4 inline-flex">
          {backLabel ?? t('inspire.backToHub', { defaultValue: 'Back to Inspire Hub' })}
        </Link>
      </PageContainer>
    )
  }

  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <PageContainer className="!py-6 lg:!py-8">
      <Breadcrumbs
        items={[
          { label: t('nav.home', { defaultValue: 'Home' }), to: '/' },
          { label: t('nav.inspireHub', { defaultValue: 'Inspire Hub' }), to: backTo },
          { label: post.title },
        ]}
      />
      <Link
        to={backTo}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {backLabel ?? t('inspire.backToHub', { defaultValue: 'Back to Inspire Hub' })}
      </Link>

      <article className="card-surface overflow-hidden p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <InspireCategoryBadge category={post.category} />
          <div className="flex items-center gap-1">
            <InspireSaveButton
              postId={post.id}
              userId={user?.id}
              saved={Boolean(post.saved_by_me)}
              onSavedChange={(saved) => setPost((p) => (p ? { ...p, saved_by_me: saved } : p))}
            />
            <InspireShareButton post={post} />
            {isOwner && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                disabled={deleting}
                className="share-icon-btn text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                aria-label={t('inspire.deleteAria', { defaultValue: 'Delete story' })}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-primary sm:text-3xl">{post.title}</h1>

        <p className="mt-3 text-sm text-secondary">
          <span className="font-semibold text-primary">
            {post.author_display_name ?? t('inspire.anonymousAuthor', { defaultValue: 'Community member' })}
          </span>
          <span className="mx-2 text-muted">·</span>
          <time dateTime={post.created_at}>{date}</time>
        </p>

        <div className="mt-8 border-t border-default pt-8">
          <StructuredBody post={post} />
        </div>

        {post.category === 'innovation' && post.could_become_movement && (
          <div className="mt-8 rounded-xl border border-accent-200/80 bg-accent-50/60 p-4 dark:border-accent-700/40 dark:bg-accent-950/30">
            <p className="text-sm font-semibold text-primary">
              {t('inspire.movementCtaTitle', { defaultValue: 'Ready to turn this into action?' })}
            </p>
            <p className="mt-1 text-sm text-secondary">
              {t('inspire.movementCtaBody', {
                defaultValue: 'Launch a youth movement and rally your community around this idea.',
              })}
            </p>
            {!isGuestMode && (
              <Link to="/create" className="btn-primary mt-3 inline-flex">
                {t('inspire.movementCtaButton', { defaultValue: 'Start a Youth Movement' })}
              </Link>
            )}
          </div>
        )}

        {config && (
          <p className="mt-6 text-xs text-muted">
            {t(config.descriptionKey, { defaultValue: config.descriptionDefault })}
          </p>
        )}
      </article>

      <InspireCommentsSection
        inspirePostId={post.id}
        guestMode={isGuestMode}
        currentUserId={user?.id}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('inspire.deleteTitle', { defaultValue: 'Delete this story?' })}
        description={t('inspire.deleteConfirm', {
          defaultValue: 'This story will be permanently removed. This cannot be undone.',
        })}
        confirmLabel={t('inspire.deleteConfirmButton', { defaultValue: 'Delete story' })}
        cancelLabel={t('common.cancel', { defaultValue: 'Cancel' })}
        variant="danger"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </PageContainer>
  )
}
