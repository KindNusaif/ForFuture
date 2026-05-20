import type { ReactNode } from 'react'

interface Props {
  id?: string
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}

export default function DiscoverSectionShell({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className = '',
}: Props) {
  return (
    <section id={id} className={`py-10 sm:py-12 ${className}`}>
      <header className="mb-6 max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">{title}</h2>
        {subtitle && (
          <p className="mt-2 text-sm leading-relaxed text-secondary sm:text-base">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  )
}
