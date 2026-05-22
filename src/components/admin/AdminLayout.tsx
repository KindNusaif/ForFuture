import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'

const TITLES: Record<string, string> = {
  '/admin': 'admin.titles.overview',
  '/admin/users': 'admin.titles.users',
  '/admin/content': 'admin.titles.content',
  '/admin/reports': 'admin.titles.reports',
  '/admin/moderation': 'admin.titles.moderation',
  '/admin/trust-review': 'admin.titles.trustReview',
}

export default function AdminLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const titleKey = TITLES[location.pathname] ?? 'admin.titles.overview'
  const title = t(titleKey, {
    defaultValue:
      titleKey === 'admin.titles.users'
        ? 'Users'
        : titleKey === 'admin.titles.content'
          ? 'Content'
          : titleKey === 'admin.titles.reports'
            ? 'Reports'
            : 'Overview',
  })

  return (
    <div className="admin-shell">
      <AdminSidebar className="admin-sidebar--desktop" />
      {menuOpen ? (
        <>
          <button
            type="button"
            className="admin-mobile-overlay md:hidden"
            aria-label={t('admin.closeMenu', { defaultValue: 'Close menu' })}
            onClick={() => setMenuOpen(false)}
          />
          <AdminSidebar
            className="admin-drawer admin-sidebar md:hidden"
            onNavigate={() => setMenuOpen(false)}
          />
        </>
      ) : null}
      <div className="admin-main">
        <AdminTopbar title={title} onOpenMenu={() => setMenuOpen(true)} />
        <main className="admin-content" id="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
