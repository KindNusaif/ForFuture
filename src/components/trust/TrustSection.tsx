import type { ReactNode } from 'react'

export function TrustSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-primary">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  )
}
