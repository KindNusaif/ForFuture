import type { LucideIcon } from 'lucide-react'

interface LandingStatCardProps {
  value: string
  label: string
  icon: LucideIcon
}

export default function LandingStatCard({ value, label, icon: Icon }: LandingStatCardProps) {
  return (
    <div className="landing-stat-card">
      <Icon className="h-5 w-5 text-accent-500 dark:text-accent-300" aria-hidden />
      <p className="mt-3 text-2xl font-bold tracking-tight text-primary sm:text-3xl">{value}</p>
      <p className="mt-1 text-sm font-medium text-secondary">{label}</p>
    </div>
  )
}
