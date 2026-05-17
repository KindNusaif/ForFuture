import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <article className="card-surface border-dashed px-6 py-16 text-center sm:py-20">
      <span
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-inner"
        style={{
          background: 'linear-gradient(135deg, var(--ff-glow-accent), var(--ff-glow-brand))',
          color: 'var(--ff-metric-icon-accent-text)',
        }}
        aria-hidden
      >
        <Icon className="h-8 w-8" />
      </span>
      <h3 className="mt-6 text-lg font-extrabold tracking-tight text-primary">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-secondary">{description}</p>
    </article>
  )
}
