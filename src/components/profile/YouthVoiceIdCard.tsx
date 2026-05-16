import { useState } from 'react'
import { Check, Copy, Mic, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface YouthVoiceIdCardProps {
  youthVoiceId: string
}

export default function YouthVoiceIdCard({ youthVoiceId }: YouthVoiceIdCardProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(youthVoiceId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="rounded-2xl border border-accent-200/90 bg-linear-to-br from-accent-50/90 via-white to-brand-50/40 p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-600 text-white shadow-sm">
            <Shield className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-accent-800">
              <Mic className="h-3.5 w-3.5" aria-hidden />
              {t('profile.youthVoiceTitle')}
            </p>
            <p className="font-mono text-lg font-bold tracking-wider text-accent-950 sm:text-xl">
              {youthVoiceId}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent-200/80 bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-accent-800 transition hover:bg-accent-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          aria-label={t('profile.copyVoiceId')}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
              {t('profile.copied')}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden />
              {t('profile.copy')}
            </>
          )}
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
        {t('profile.youthVoiceHint')}
      </p>
    </div>
  )
}

