import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Flag, Heart, ScrollText, Sparkles, Vote, Wand2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { JoinMovementModalVariant } from '../context/join-movement-context'

interface JoinMovementModalProps {
  open: boolean
  variant?: JoinMovementModalVariant
  onClose: () => void
}

export default function JoinMovementModal({
  open,
  variant = 'default',
  onClose,
}: JoinMovementModalProps) {
  const { t } = useTranslation()
  const isReport = variant === 'report'
  const isPetition = variant === 'petition'
  const isActionPath = variant === 'actionpath'
  const dialogRef = useRef<HTMLDialogElement>(null)

  const benefits = [
    { icon: Heart, text: t('joinModal.benefitSupport') },
    { icon: Vote, text: t('joinModal.benefitPolls') },
    { icon: Sparkles, text: t('joinModal.benefitVoice') },
  ]

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const title = isActionPath
    ? t('actionPath.authTitle')
    : t('joinModal.title')

  const description = isReport
    ? t('joinModal.descReport')
    : isPetition
      ? t('joinModal.descPetition')
      : isActionPath
        ? t('actionPath.authMessage')
        : t('joinModal.descDefault')

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-[min(calc(100%-2rem),28rem)] max-w-md rounded-2xl border-0 bg-transparent p-0 shadow-none"
      aria-labelledby="join-movement-title"
      aria-describedby="join-movement-desc"
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
        <div
          className="absolute inset-0 bg-linear-to-br from-accent-50/90 via-white to-brand-50/50"
          aria-hidden
        />
        <div className="relative p-6 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-white/80 hover:text-slate-700"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>

          <span
            className={`inline-flex rounded-2xl p-3 text-white shadow-lg ${
              isReport
                ? 'bg-slate-800 shadow-slate-900/25'
                : 'bg-accent-600 shadow-accent-600/30'
            }`}
          >
            {isReport ? (
              <Flag className="h-6 w-6" aria-hidden />
            ) : isPetition ? (
              <ScrollText className="h-6 w-6" aria-hidden />
            ) : isActionPath ? (
              <Wand2 className="h-6 w-6" aria-hidden />
            ) : (
              <Sparkles className="h-6 w-6" aria-hidden />
            )}
          </span>

          <h2 id="join-movement-title" className="mt-5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h2>
          <p id="join-movement-desc" className="mt-2 text-sm leading-relaxed text-slate-600">
            {description}
          </p>

          {!isReport && !isPetition && !isActionPath && (
            <ul className="mt-5 space-y-2.5" aria-label={t('joinModal.benefitsAria')}>
              {benefits.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 text-sm text-slate-700 shadow-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <Link to="/signup" onClick={onClose} className="btn-primary w-full">
              {t('joinModal.createAccount')}
            </Link>
            <Link to="/login" onClick={onClose} className="btn-secondary w-full">
              {t('joinModal.logIn')}
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost w-full text-slate-500"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
