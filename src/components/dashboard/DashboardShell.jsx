// Dashboard chrome: fixed sidebar (role-filtered nav) + topbar (View Website,
// profile, logout). Clean, crisp modern white/light slate enterprise UI.
import { useState } from 'react'
import {
  LayoutDashboard, ShoppingBag, Package, FolderTree, Car, Users, MessageSquare,
  BarChart3, SlidersHorizontal, ScrollText, UserCog,
  Globe, LogOut, Menu, X, ChevronDown, ShieldCheck, Sparkles,
} from 'lucide-react'
import { useAuth, initials } from '../../context/AuthContext'
import { useNav } from '../../context/NavContext'
import { can, roleLabel, PERMISSION as P } from '../../auth/permissions'
import NotificationBell from './NotificationBell'
import LiveOrderToast from './LiveOrderToast'
import { resolveImageUrl } from '../../utils/imageUrl'

// Nav registry — each item names the permission that reveals it.
const NAV = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, perm: P.VIEW_DASHBOARD },
  { key: 'ai-manager', label: 'AI Store Manager', icon: Sparkles, perm: P.VIEW_DASHBOARD, isAi: true },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, perm: P.VIEW_ANALYTICS },
  { key: 'orders', label: 'Orders', icon: ShoppingBag, perm: P.VIEW_ORDERS },
  { key: 'products', label: 'Products', icon: Package, perm: P.MANAGE_PRODUCTS },
  { key: 'categories', label: 'Categories', icon: FolderTree, perm: P.MANAGE_CATEGORIES },
  { key: 'vehicles', label: 'Vehicles', icon: Car, perm: P.MANAGE_VEHICLES },
  { key: 'users', label: 'Users', icon: Users, perm: P.VIEW_USERS },
  { key: 'messages', label: 'Messages', icon: MessageSquare, perm: P.VIEW_MESSAGES },
  { key: 'audit', label: 'Audit Log', icon: ScrollText, perm: P.VIEW_AUDIT },
  { key: 'store', label: 'Store Settings', icon: SlidersHorizontal, perm: P.MANAGE_SETTINGS },
]

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-500/20">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          <circle cx="7.5" cy="17" r="1.4" fill="currentColor"/>
          <circle cx="16.5" cy="17" r="1.4" fill="currentColor"/>
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block font-black text-sm tracking-tight text-slate-900">AUTOGENUINE</span>
        <span className="block text-[9px] font-bold tracking-widest text-orange-600 -mt-0.5">MANAGEMENT CONSOLE</span>
      </span>
    </div>
  )
}

function NavList({ items, section, onPick }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ key, label, icon: Icon, isAi }) => {
        const active = section === key
        return (
          <button
            key={key}
            onClick={() => onPick(key)}
            className={`flex items-center justify-between h-10 px-3.5 rounded-xl text-xs font-bold transition-all text-left ${
              active
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20 font-black'
                : isAi
                ? 'text-amber-900 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-semibold'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon size={16} className={active ? 'text-white' : isAi ? 'text-amber-600' : 'text-slate-500'} />
              <span>{label}</span>
            </div>
            {isAi && (
              <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider ${
                active ? 'bg-white/20 text-white' : 'bg-amber-200/80 text-amber-900'
              }`}>
                ⚡ AI
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

// One row in the profile dropdown.
function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-left transition-colors">
      <Icon size={15} className="text-orange-600 shrink-0" /> {label}
    </button>
  )
}

export default function DashboardShell({ section, setSection, children }) {
  const { user, logout } = useAuth()
  const { navigate } = useNav()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const items = NAV.filter((i) => can(user, i.perm))
  const current = items.find((i) => i.key === section) || items[0]

  function pick(key, extraParams = {}) {
    setSection(key, extraParams)
    setMobileOpen(false)
  }

  const profile = (
    <div className="flex items-center gap-2.5">
      {user.avatar
        ? <img
            src={resolveImageUrl(user.avatar)}
            referrerPolicy="no-referrer"
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
            onError={(e) => {
              e.target.style.display = 'none'
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
            }}
          />
        : null}
      <span
        style={{ display: user.avatar ? 'none' : 'flex' }}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white items-center justify-center text-xs font-bold shadow-2xs"
      >
        {initials(user.name)}
      </span>
      <span className="hidden sm:block text-left leading-tight">
        <span className="block text-xs font-bold text-slate-900 max-w-[130px] truncate">{user.name}</span>
        <span className="block text-[10px] text-orange-600 font-semibold">{roleLabel(user.role)}</span>
      </span>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-white border-r border-slate-200/90 h-screen sticky top-0 z-20 shadow-2xs">
        <div className="h-16 flex items-center px-5 border-b border-slate-100"><Brand /></div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Management</p>
          <NavList items={items} section={section} onPick={pick} />
        </div>
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <ShieldCheck size={16} className="text-orange-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-medium leading-none">Console Role</p>
              <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{roleLabel(user.role)}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl" style={{ animation: 'slideInRight 0.2s ease-out' }}>
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
              <Brand />
              <button onClick={() => setMobileOpen(false)} className="text-slate-600 hover:text-slate-900"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavList items={items} section={section} onPick={pick} />
            </div>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden text-slate-700 hover:text-slate-900" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase hidden sm:block">Dashboard Console</p>
              <h1 className="text-slate-900 font-black text-base md:text-lg leading-tight truncate">{current?.label || 'Overview'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 md:gap-3">
            {/* Real-time Order Notification Bell */}
            <NotificationBell onNavigateOrder={(orderId) => pick('orders', { orderId })} />

            <button
              onClick={() => navigate('home')}
              className="hidden sm:inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
            >
              <Globe size={14} className="text-orange-600" /> VIEW STOREFRONT
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
              >
                {profile}
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 overflow-hidden" style={{ animation: 'fadeIn 0.15s ease-out' }}>
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                      {user.avatar
                        ? <img
                            src={resolveImageUrl(user.avatar)}
                            referrerPolicy="no-referrer"
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        : null}
                      <span
                        style={{ display: user.avatar ? 'none' : 'flex' }}
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white items-center justify-center text-xs font-bold shrink-0"
                      >
                        {initials(user.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">{user.name}</p>
                        <p className="text-orange-600 text-[11px] font-semibold">{roleLabel(user.role)}</p>
                      </div>
                    </div>
                    <MenuItem icon={UserCog} label="Staff Account" onClick={() => { setProfileOpen(false); pick('account') }} />
                    <MenuItem icon={LayoutDashboard} label="Overview Hub" onClick={() => { setProfileOpen(false); pick('overview') }} />
                    {can(user, P.VIEW_ANALYTICS) && (
                      <MenuItem icon={BarChart3} label="Store Analytics" onClick={() => { setProfileOpen(false); pick('analytics') }} />
                    )}
                    {can(user, P.MANAGE_SETTINGS) && (
                      <MenuItem icon={SlidersHorizontal} label="Store Settings" onClick={() => { setProfileOpen(false); pick('store') }} />
                    )}
                    <MenuItem icon={Globe} label="View Storefront" onClick={() => { setProfileOpen(false); navigate('home') }} />
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button onClick={() => { logout(); navigate('home') }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 text-left transition-colors">
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Automatic Floating WhatsApp-style Live Order Alert Popup */}
        <LiveOrderToast onViewOrder={(id) => pick('orders', { filter: 'all', orderId: id })} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
