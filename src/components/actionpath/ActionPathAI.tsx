import { useState } from 'react'
import {
  ArrowRight,
  Loader2,
  RefreshCw,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  ACTIONPATH_INPUT_MAX,
  ACTIONPATH_INPUT_MIN,
  generateActionPath,
  type ActionPathSuggestion,
} from '../../lib/actionPathAi'
import { buildMovementConfig } from '../../lib/movements'
import { useAuth } from '../../hooks/useAuth'
import { useJoinMovement } from '../../hooks/useJoinMovement'
import type { MovementType } from '../../types'
import { inputClass } from '../AuthForm'

interface ActionPathAIProps {
  currentMovementType: MovementType
  onApplyDraft: (suggestion: ActionPathSuggestion) => void
  onApplyFields: (suggestion: ActionPathSuggestion) => void
  formDisabled?: boolean
}

export default function ActionPathAI({
  currentMovementType,
  onApplyDraft,
  onApplyFields,
  formDisabled,
}: ActionPathAIProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { openJoinModal } = useJoinMovement()

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<ActionPathSuggestion | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const trimmed = input.trim()
  const canGenerate =
    trimmed.length >= ACTIONPATH_INPUT_MIN && trimmed.length <= ACTIONPATH_INPUT_MAX && !loading

  async function runGenerate() {
    if (!user) {
      openJoinModal('actionpath')
      return
    }
    if (!canGenerate) return

    setLoading(true)
    setError(null)
    setDismissed(false)

    try {
      const result = await generateActionPath(trimmed)
      setSuggestion(result)
    } catch (err) {
      setSuggestion(null)
      setError(err instanceof Error ? err.message : t('actionPath.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  function handleEditMyself() {
    setSuggestion(null)
    setDismissed(true)
    setError(null)
  }

  const showResult = suggestion && !dismissed

  const recommendedConfig = suggestion
    ? buildMovementConfig(suggestion.recommended_movement_type, t)
    : null

  const fieldEntries = suggestion
    ? Object.entries(suggestion.suggested_fields).filter(([, v]) => v.trim())
    : []

  return (
    <section
      aria-labelledby="actionpath-heading"
      className="overflow-hidden rounded-2xl border border-accent-200/80 bg-linear-to-br from-accent-50/90 via-white to-brand-50/40 shadow-sm"
    >
      <div className="border-b border-accent-100/80 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-accent-500 to-brand-600 text-white shadow-md shadow-accent-600/25">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="actionpath-heading" className="text-lg font-extrabold tracking-tight text-slate-900">
              {t('actionPath.title')}
            </h2>
            <p className="mt-0.5 text-sm font-semibold text-accent-700">{t('actionPath.headline')}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('actionPath.helper')}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <div>
          <label htmlFor="actionpath-input" className="sr-only">
            {t('actionPath.inputLabel')}
          </label>
          <textarea
            id="actionpath-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || formDisabled}
            rows={4}
            maxLength={ACTIONPATH_INPUT_MAX}
            placeholder={t('actionPath.placeholder')}
            className={`${inputClass} min-h-[100px] resize-y`}
          />
          <p className="mt-1 text-right text-xs tabular-nums text-slate-400">
            {trimmed.length}/{ACTIONPATH_INPUT_MAX}
            {trimmed.length > 0 && trimmed.length < ACTIONPATH_INPUT_MIN && (
              <span className="ml-2 text-amber-600">
                {t('actionPath.minChars', { count: ACTIONPATH_INPUT_MIN })}
              </span>
            )}
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void runGenerate()}
            disabled={!canGenerate || formDisabled}
            className="btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                {t('actionPath.generating')}
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" aria-hidden />
                {t('actionPath.generate')}
              </>
            )}
          </button>
          {showResult && (
            <button
              type="button"
              onClick={() => void runGenerate()}
              disabled={!canGenerate || loading || formDisabled}
              className="btn-secondary w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              {t('actionPath.regenerate')}
            </button>
          )}
        </div>

        <p className="text-xs leading-relaxed text-slate-500">{t('actionPath.trustNote')}</p>
        <p className="text-xs leading-relaxed text-slate-500">{t('actionPath.languageNote')}</p>
      </div>

      {showResult && suggestion && recommendedConfig && (
        <div className="border-t border-accent-100/80 bg-white/80 px-5 py-5 sm:px-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900">{t('actionPath.resultTitle')}</h3>
            <button
              type="button"
              onClick={handleEditMyself}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={t('actionPath.editMyself')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('actionPath.recommendedType')}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${recommendedConfig.badgeClass}`}
              >
                {recommendedConfig.label}
              </span>
            </div>

            <article className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">
                {t('actionPath.whyFits')}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {suggestion.recommendation_reason}
              </p>
            </article>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 rounded-xl border border-slate-200/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('actionPath.improvedTitle')}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900 [overflow-wrap:anywhere] [word-break:break-word]">
                  {suggestion.improved_title}
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-slate-200/80 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('actionPath.improvedDescription')}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 [overflow-wrap:anywhere] [word-break:break-word]">
                  {suggestion.improved_description}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('actionPath.actionSteps')}
              </p>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-700">
                {suggestion.suggested_action_steps.map((step) => (
                  <li key={step} className="[overflow-wrap:anywhere] pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {fieldEntries.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('actionPath.suggestedFields')}
                </p>
                <ul className="mt-2 space-y-2">
                  {fieldEntries.map(([key, value]) => (
                    <li
                      key={key}
                      className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-800">
                        {t(`actionPath.fieldLabels.${key}`, { defaultValue: key.replace(/_/g, ' ') })}
                      </span>
                      <p className="mt-1 text-slate-600 [overflow-wrap:anywhere]">{value}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {suggestion.recommended_movement_type === 'donation_relief' && (
              <p className="rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-900">
                {t('actionPath.reliefRedirectNote')}
              </p>
            )}

            {suggestion.recommended_movement_type !== currentMovementType && (
              <p className="text-xs text-slate-500">{t('actionPath.typeSwitchNote')}</p>
            )}

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => onApplyDraft(suggestion)}
                disabled={formDisabled}
                className="btn-primary w-full sm:w-auto"
              >
                {t('actionPath.useDraft')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              {fieldEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => onApplyFields(suggestion)}
                  disabled={formDisabled}
                  className="btn-secondary w-full sm:w-auto"
                >
                  {t('actionPath.applyFields')}
                </button>
              )}
              <button type="button" onClick={handleEditMyself} className="btn-ghost w-full sm:w-auto">
                {t('actionPath.editMyself')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
