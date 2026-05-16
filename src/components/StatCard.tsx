import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  accent?: boolean
}

export default function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white/95 px-4 py-4 ring-1 ring-slate-200/70 shadow-sm">
      <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        <Icon className={`h-3.5 w-3.5 ${accent ? 'text-brand-600' : 'text-accent-500'}`} aria-hidden />
        {label}
      </dt>
      <dd
        className={`mt-1.5 text-2xl font-extrabold tabular-nums tracking-tight sm:text-3xl ${
          accent ? 'text-brand-700' : 'text-slate-900'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
