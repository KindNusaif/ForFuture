import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  link?: string
  linkLabel?: string
  className?: string
  featured?: boolean
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  link,
  linkLabel,
  className = '',
  featured = false,
}: FeatureCardProps) {
  return (
    <article
      className={`landing-feature-card group ${featured ? 'landing-feature-card-featured' : ''} ${className}`}
    >
      <span className="landing-feature-icon" aria-hidden>
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-5 text-lg font-semibold text-primary sm:text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-secondary sm:text-[0.9375rem]">{description}</p>
      {link && linkLabel && (
        <Link
          to={link}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600 transition hover:text-accent-500 dark:text-accent-300 dark:hover:text-accent-200"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </article>
  )
}
