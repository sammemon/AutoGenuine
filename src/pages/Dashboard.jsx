// Dashboard entry point + Role-Based Access Control (RBAC).
// Only staff (admin / owner) reach it. Customers/guests are bounced to home/login.
// Dynamic URLs: #/dashboard/overview, #/dashboard/orders, #/dashboard/products, etc.
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNav } from '../context/NavContext'
import { useToast } from '../context/ToastContext'
import { isStaff, can, roleLabel, PERMISSION as P } from '../auth/permissions'
import DashboardShell from '../components/dashboard/DashboardShell'
import OverviewSection from '../components/dashboard/OverviewSection'
import AnalyticsSection from '../components/dashboard/AnalyticsSection'
import OrdersSection from '../components/dashboard/OrdersSection'
import ProductsSection from '../components/dashboard/ProductsSection'
import { CategoriesSection, VehiclesSection } from '../components/dashboard/CatalogSections'
import UsersSection from '../components/dashboard/UsersSection'
import MessagesSection from '../components/dashboard/MessagesSection'
import AuditSection from '../components/dashboard/AuditSection'
import SettingsSection from '../components/dashboard/SettingsSection'
import StaffAccountSection from '../components/dashboard/StaffAccountSection'
import AIStoreManagerSection from '../components/dashboard/AIStoreManagerSection'

import AccessDenied from '../components/AccessDenied'

const SECTION_CONFIG = {
  overview: { comp: OverviewSection, perm: P.VIEW_DASHBOARD, label: 'Overview' },
  'ai-manager': { comp: AIStoreManagerSection, perm: P.VIEW_DASHBOARD, label: 'AI Store Manager' },
  analytics: { comp: AnalyticsSection, perm: P.VIEW_ANALYTICS, label: 'Analytics' },
  orders: { comp: OrdersSection, perm: P.VIEW_ORDERS, label: 'Orders' },
  products: { comp: ProductsSection, perm: P.MANAGE_PRODUCTS, label: 'Products' },
  categories: { comp: CategoriesSection, perm: P.MANAGE_CATEGORIES, label: 'Categories' },
  vehicles: { comp: VehiclesSection, perm: P.MANAGE_VEHICLES, label: 'Vehicles' },
  users: { comp: UsersSection, perm: P.VIEW_USERS, label: 'Users' },
  messages: { comp: MessagesSection, perm: P.VIEW_MESSAGES, label: 'Messages' },
  audit: { comp: AuditSection, perm: P.VIEW_AUDIT, label: 'Audit Log' },
  store: { comp: SettingsSection, perm: P.MANAGE_SETTINGS, label: 'Store Settings' },
  account: { comp: StaffAccountSection, perm: P.VIEW_DASHBOARD, label: 'Staff Account' },
}

export default function Dashboard() {
  const { user, isAuthed, loading } = useAuth()
  const { subpage, params, navigate } = useNav()
  const { showToast } = useToast()

  // Target requested section from URL subpage (e.g. #/dashboard/products) or query param
  const requestedSection = useMemo(() => {
    const raw = (subpage || params.tab || 'overview').toLowerCase()
    return SECTION_CONFIG[raw] ? raw : 'overview'
  }, [subpage, params.tab])

  const [sectionParams, setSectionParams] = useState(params || {})

  // Keep sectionParams updated with query params from URL
  useEffect(() => {
    if (params && Object.keys(params).length > 0) {
      setSectionParams(params)
    }
  }, [params])

  // Authentication & Staff Access Guard
  useEffect(() => {
    if (loading) return
    if (!isAuthed) {
      navigate('login')
    }
  }, [loading, isAuthed, navigate])

  // Role-Based Section Access Guard (RBAC)
  useEffect(() => {
    if (loading || !isAuthed || !isStaff(user)) return

    const config = SECTION_CONFIG[requestedSection]
    if (config && !can(user, config.perm)) {
      showToast(`Access restricted: "${config.label}" requires Store Owner privileges.`)
      navigate('dashboard/overview', {}, { preserveScroll: true })
    }
  }, [requestedSection, user, isAuthed, loading, navigate, showToast])

  function handleNavigate(sec, newParams = {}) {
    const targetKey = SECTION_CONFIG[sec] ? sec : 'overview'
    const config = SECTION_CONFIG[targetKey]

    // Verify permission before navigating
    if (config && !can(user, config.perm)) {
      showToast(`Access restricted: "${config.label}" requires Store Owner privileges.`)
      return
    }

    setSectionParams(newParams)
    navigate(`dashboard/${targetKey}`, newParams, { preserveScroll: true })
  }

  // Loading state
  if (loading || !isAuthed) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-3 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  // If logged in as customer/regular user, show Access Denied
  if (!isStaff(user)) {
    return <AccessDenied />
  }

  // Ensure active section is authorized for this user
  const activeSectionKey =
    SECTION_CONFIG[requestedSection] && can(user, SECTION_CONFIG[requestedSection].perm)
      ? requestedSection
      : 'overview'

  const ActiveComponent = SECTION_CONFIG[activeSectionKey]?.comp || OverviewSection

  return (
    <DashboardShell section={activeSectionKey} setSection={handleNavigate}>
      <ActiveComponent
        setSection={handleNavigate}
        params={sectionParams}
        clearParams={() => setSectionParams({})}
      />
    </DashboardShell>
  )
}
