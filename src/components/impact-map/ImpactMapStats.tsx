import { HandHeart, MapPin, Megaphone } from 'lucide-react'

interface ImpactMapStatsProps {
  volunteer: number
  civic: number
  issues: number
  visibleCount: number
}

export default function ImpactMapStats({
  volunteer,
  civic,
  issues,
  visibleCount,
}: ImpactMapStatsProps) {
  const cards = [
    {
      label: 'Volunteer events',
      value: volunteer,
      icon: HandHeart,
      className: 'bg-brand-50 text-brand-700 ring-brand-200/80',
    },
    {
      label: 'Civic actions',
      value: civic,
      icon: Megaphone,
      className: 'bg-accent-50 text-accent-700 ring-accent-200/80',
    },
    {
      label: 'Community issues',
      value: issues,
      icon: MapPin,
      className: 'bg-rose-50 text-rose-700 ring-rose-200/80',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, className }) => (
        <div key={label} className={`card-surface flex items-center gap-3 p-4 ${className}`}>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${className}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-2xl font-extrabold tabular-nums">{value}</p>
            <p className="text-xs font-medium text-secondary">{label}</p>
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-muted sm:col-span-3">
        Showing <span className="font-semibold text-secondary">{visibleCount}</span> results on
        map and list
      </p>
    </div>
  )
}
