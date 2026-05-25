import { useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Loader2,
  RefreshCw,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import HelpTooltip from '../guidance/HelpTooltip'
import {
  ACTIONPATH_GENERIC_ERROR,
  ACTIONPATH_INPUT_MAX,
  ACTIONPATH_INPUT_MIN,
  ActionPathAiError,
  generateActionPath,
  validateActionPathInput,
  type ActionPathErrorCode,
  type ActionPathSuggestion,
  type ActionPathValidationReason,
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

function validationMessageKey(reason: ActionPathValidationReason): string {
  switch (reason) {
    case 'empty':
    case 'too_short':
      return 'actionPath.validationTooShort'
    case 'too_long':
      return 'actionPath.validationTooLong'
    case 'gibberish':
    case 'blocklisted':
      return 'actionPath.validationGibberish'
    case 'unclear':
    default:
      return 'actionPath.validationUnclear'
  }
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
  const [errorCode, setErrorCode] = useState<ActionPathErrorCode | null>(null)
  const [suggestion, setSuggestion] = useState<ActionPathSuggestion | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const inFlightRef = useRef(false)
  const lastValidInputRef = useRef<string | null>(null)

  const trimmed = input.trim()
  const validation = useMemo(() => validateActionPathInput(input), [input])
  const inputValid = validation.valid

  const validationHint =
    trimmed.length > 0 && !inputValid
      ? t(validationMessageKey(validation.reason), {
          defaultValue:
            validation.reason === 'too_short'
              ? 'Please describe your concern in more detail.'
              : validation.reason === 'gibberish' || validation.reason === 'blocklisted'
                ? 'This looks too short or unclear. Try writing one sentence about the problem.'
                : 'Please describe a real issue, idea, or community concern.',
          count: ACTIONPATH_INPUT_MIN,
          max: ACTIONPATH_INPUT_MAX,
        })
      : null

  const canGenerate =
    inputValid &&
    !loading &&
    !formDisabled &&
    Boolean(user)

  const canRetry =
    Boolean(lastValidInputRef.current) &&
    !loading &&
    !formDisabled &&
    Boolean(user)

  function resolveErrorMessage(err: unknown): string {
    if (err instanceof ActionPathAiError) {
      switch (err.code) {
        case 'rate_limit':
          return t('actionPath.errorBusy')
        case 'timeout':
          return t('actionPath.errorTimeout', {
            defaultValue: 'This is taking longer than expected. Please try again.',
          })
        case 'network':
        case 'unavailable':
          return t('actionPath.errorUnavailable', {
            defaultValue:
              'ActionPath AI is temporarily unavailable. Please try again shortly.',
          })
        case 'invalid_input':
          return t('actionPath.validationBeforeGenerate', {
            defaultValue:
              'Please describe a real community issue or idea before generating an Action Path.',
          })
        case 'malformed':
        case 'api':
          return t('actionPath.errorGeneric', {
            defaultValue: ACTIONPATH_GENERIC_ERROR,
          })
        case 'auth':
          return t('actionPath.errorAuth', { defaultValue: 'Sign in to use ActionPath AI.' })
        case 'config':
          return t('actionPath.errorConfig', {
            defaultValue:
              'ActionPath AI is not fully set up on the server yet. Please try again later.',
          })
        case 'generic':
        default:
          return t('actionPath.errorGeneric', {
            defaultValue: ACTIONPATH_GENERIC_ERROR,
          })
      }
    }
    return t('actionPath.errorGeneric', { defaultValue: ACTIONPATH_GENERIC_ERROR })
  }

  async function runGenerate(sourceInput?: string) {
    if (!user) {
      openJoinModal('actionpath')
      return
    }

    const text = (sourceInput ?? input).trim()
    const check = validateActionPathInput(text)
    if (!check.valid) {
      setError(
        t(validationMessageKey(check.reason), {
          defaultValue: 'Please describe a real issue, idea, or community concern.',
        }),
      )
      return
    }

    if (inFlightRef.current) return

    inFlightRef.current = true
    setLoading(true)
    setError(null)
    setErrorCode(null)
    setDismissed(false)
    lastValidInputRef.current = check.trimmed

    try {
      const result = await generateActionPath(check.trimmed)
      setSuggestion(result)
    } catch (err) {
      setSuggestion(null)
      setErrorCode(err instanceof ActionPathAiError ? err.code : 'generic')
      setError(resolveErrorMessage(err))
    } finally {
      setLoading(false)
      inFlightRef.current = false
    }
  }

  function handleStartOver() {
    setSuggestion(null)
    setDismissed(true)
    setError(null)
    setInput('')
    lastValidInputRef.current = null
  }

  function handleEditMyself() {
    setSuggestion(null)
    setDismissed(true)
    setError(null)
    setErrorCode(null)
  }

  const showSetupHint =
    errorCode === 'config' || errorCode === 'unavailable' || errorCode === 'network'

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
      className="actionpath-panel overflow-hidden rounded-2xl border border-accent-200/80 bg-linear-to-br from-accent-50/90 via-white to-brand-50/40 shadow-sm dark:border-accent-500/25 dark:from-accent-950/40 dark:via-slate-900/80 dark:to-slate-900/60"
    >
      <div className="border-b border-accent-100/80 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-accent-500 to-brand-600 text-white shadow-md shadow-accent-600/25">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="actionpath-heading" className="text-lg font-extrabold tracking-tight text-primary">
              {t('actionPath.title')}
            </h2>
            <p className="mt-0.5 text-sm font-semibold text-accent-700">{t('actionPath.headline')}</p>
            <p className="mt-2 text-sm leading-relaxed text-secondary">{t('actionPath.helper')}</p>
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
            onChange={(e) => {
              const next = e.target.value
              setInput(next)
              const nextValidation = validateActionPathInput(next)
              if (error && (!nextValidation.valid || next.trim() !== lastValidInputRef.current)) {
                setError(null)
                setErrorCode(null)
              }
            }}
            disabled={loading || formDisabled}
            rows={4}
            maxLength={ACTIONPATH_INPUT_MAX}
            placeholder={t('actionPath.placeholder')}
            className={`${inputClass} min-h-25 resize-y`}
            aria-invalid={Boolean(validationHint)}
            aria-describedby={
              validationHint ? 'actionpath-validation' : 'actionpath-char-count'
            }
          />
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p id="actionpath-char-count" className="tabular-nums text-muted">
              {trimmed.length}/{ACTIONPATH_INPUT_MAX}
              {trimmed.length > 0 && trimmed.length < ACTIONPATH_INPUT_MIN && (
                <span className="ml-2 text-amber-600">
                  {t('actionPath.minChars', { count: ACTIONPATH_INPUT_MIN })}
                </span>
              )}
            </p>
          </div>
          {validationHint && (
            <p
              id="actionpath-validation"
              role="status"
              className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100"
            >
              {validationHint}
            </p>
          )}
        </div>

        {error && inputValid && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-100"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="leading-relaxed">{error}</p>
              {showSetupHint && (
                <p className="text-xs leading-relaxed opacity-90">
                  {t('actionPath.errorSetupHint', {
                    defaultValue:
                      'An admin must add OPENAI_API_KEY in Supabase → Edge Functions → Secrets, deploy actionpath-ai, and run actionpath_ai_rate_limit.sql.',
                  })}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const retryText = lastValidInputRef.current
                if (retryText) void runGenerate(retryText)
              }}
              disabled={!canRetry}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-red-900 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/40 dark:bg-red-950/60 dark:text-red-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              )}
              {t('actionPath.retry')}
            </button>
          </div>
        )}

        {loading && (
          <div
            className="animate-pulse space-y-3 rounded-xl border border-accent-100 bg-surface/60 p-4"
            aria-live="polite"
            aria-busy="true"
          >
            <p className="text-sm text-secondary">{t('actionPath.loadingHint')}</p>
            <div className="h-3 w-2/3 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void runGenerate()}
            disabled={!canGenerate}
            aria-busy={loading}
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
              onClick={() => void runGenerate(lastValidInputRef.current ?? undefined)}
              disabled={!canRetry}
              className="btn-secondary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              {t('actionPath.regenerate')}
            </button>
          )}
        </div>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
          <span className="flex-1">{t('actionPath.trustNote')}</span>
          <HelpTooltip
            label={t('guidance.tooltips.actionPathLabel', { defaultValue: 'About ActionPath AI' })}
            text={t('guidance.tooltips.actionPath', {
              defaultValue:
                'AI suggestions are a starting point. You should review and edit before publishing.',
            })}
          />
        </p>
        <p className="text-xs leading-relaxed text-muted">{t('actionPath.languageNote')}</p>
      </div>

      {showResult && suggestion && recommendedConfig && (
        <div className="border-t border-accent-100/80 bg-surface/80 px-5 py-5 sm:px-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-primary">{t('actionPath.resultTitle')}</h3>
            <button
              type="button"
              onClick={handleEditMyself}
              className="rounded-lg p-2 text-muted transition hover:bg-muted hover:text-secondary"
              aria-label={t('actionPath.editMyself')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t('actionPath.recommendedType')}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${recommendedConfig.badgeClass}`}
              >
                {recommendedConfig.label}
              </span>
            </div>

            <article className="rounded-xl border border-default bg-muted/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">
                {t('actionPath.whyItMatters', { defaultValue: 'Why this matters' })}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                {suggestion.whyItMatters}
              </p>
            </article>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 rounded-xl border border-default p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t('actionPath.suggestedTitle', { defaultValue: 'Suggested title' })}
                </p>
                <p className="mt-2 text-sm font-semibold text-primary wrap-anywhere break-words">
                  {suggestion.suggestedTitle}
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-default p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t('actionPath.refinedSummary', { defaultValue: 'Refined summary' })}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-secondary wrap-anywhere break-words">
                  {suggestion.refinedSummary}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t('actionPath.nextSteps', { defaultValue: 'Recommended next steps' })}
              </p>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-secondary">
                {suggestion.nextSteps.map((step) => (
                  <li key={step} className="wrap-anywhere pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {suggestion.safety_note && (
              <p className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
                <span className="font-semibold">{t('actionPath.safetyNote')}: </span>
                {suggestion.safety_note}
              </p>
            )}

            {fieldEntries.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t('actionPath.suggestedFields')}
                </p>
                <ul className="mt-2 space-y-2">
                  {fieldEntries.map(([key, value]) => (
                    <li
                      key={key}
                      className="rounded-lg border border-default bg-surface px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-primary">
                        {t(`actionPath.fieldLabels.${key}`, { defaultValue: key.replace(/_/g, ' ') })}
                      </span>
                      <p className="mt-1 text-secondary wrap-anywhere">{value}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {suggestion.recommended_movement_type === 'donation_relief' && (
              <p className="rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100">
                {t('actionPath.reliefRedirectNote')}
              </p>
            )}

            {suggestion.recommended_movement_type !== currentMovementType && (
              <p className="text-xs text-muted">{t('actionPath.typeSwitchNote')}</p>
            )}

            <div className="flex flex-col gap-2 border-t border-default pt-4 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => onApplyDraft(suggestion)}
                disabled={formDisabled}
                className="btn-primary w-full sm:w-auto"
              >
                {t('actionPath.useSuggestion', { defaultValue: 'Use this suggestion' })}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <button type="button" onClick={handleEditMyself} className="btn-secondary w-full sm:w-auto">
                {t('actionPath.editBeforePublish', { defaultValue: 'Edit before publishing' })}
              </button>
              {fieldEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => onApplyFields(suggestion)}
                  disabled={formDisabled}
                  className="btn-ghost w-full sm:w-auto"
                >
                  {t('actionPath.applyFields')}
                </button>
              )}
              <button type="button" onClick={handleStartOver} className="btn-ghost w-full sm:w-auto">
                {t('actionPath.startOver')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
