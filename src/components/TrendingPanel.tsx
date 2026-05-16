import { Link } from 'react-router-dom'
import { Activity, Heart, Map, Sparkles, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const tips = [
  {
    icon: Sparkles,
    title: 'Speak freely',
    text: 'Use your Youth Voice ID when you want privacy on public posts.',
  },
  {
    icon: Users,
    title: 'Organize boldly',
    text: 'Start volunteer drives, civic actions, and community movements.',
  },
  {
    icon: Heart,
    title: 'Build trust',
    text: 'Look for Verified Organization and Trusted Campaign badges.',
  },
]

export default function TrendingPanel() {
  const { t } = useTranslation()

  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="sticky top-6 space-y-4">
        <div className="card-surface overflow-hidden p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">
            Community pulse
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Shape tomorrow</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Speak freely. Organize boldly. Build the future together.
          </p>
          <Link to="/create" className="btn-primary mt-4 w-full text-center">
            Create a Youth Movement
          </Link>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-sm font-semibold text-slate-900">Quick links</h3>
          <ul className="mt-3 space-y-2">
            {tips.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3 rounded-xl bg-slate-50/80 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <Link
          to="/impact"
          className="card-surface flex items-center gap-3 p-4 transition hover:border-accent-200 hover:shadow-md"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
            <Activity className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{t('nav.impactPulse')}</p>
            <p className="text-xs text-slate-500">{t('impactPulse.tagline')}</p>
          </div>
        </Link>

        <Link
          to="/impact-map"
          className="card-surface flex items-center gap-3 p-4 transition hover:border-accent-200 hover:shadow-md"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Map className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{t('nav.impactMap')}</p>
            <p className="text-xs text-slate-500">Volunteer, civic action &amp; issues near you</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
