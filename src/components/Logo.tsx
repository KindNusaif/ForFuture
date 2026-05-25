import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface LogoProps {
  to?: string
  className?: string
  showTagline?: boolean
  /** Icon mark only — for tight mobile headers */
  iconOnly?: boolean
  variant?: 'default' | 'lovable'
}

export default function Logo({
  to = '/',
  className = '',
  showTagline = false,
  iconOnly = false,
  variant = 'default',
}: LogoProps) {
  const { t } = useTranslation()
  const isLovable = variant === 'lovable'

  return (
    <Link
      to={to}
      aria-label={iconOnly ? t('landing.brandName', { defaultValue: 'ForFuture home' }) : undefined}
      className={`group flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90 sm:gap-2.5 ${className}`}
    >
      <span
        className={
          isLovable
            ? 'grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo to-mint text-cream shadow-soft sm:h-10 sm:w-10'
            : 'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-accent-600 via-accent-600 to-brand-500 text-white shadow-md shadow-accent-600/25 sm:h-9 sm:w-9'
        }
      >
        <Sparkles className={isLovable ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-4 w-4 sm:h-5 sm:w-5'} aria-hidden />
      </span>
      {!iconOnly && (
      <span className="flex shrink-0 flex-col leading-tight">
        <span
          className={
            isLovable
              ? 'whitespace-nowrap font-display text-base text-foreground sm:text-xl'
              : 'whitespace-nowrap text-base font-bold tracking-tight text-primary sm:text-lg'
          }
        >
          ForFuture
        </span>
        {showTagline && (
          <span
            className={
              isLovable
                ? 'logo-tagline-row logo-lovable-tagline hidden whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground xl:block'
                : 'logo-tagline-row hidden whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.1em] text-muted xl:block'
            }
          >
            {t('landing.logoTagline')}
          </span>
        )}
      </span>
      )}
    </Link>
  )
}
