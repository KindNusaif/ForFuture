import { NavLink } from 'react-router-dom'
import {
  FileText,
  Flag,
  LayoutDashboard,
  Shield,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const NAV = [
  { to: '/admin', end: true, icon: LayoutDashboard, labelKey: 'admin.nav.overview' },
  { to: '/admin/users', end: false, icon: Users, labelKey: 'admin.nav.users' },
  { to: '/admin/content', end: false, icon: FileText, labelKey: 'admin.nav.content' },
  { to: '/admin/reports', end: false, icon: Flag, labelKey: 'admin.nav.reports' },
] as const

interface AdminSidebarProps {
  onNavigate?: () => void
  className?: string
}

export default function AdminSidebar({ onNavigate, className = '' }: AdminSidebarProps) {
  const { t } = useTranslation()

  return (
    <aside className={`admin-sidebar ${className}`} aria-label={t('admin.nav.label', { defaultValue: 'Admin navigation' })}>
      <div className="mb-4 flex items-center gap-2 px-2">
        <Shield className="h-5 w-5 text-accent-600" aria-hidden />
        <span className="text-sm font-semibold text-primary">
          {t('admin.brand', { defaultValue: 'ForFuture Admin' })}
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map(({ to, end, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className="admin-nav-link"
          >
            {({ isActive }) => (
              <>
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span aria-current={isActive ? 'page' : undefined}>
                  {t(labelKey, {
                    defaultValue:
                      labelKey === 'admin.nav.overview'
                        ? 'Overview'
                        : labelKey === 'admin.nav.users'
                          ? 'Users'
                          : labelKey === 'admin.nav.content'
                            ? 'Content'
                            : 'Reports',
                  })}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-subtle pt-3 px-2 text-xs text-muted">
        <NavLink to="/admin/moderation" className="admin-nav-link text-xs" onClick={onNavigate}>
          {t('admin.nav.fullModeration', { defaultValue: 'Full moderation' })}
        </NavLink>
        <NavLink to="/admin/trust-review" className="admin-nav-link text-xs" onClick={onNavigate}>
          {t('admin.nav.trustReview', { defaultValue: 'Trust review' })}
        </NavLink>
      </div>
    </aside>
  )
}
