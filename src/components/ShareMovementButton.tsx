import { useState } from 'react'
import { Check, Link2, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { shareMovement } from '../lib/share'

interface ShareMovementButtonProps {
  url: string
  title: string
  className?: string
  variant?: 'secondary' | 'ghost'
}

export default function ShareMovementButton({
  url,
  title,
  className = '',
  variant = 'secondary',
}: ShareMovementButtonProps) {
  const { t } = useTranslation()
  const [feedback, setFeedback] = useState<'idle' | 'copied' | 'shared'>('idle')

  async function handleShare() {
    const result = await shareMovement({
      url,
      title,
      text: t('share.movementText', { title }),
    })

    if (result === 'copied') {
      setFeedback('copied')
      window.setTimeout(() => setFeedback('idle'), 2500)
      return
    }
    if (result === 'shared') {
      setFeedback('shared')
      window.setTimeout(() => setFeedback('idle'), 2000)
    }
  }

  const btnClass = variant === 'ghost' ? 'btn-ghost' : 'btn-secondary'
  const label =
    feedback === 'copied'
      ? t('share.linkCopied')
      : feedback === 'shared'
        ? t('share.shared')
        : t('share.button')

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className={`${btnClass} min-h-10! ${className}`}
      aria-label={t('share.buttonAria', { title })}
    >
      {feedback === 'copied' ? (
        <Check className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
      ) : feedback === 'shared' ? (
        <Share2 className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <Link2 className="h-4 w-4 shrink-0" aria-hidden />
      )}
      <span>{label}</span>
    </button>
  )
}
