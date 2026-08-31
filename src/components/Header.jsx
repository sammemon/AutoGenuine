import { useEffect, useRef, useState } from 'react'
import {
  Search,
  User,
  ShoppingCart,
  MessageCircle,
  ChevronDown,
  Menu,
  X,
  Car,
  LogOut,
  Settings,
  Package,
  Globe,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Lock,
  Shield,
  Check,
  Sparkles,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useNav } from '../context/NavContext'
import { useAuth, initials } from '../context/AuthContext'
import { isStaff, roleLabel } from '../auth/permissions'
import { useLocale } from '../context/LocaleContext'
import { categories } from '../data/categoryData'
import AccountModal from './AccountModal'
import CustomerNotificationBell from './CustomerNotificationBell'
import { resolveImageUrl } from '../utils/imageUrl'

export default function Header() {
  const { count, open: openCart } = useCart()
  const { navigate, page } = useNav()
  const { user, isAuthed, logout } = useAuth()
  const { country, setCountry, countries } = useLocale()
  const [accountOpen, setAccountOpen] = useState(false)
  const [accountDropOpen, setAccountDropOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileShopOpen, setMobileShopOpen] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const shopRef = useRef(null)
  const accountRef = useRef(null)
  const currencyRef = useRef(null)

  function handleSearch(e) {
    e.preventDefault()
    const query = searchQuery.trim().toLowerCase()
    if (!query) return

    // Match query to category keywords
    const categoryMap = {
      brakes: ['brake', 'brakes', 'pad', 'rotor', 'caliper'],
      engine: ['engine', 'spark', 'plug', 'belt', 'timing', 'gasket'],
      suspension: ['suspension', 'shock', 'absorber', 'control', 'arm', 'steering'],
      filters: ['filter', 'oil', 'air', 'cabin', 'fuel'],
      electrical: ['electrical', 'battery', 'alternator', 'starter', 'wiring'],
      body: ['body', 'bumper', 'mirror', 'headlight', 'trim', 'exterior']
    }

    // Find matching category
    let matchedCategory = null
    for (const [catId, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(kw => query.includes(kw))) {
        matchedCategory = catId
        break
      }
    }

    // Default to first category if no match
    navigate('category', {
      id: matchedCategory || 'brakes',
      search: searchQuery.trim()
    })
    setSearchQuery('')
  }

  useEffect(() => {
    function onClickOutside(e) {
      if (shopRef.current && !shopRef.current.contains(e.target)) setShopOpen(false)
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountDropOpen(false)
      if (currencyRef.current && !currencyRef.current.contains(e.target)) setCurrencyOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function go(pageName, params) {
    setShopOpen(false)
    setMobileOpen(false)
    navigate(pageName, params)
  }

  function goHomeAnchor(anchor) {
    setMobileOpen(false)
    if (page !== 'home') {
      navigate('home')
      setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }), 60)
    } else {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="bg-white sticky top-0 z-40 border-b border-line">
      {/* Top row: logo, search, account/cart */}
      <div className="container-content grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:px-6 h-[72px] md:h-[76px]">
        <div className="flex items-center gap-3 md:gap-4 justify-self-start min-w-0">
          <button
            className="md:hidden text-ink shrink-0"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={24} />
          </button>

          <button onClick={() => go('home')} className="flex items-center gap-2.5 shrink-0">
            <span className="w-9 h-9 rounded-md bg-brand flex items-center justify-center text-white shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                <circle cx="7.5" cy="17" r="1.4" fill="currentColor"/>
                <circle cx="16.5" cy="17" r="1.4" fill="currentColor"/>
              </svg>
            </span>
            <span className="leading-tight hidden sm:block text-left">
              <span className="block font-black text-lg tracking-tight text-ink whitespace-nowrap">AUTOGENUINE</span>
              <span className="block text-[10px] font-semibold tracking-widest text-muted -mt-0.5 whitespace-nowrap">OEM GENUINE PARTS</span>
            </span>
          </button>
        </div>

        <div className="hidden sm:block w-full md:w-[420px] lg:w-[480px] justify-self-center">
          <form onSubmit={handleSearch} className="flex items-center h-11 border border-line rounded-md overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by part number or keyword"
              className="flex-1 h-full px-4 text-sm outline-none placeholder:text-muted/70 min-w-0"
            />
            <button type="submit" className="h-full px-5 bg-ink text-white text-xs font-bold tracking-wider flex items-center gap-2 hover:bg-ink-soft transition-colors shrink-0">
              <Search size={14} /> <span className="hidden lg:inline">SEARCH</span>
            </button>
          </form>
        </div>

        <div className="flex items-center gap-4 md:gap-6 shrink-0 text-sm font-medium text-ink justify-self-end">
          {/* Currency / country switcher */}
          <div className="relative" ref={currencyRef}>
            <button
              onClick={() => setCurrencyOpen((v) => !v)}
              className="flex items-center gap-1.5 hover:text-brand transition-colors"
              aria-label="Change currency"
            >
              <Globe size={17} />
              <span className="hidden md:inline">{countries[country].currency}</span>
              <ChevronDown size={13} className={`hidden md:block transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
            </button>
            {currencyOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-52 bg-white border border-line rounded-md shadow-xl py-2 z-50"
                style={{ animation: 'fadeIn 0.15s ease-out' }}
              >
                <p className="px-4 py-1.5 text-[10px] font-bold tracking-widest text-muted">CURRENCY / REGION</p>
                {Object.entries(countries).map(([code, data]) => (
                  <button
                    key={code}
                    onClick={() => { setCountry(code); setCurrencyOpen(false) }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium hover:bg-cream transition-colors text-left ${
                      code === country ? 'text-brand' : 'text-ink'
                    }`}
                  >
                    <span>{data.name}</span>
                    <span className="text-muted text-[12px] font-bold">{data.currency}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customer Real-Time Order Notifications & Live Chat (Logged in customers only) */}
          {isAuthed && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => go('messages')}
                className="w-8 h-8 rounded-full hover:bg-cream flex items-center justify-center text-ink hover:text-brand transition-colors relative"
                title="Live Messages & Support"
                aria-label="Messages"
              >
                <MessageCircle size={18} />
              </button>
              <CustomerNotificationBell />
            </div>
          )}

          {isAuthed ? (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountDropOpen((v) => !v)}
                className="flex items-center gap-2 hover:text-brand transition-colors"
              >
                {user.avatar
                  ? <img
                      src={resolveImageUrl(user.avatar)}
                      referrerPolicy="no-referrer"
                      alt=""
                      className="w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] rounded-full object-cover shrink-0 border border-gray-200 aspect-square"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  : null}
                <span
                  style={{ display: user.avatar ? 'none' : 'flex' }}
                  className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full bg-brand text-white items-center justify-center text-[11px] font-bold shrink-0 aspect-square"
                >
                  {initials(user.name)}
                </span>
                <span className="hidden md:inline max-w-[120px] truncate">{user.name}</span>
                <ChevronDown size={14} className={`hidden md:block transition-transform ${accountDropOpen ? 'rotate-180' : ''}`} />
              </button>
              {accountDropOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 bg-white border border-line rounded-2xl shadow-2xl z-50 overflow-hidden"
                  style={{ animation: 'fadeIn 0.15s ease-out' }}
                >
                  {/* Decorative Header Banner */}
                  <div className="h-14 bg-gradient-to-r from-slate-900 via-zinc-800 to-orange-950 px-3.5 flex items-center justify-end relative">
                    <span className="text-[9px] font-black tracking-widest uppercase text-white/80 bg-white/10 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/10">
                      AutoGenuine Member
                    </span>
                  </div>

                  {/* Profile Header Details */}
                  <div className="px-4 pb-3.5 pt-0 border-b border-line/70">
                    <div className="-mt-7 mb-2 flex items-end justify-between">
                      <div className="relative w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] shrink-0">
                        {user.avatar ? (
                          <img
                            src={resolveImageUrl(user.avatar)}
                            referrerPolicy="no-referrer"
                            alt=""
                            className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-full object-cover border-2 border-white shadow-md bg-white ring-1 ring-black/5 aspect-square overflow-hidden"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <span
                          style={{ display: user.avatar ? 'none' : 'flex' }}
                          className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-brand text-white border-2 border-white shadow-md items-center justify-center text-base font-black shrink-0 aspect-square"
                        >
                          {initials(user.name)}
                        </span>

                        {/* Verified Google Badge */}
                        {user?.isGoogleAuth && (
                          <span
                            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white shadow-xs"
                            title="Google Verified Account"
                          >
                            <Check size={9} strokeWidth={3.5} />
                          </span>
                        )}
                      </div>

                      {user?.primaryVehicle && (
                        <span className="text-[9px] font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full flex items-center gap-1 max-w-[130px] truncate shadow-2xs">
                          <Car size={10} /> {user.primaryVehicle.split(' ')[0]} {user.primaryVehicle.split(' ')[1] || ''}
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="font-black text-ink text-[14px] leading-tight truncate">{user.name}</p>
                      <p className="text-muted text-[11px] truncate mt-0.5">{user.email}</p>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={10} className="text-emerald-600" /> Active
                      </span>
                      {user?.isGoogleAuth && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          <ShieldCheck size={10} className="text-blue-600" /> Google Verified
                        </span>
                      )}
                      {isStaff(user) && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase text-brand bg-brand/10 px-2 py-0.5 rounded-full border border-brand/20">
                          {roleLabel(user.role)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="p-1.5 space-y-0.5">
                    {isStaff(user) && (
                      <button
                        onClick={() => { setAccountDropOpen(false); navigate('dashboard') }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-brand hover:bg-cream transition-colors text-left"
                      >
                        <LayoutDashboard size={15} /> Staff Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => { setAccountDropOpen(false); navigate('support') }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 transition-colors text-left border border-amber-200/60"
                    >
                      <Sparkles size={15} className="text-amber-600" /> AI Support Assistant
                    </button>
                    <button
                      onClick={() => { setAccountDropOpen(false); navigate('orders') }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-ink hover:bg-cream transition-colors text-left"
                    >
                      <Package size={15} className="text-brand" /> My Orders &amp; Tracking
                    </button>
                    <button
                      onClick={() => { setAccountDropOpen(false); navigate('messages') }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-ink hover:bg-cream transition-colors text-left"
                    >
                      <MessageCircle size={15} className="text-brand" /> Direct Messages
                    </button>
                    <button
                      onClick={() => { setAccountDropOpen(false); navigate('settings') }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-ink hover:bg-cream transition-colors text-left"
                    >
                      <Settings size={15} className="text-brand" /> Account Settings
                    </button>

                    <div className="border-t border-line/60 pt-1 mt-1">
                      <button
                        onClick={() => { setAccountDropOpen(false); logout(); navigate('home') }}
                        className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 text-left transition-colors"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAccountOpen(true)}
              className="flex items-center gap-1.5 hover:text-brand transition-colors"
            >
              <User size={18} /> <span className="hidden md:inline">Account</span>
            </button>
          )}
          <button
            onClick={openCart}
            className="relative flex items-center gap-1.5 hover:text-brand transition-colors"
          >
            <ShoppingCart size={18} /> <span className="hidden md:inline">Cart</span>
            <span className="absolute -top-2 -right-3 bg-brand text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{count}</span>
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="flex items-center h-10 border border-line rounded-md overflow-hidden">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search parts..."
            className="flex-1 h-full px-3 text-sm outline-none placeholder:text-muted/70"
          />
          <button type="submit" className="h-full px-3 bg-ink text-white flex items-center justify-center shrink-0">
            <Search size={14} />
          </button>
        </form>
      </div>

      {/* Desktop nav row */}
      <div className="border-t border-line hidden md:block">
        <div className="container-content grid grid-cols-[1fr_auto_1fr] items-center px-6 h-11">
          <span aria-hidden="true" />
          <nav className="flex items-center gap-7 text-[13px] font-semibold tracking-wide text-ink justify-self-center">
            <button onClick={() => go('home')} className="hover:text-brand transition-colors">HOME</button>
            <button onClick={() => go('vehicles')} className="hover:text-brand transition-colors">SHOP BY VEHICLE</button>
            <button onClick={() => go('track')} className="hover:text-brand transition-colors">TRACK MY ORDER</button>
            <button onClick={() => goHomeAnchor('returns')} className="hover:text-brand transition-colors">RETURNS POLICY</button>
            <button onClick={() => go('about')} className="hover:text-brand transition-colors">ABOUT</button>

            <div className="relative" ref={shopRef}>
              <button
                onClick={() => setShopOpen((v) => !v)}
                className="flex items-center gap-1 hover:text-brand transition-colors"
              >
                SHOP PARTS <ChevronDown size={14} className={`transition-transform ${shopOpen ? 'rotate-180' : ''}`} />
              </button>
              {shopOpen && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-white border border-line rounded-md shadow-xl py-2 z-50"
                  style={{ animation: 'fadeIn 0.15s ease-out' }}
                >
                  {categories.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => go('category', { id })}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-cream hover:text-brand transition-colors text-left"
                    >
                      <Icon size={15} className="text-brand" /> {label}
                    </button>
                  ))}
                  <div className="border-t border-line mt-1 pt-1">
                    <button
                      onClick={() => go('vehicles')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-brand hover:bg-cream transition-colors text-left"
                    >
                      <Car size={15} /> View All Vehicles
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
          <button
            onClick={() => go('contact')}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-ink hover:text-brand transition-colors justify-self-end"
          >
            <MessageCircle size={15} /> CONTACT
          </button>
        </div>
      </div>

      {/* Mobile slide-in menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] md:hidden">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setMobileOpen(false)} />
          <div
            className="absolute left-0 top-0 bottom-0 w-[82%] max-w-xs bg-white shadow-2xl flex flex-col"
            style={{ animation: 'slideInRight 0.2s ease-out' }}
          >
            <div className="flex items-center justify-between h-16 px-5 border-b border-line shrink-0">
              <span className="font-black text-ink">Menu</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-ink">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <nav className="flex flex-col gap-1 text-[14px] font-semibold text-ink">
                <button onClick={() => go('home')} className="text-left py-3 border-b border-line hover:text-brand transition-colors">HOME</button>
                <button onClick={() => go('vehicles')} className="text-left py-3 border-b border-line hover:text-brand transition-colors">SHOP BY VEHICLE</button>
                <button onClick={() => go('track')} className="text-left py-3 border-b border-line hover:text-brand transition-colors">TRACK MY ORDER</button>
                <button onClick={() => goHomeAnchor('returns')} className="text-left py-3 border-b border-line hover:text-brand transition-colors">RETURNS POLICY</button>
                <button onClick={() => go('about')} className="text-left py-3 border-b border-line hover:text-brand transition-colors">ABOUT</button>

                <button
                  onClick={() => setMobileShopOpen((v) => !v)}
                  className="flex items-center justify-between py-3 border-b border-line hover:text-brand transition-colors"
                >
                  SHOP PARTS
                  <ChevronDown size={16} className={`transition-transform ${mobileShopOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileShopOpen && (
                  <div className="pl-3 py-1 flex flex-col">
                    {categories.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => go('category', { id })}
                        className="flex items-center gap-2.5 py-2.5 text-[13px] font-medium text-muted hover:text-brand transition-colors text-left"
                      >
                        <Icon size={14} className="text-brand" /> {label}
                      </button>
                    ))}
                    <button
                      onClick={() => go('vehicles')}
                      className="flex items-center gap-2.5 py-2.5 text-[13px] font-bold text-brand transition-colors text-left"
                    >
                      <Car size={14} /> View All Vehicles
                    </button>
                  </div>
                )}

                <button
                  onClick={() => go('contact')}
                  className="flex items-center gap-1.5 py-3 border-b border-line hover:text-brand transition-colors text-left"
                >
                  <MessageCircle size={15} /> CONTACT
                </button>
              </nav>

              <div className="mt-6 flex flex-col gap-3">
                {isAuthed ? (
                  <>
                    <div className="px-4 py-3 bg-cream rounded-md">
                      <div className="flex items-center gap-3">
                        {user.avatar
                          ? <img
                              src={resolveImageUrl(user.avatar)}
                              referrerPolicy="no-referrer"
                              alt=""
                              className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          : null}
                        <span
                          style={{ display: user.avatar ? 'none' : 'flex' }}
                          className="w-10 h-10 rounded-full bg-brand text-white items-center justify-center text-[13px] font-bold shrink-0"
                        >
                          {initials(user.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-ink text-[14px] truncate">{user.name}</p>
                          <p className="text-muted text-[12px] truncate mt-0.5">{user.email}</p>
                        </div>
                      </div>
                      {isStaff(user) && (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold tracking-widest uppercase">
                          {roleLabel(user.role)}
                        </span>
                      )}
                    </div>
                    {isStaff(user) && (
                      <button
                        onClick={() => { setMobileOpen(false); navigate('dashboard') }}
                        className="flex items-center justify-center gap-2 h-11 rounded-md bg-brand text-white text-xs font-bold tracking-widest hover:bg-brand-600 transition-colors"
                      >
                        <LayoutDashboard size={15} /> DASHBOARD
                      </button>
                    )}
                    <button
                      onClick={() => { setMobileOpen(false); navigate('orders') }}
                      className="flex items-center justify-center gap-2 h-11 rounded-md border border-line text-ink text-xs font-bold tracking-widest hover:border-brand hover:text-brand transition-colors"
                    >
                      <Package size={15} /> MY ORDERS
                    </button>
                    <button
                      onClick={() => { setMobileOpen(false); navigate('messages') }}
                      className="flex items-center justify-center gap-2 h-11 rounded-md border border-line text-ink text-xs font-bold tracking-widest hover:border-brand hover:text-brand transition-colors"
                    >
                      <MessageCircle size={15} /> MESSAGES
                    </button>
                    <button
                      onClick={() => { setMobileOpen(false); navigate('settings') }}
                      className="flex items-center justify-center gap-2 h-11 rounded-md border border-line text-ink text-xs font-bold tracking-widest hover:border-brand hover:text-brand transition-colors"
                    >
                      <Settings size={15} /> SETTINGS
                    </button>
                    <button
                      onClick={() => { setMobileOpen(false); logout(); navigate('home') }}
                      className="flex items-center justify-center gap-2 h-11 rounded-md bg-red-600 text-white text-xs font-bold tracking-widest hover:bg-red-700 transition-colors"
                    >
                      <LogOut size={15} /> SIGN OUT
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setMobileOpen(false); setAccountOpen(true) }}
                    className="flex items-center justify-center gap-2 h-11 rounded-md border border-line text-ink text-xs font-bold tracking-widest hover:border-brand hover:text-brand transition-colors"
                  >
                    <User size={15} /> ACCOUNT
                  </button>
                )}
                <button
                  onClick={() => { setMobileOpen(false); openCart() }}
                  className="flex items-center justify-center gap-2 h-11 rounded-md bg-ink text-white text-xs font-bold tracking-widest hover:bg-ink-soft transition-colors relative"
                >
                  <ShoppingCart size={15} /> CART {count > 0 ? `(${count})` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />
    </header>
  )
}
