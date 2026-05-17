import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../Logo'

interface TrustPageLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function TrustPageLayout({ title, subtitle, children }: TrustPageLayoutProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex justify-center sm:justify-start">
        <Logo to="/" />
      </div>
      <header className="mb-8 border-b border-default pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">{title}</h1>
        {subtitle && (
          <p className="mt-3 text-base leading-relaxed text-secondary">{subtitle}</p>
        )}
      </header>
      <div className="space-y-5 text-sm leading-relaxed text-secondary sm:text-base">
        {children}
      </div>
      <p className="mt-10 text-center text-sm text-muted">
        <Link
          to="/"
          className="font-medium text-accent-600 hover:text-accent-700 dark:text-accent-300"
        >
          ← Back to ForFuture
        </Link>
      </p>
    </article>
  )
}
