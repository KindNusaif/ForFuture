import type { LucideIcon } from 'lucide-react'

interface AdminEmptyStateProps {
  icon: LucideIcon
  title: string
  message: string
}

export default function AdminEmptyState({ icon: Icon, title, message }: AdminEmptyStateProps) {
  return (
    <div className="admin-card flex flex-col items-center gap-3 py-12 text-center">
      <Icon className="h-10 w-10 text-muted" aria-hidden />
      <h2 className="text-base font-semibold text-primary">{title}</h2>
      <p className="max-w-sm text-sm text-muted">{message}</p>
    </div>
  )
}
