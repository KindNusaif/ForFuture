import type { ReactNode } from 'react'

interface SectionShellProps {
  id?: string
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}

export default function SectionShell({ id, title, subtitle, children, className = '' }: SectionShellProps) {
  return (
    <section id={id} className={`scroll-mt-24 ${className}`} aria-labelledby={id ? `${id}-heading` : undefined}>
      <header className="mb-6 sm:mb-8">
        <h2
          id={id ? `${id}-heading` : undefined}
          className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-secondary sm:text-base">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  )
}
