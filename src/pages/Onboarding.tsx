import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Check,
  Heart,
  HeartHandshake,
  Loader2,
  Megaphone,
  Scale,
  Shield,
  TreePine,
  Users,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import {
  categoriesFromCauseIds,
  ONBOARDING_CAUSES,
  PARTICIPATION_OPTIONS,
  saveOnboardingPreferences,
} from '../lib/onboarding'
import { enrichPosts, fetchFeedRowsPage } from '../lib/posts'
import { formatError } from '../lib/errors'
import PostCard from '../components/PostCard'
import { PostCardSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { Inbox } from 'lucide-react'
import type { Post } from '../types'
import type { LucideIcon } from 'lucide-react'

const CAUSE_ICONS: Record<string, LucideIcon> = {
  education: BookOpen,
  environment: TreePine,
  health: Heart,
  community_safety: Shield,
  relief: HeartHandshake,
  youth_rights: Scale,
}

const PREF_ICONS: Record<string, LucideIcon> = {
  support: Heart,
  volunteer: Users,
  petition: Megaphone,
  raise: Megaphone,
}

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [causes, setCauses] = useState<string[]>([])
  const [prefs, setPrefs] = useState<string[]>([])
  const [previews, setPreviews] = useState<Post[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const firstName = profile?.display_name?.split(' ')[0]

  useEffect(() => {
    if (step !== 3 || causes.length === 0 || !user) return
    let cancelled = false
    setPreviewLoading(true)
    const cats = categoriesFromCauseIds(causes)
    const category = cats[0]
    void (async () => {
      try {
        const { rows } = await fetchFeedRowsPage({
          viewerUserId: user.id,
          offset: 0,
          limit: 6,
          category,
        })
        const enriched = await enrichPosts(rows.slice(0, 3), user.id)
        if (!cancelled) setPreviews(enriched)
      } catch {
        if (!cancelled) setPreviews([])
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [step, causes, user])

  function toggleCause(id: string) {
    setCauses((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  function togglePref(id: string) {
    setPrefs((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  async function finish(skipped = false) {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await saveOnboardingPreferences(user.id, causes, prefs, { skipped })
      await refreshProfile()
      navigate('/feed', { replace: true })
    } catch (err) {
      setError(formatError(err))
    } finally {
      setSaving(false)
    }
  }

  const progress = (step / 3) * 100
  const canContinue =
    step === 1 ? causes.length > 0 : step === 2 ? prefs.length > 0 : true

  const stepTitle = useMemo(() => {
    if (step === 1) return 'What causes do you care about?'
    if (step === 2) return 'How do you want to make a difference?'
    return firstName
      ? `Here's what we found for you, ${firstName}`
      : "Here's what we found for you"
  }, [step, firstName])

  return (
    <main className="onboarding-shell page-enter">
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Step {step} of 3</p>
        <button
          type="button"
          onClick={() => void finish(true)}
          disabled={saving}
          className="text-sm font-semibold text-secondary hover:text-primary"
        >
          Skip
        </button>
      </div>

      <div className="onboarding-progress" aria-hidden>
        <div className="onboarding-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">{stepTitle}</h1>
        <p className="mt-2 text-secondary">
          {step === 1 &&
            "Choose the issues that matter to you. We'll personalize your ForFuture experience."}
          {step === 2 && "Select how you'd like to participate. You can change this anytime."}
          {step === 3 && "Movements matched to your interests — jump in when you're ready."}
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div key={step} className="onboarding-step">
        {step === 1 && (
          <div className="flex flex-wrap gap-2">
            {ONBOARDING_CAUSES.map((c) => {
              const Icon = CAUSE_ICONS[c.id] ?? Heart
              const selected = causes.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCause(c.id)}
                  className={selected ? 'onboarding-pill onboarding-pill-selected' : 'onboarding-pill'}
                  aria-pressed={selected}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {c.label}
                  {selected && <Check className="h-4 w-4" aria-hidden />}
                </button>
              )
            })}
          </div>
        )}

        {step === 2 && (
          <ul className="space-y-3">
            {PARTICIPATION_OPTIONS.map((opt) => {
              const Icon = PREF_ICONS[opt.id] ?? Users
              const selected = prefs.includes(opt.id)
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => togglePref(opt.id)}
                    className={
                      selected ? 'onboarding-card-option onboarding-card-option-selected' : 'onboarding-card-option'
                    }
                    aria-pressed={selected}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-accent-600">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-primary">{opt.label}</span>
                      <span className="mt-0.5 block text-xs text-secondary">{opt.description}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {previewLoading ? (
              <ul className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <li key={i}>
                    <PostCardSkeleton />
                  </li>
                ))}
              </ul>
            ) : previews.length > 0 ? (
              <ul className="space-y-4">
                {previews.map((post) => (
                  <li key={post.id}>
                    <PostCard post={post} detailPath={`/feed/${post.id}`} showFollow={false} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Inbox}
                title="No matching movements yet"
                description="Explore the feed to discover causes starting in your community."
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step > 1 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary" disabled={saving}>
            Back
          </button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue || saving}
            className="btn-primary"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void finish(false)}
            disabled={saving}
            className="btn-primary"
            aria-busy={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              'Enter ForFuture'
            )}
          </button>
        )}
      </div>
    </main>
  )
}
