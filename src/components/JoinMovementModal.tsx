import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Bookmark,
  Flag,
  HandHeart,
  Heart,
  PlusCircle,
  ScrollText,
  Sparkles,
  MessageCircle,
  Vote,
  Wand2,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { JoinMovementModalVariant } from '../context/join-movement-context'
import { authStateFromPath } from '../lib/authReturn'

interface JoinMovementModalProps {
  open: boolean
  variant?: JoinMovementModalVariant
  returnPath: string
  onClose: () => void
}

export default function JoinMovementModal({
  open,
  variant = 'default',
  returnPath,
  onClose,
}: JoinMovementModalProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const authState = authStateFromPath(returnPath)

  const benefits = [
    { icon: Heart, text: t('joinModal.benefitSupport') },
    { icon: Vote, text: t('joinModal.benefitPolls') },
    { icon: Sparkles, text: t('joinModal.benefitVoice') },
  ]

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      window.requestAnimationFrame(() => closeButtonRef.current?.focus())
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const title = (() => {
    switch (variant) {
      case 'report':
        return t('joinModal.titleReport', { defaultValue: 'Sign in to report' })
      case 'comment':
        return t('joinModal.titleComment', { defaultValue: 'Join the discussion' })
      case 'petition':
        return t('joinModal.titlePetition', { defaultValue: 'Join to sign this petition' })
      case 'actionpath':
        return t('actionPath.authTitle')
      case 'follow':
        return t('joinModal.titleFollow', { defaultValue: 'Join to follow this movement' })
      case 'volunteer':
        return t('joinModal.titleVolunteer', { defaultValue: 'Join to volunteer' })
      case 'create':
        return t('joinModal.titleCreate', { defaultValue: 'Create an account to launch a movement' })
      case 'support':
        return t('joinModal.titleSupport', { defaultValue: 'Join to take action' })
      case 'following':
        return t('joinModal.titleFollowing', { defaultValue: 'Build your personal civic feed' })
      case 'poll':
        return t('joinModal.titlePoll', { defaultValue: 'Create an account to vote' })
      case 'pollCreate':
        return t('joinModal.titlePollCreate', {
          defaultValue: 'Create an account to start a community poll',
        })
      case 'inspire':
        return t('joinModal.titleInspire', { defaultValue: 'Share your story' })
      case 'save':
        return t('joinModal.titleSave', { defaultValue: 'Save for later' })
      default:
        return t('joinModal.titleJoin', { defaultValue: 'Create an account to take action' })
    }
  })()

  const description = (() => {
    switch (variant) {
      case 'report':
        return t('joinModal.descReport')
      case 'comment':
        return t('joinModal.descComment')
      case 'petition':
        return t('joinModal.descPetition')
      case 'actionpath':
        return t('actionPath.authMessage')
      case 'follow':
        return t('joinModal.descFollow')
      case 'volunteer':
        return t('joinModal.descVolunteer')
      case 'create':
        return t('joinModal.descCreate')
      case 'support':
        return t('joinModal.descSupport')
      case 'following':
        return t('joinModal.descFollowing')
      case 'poll':
        return t('joinModal.descPoll', {
          defaultValue: 'Create an account to vote in community polls.',
        })
      case 'pollCreate':
        return t('joinModal.descPollCreate', {
          defaultValue: 'Create an account to ask focused questions and gather community opinion.',
        })
      case 'inspire':
        return t('joinModal.descInspire', {
          defaultValue: 'Create an account to share your story and inspire others.',
        })
      case 'save':
        return t('joinModal.descSave', {
          defaultValue: 'Create an account to save this for later.',
        })
      default:
        return t('joinModal.descDefault')
    }
  })()

  const showBenefits =
    variant !== 'report' &&
    variant !== 'comment' &&
    variant !== 'petition' &&
    variant !== 'poll' &&
    variant !== 'pollCreate' &&
    variant !== 'inspire' &&
    variant !== 'save' &&
    variant !== 'actionpath' &&
    variant !== 'following'

  const Icon =
    variant === 'report'
      ? Flag
      : variant === 'comment'
        ? MessageCircle
      : variant === 'petition'
        ? ScrollText
        : variant === 'poll' || variant === 'pollCreate'
          ? Vote
          : variant === 'inspire'
            ? Sparkles
            : variant === 'save'
              ? Bookmark
        : variant === 'actionpath'
          ? Wand2
          : variant === 'follow'
            ? Bell
            : variant === 'volunteer'
              ? HandHeart
              : variant === 'create'
                ? PlusCircle
                : Sparkles

  return (
    <dialog
      ref={dialogRef}
      translate="no"
      onClose={onClose}
      onCancel={onClose}
      className="w-[min(calc(100%-2rem),28rem)] max-w-md rounded-2xl border-0 bg-transparent p-0 shadow-none backdrop:bg-[var(--ff-backdrop)]"
      aria-labelledby="join-movement-title"
      aria-describedby="join-movement-desc"
      data-track="guest-auth-modal"
      data-auth-variant={variant}
    >
      <div className="dialog-panel relative">
        <div className="pointer-events-none absolute inset-0 profile-hero-wash opacity-80" aria-hidden />
        <div className="relative p-6 sm:p-8">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-muted transition hover:bg-muted hover:text-primary"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>

          <span
            className={`inline-flex rounded-2xl p-3 text-white shadow-lg ${
              variant === 'report'
                ? 'bg-slate-700 shadow-slate-900/25'
                : 'bg-accent-600 shadow-accent-600/30'
            }`}
          >
            <Icon className="h-6 w-6" aria-hidden />
          </span>

          <h2
            id="join-movement-title"
            className="mt-5 font-display text-xl text-primary sm:text-2xl"
          >
            {title}
          </h2>
          <p id="join-movement-desc" className="mt-2 text-sm leading-relaxed text-secondary">
            {description}
          </p>

          {showBenefits && (
            <ul className="mt-5 space-y-2.5" aria-label={t('joinModal.benefitsAria')}>
              {benefits.map(({ icon: BenefitIcon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 rounded-xl border border-default bg-surface/80 px-3 py-2.5 text-sm text-secondary shadow-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                    <BenefitIcon className="h-4 w-4" aria-hidden />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/signup"
              state={authState}
              onClick={onClose}
              className="btn-primary w-full"
              data-track="guest-signup-cta-clicked"
            >
              {t('joinModal.createAccount')}
            </Link>
            <Link
              to="/login"
              state={authState}
              onClick={onClose}
              className="btn-secondary w-full"
              data-track="guest-login-cta-clicked"
            >
              {t('joinModal.logIn')}
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost w-full text-muted"
              data-track="guest-continue-exploring"
            >
              {t('joinModal.continueExploring', { defaultValue: 'Continue exploring' })}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
