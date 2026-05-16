import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <article className="card-surface border-dashed px-6 py-16 text-center sm:py-20">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-accent-100 to-brand-100 text-accent-600 shadow-inner">
        <Icon className="h-8 w-8" aria-hidden />
      </span>
      <h3 className="mt-6 text-lg font-extrabold tracking-tight text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">{description}</p>
    </article>
  )
}
