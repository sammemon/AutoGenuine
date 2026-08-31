import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Car,
  MapPin,
  Shield,
  ShieldCheck,
  Check,
  CheckCircle2,
  Bell,
  Download,
  Trash2,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  Package,
  Sliders,
  Sparkles,
  Info,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ImageUpload from '../components/ImageUpload'
import LocationSearchInput from '../components/LocationSearchInput'
import DeliveryAddressField from '../components/DeliveryAddressField'
import { useNav } from '../context/NavContext'
import { useAuth, initials } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { auth as authAPI } from '../services/api'
import { resolveImageUrl } from '../utils/imageUrl'

export default function Settings() {
  const { navigate } = useNav()
  const { user, isAuthed, updateProfile, logout } = useAuth()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'garage' | 'address' | 'security' | 'privacy'

  // Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: resolveImageUrl(user?.avatar) || '',
  })

  const [garageForm, setGarageForm] = useState({
    primaryVehicle: user?.primaryVehicle || '',
    vin: user?.vehicles?.[0]?.vin || '',
  })

  const [addressForm, setAddressForm] = useState({
    address: user?.address || '',
    city: user?.city || '',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [privacyPrefs, setPrivacyPrefs] = useState({
    emailUpdates: user?.privacyPreferences?.emailUpdates ?? true,
    whatsappAlerts: user?.privacyPreferences?.whatsappAlerts ?? true,
    personalizedRecommendations: user?.privacyPreferences?.personalizedRecommendations ?? true,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState({
    profile: false,
    garage: false,
    address: false,
    password: false,
    privacy: false,
  })

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: resolveImageUrl(user.avatar) || '',
      })
      setGarageForm({
        primaryVehicle: user.primaryVehicle || '',
        vin: user.vehicles?.[0]?.vin || '',
      })
      setAddressForm({
        address: user.address || '',
        city: user.city || '',
      })
      setPrivacyPrefs({
        emailUpdates: user.privacyPreferences?.emailUpdates ?? true,
        whatsappAlerts: user.privacyPreferences?.whatsappAlerts ?? true,
        personalizedRecommendations: user.privacyPreferences?.personalizedRecommendations ?? true,
      })
    }
  }, [user])

  if (!isAuthed) {
    navigate('login')
    return null
  }

  // Detect if user registered via Google and has not set a manual password yet
  const isGoogleUserWithoutPassword = Boolean(
    user?.isGoogleAuth && (user?.hasCustomPassword === false || user?.hasCustomPassword === undefined)
  )

  // 1. Profile Update
  async function handleProfileUpdate(e) {
    e.preventDefault()
    setLoading((prev) => ({ ...prev, profile: true }))
    try {
      await updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        avatar: profileForm.avatar,
      })
      showToast('✅ Profile information updated successfully')
    } catch (err) {
      showToast(err.message || 'Update failed')
    } finally {
      setLoading((prev) => ({ ...prev, profile: false }))
    }
  }

  // 2. Garage & Vehicle Update
  async function handleGarageUpdate(e) {
    e.preventDefault()
    setLoading((prev) => ({ ...prev, garage: true }))
    try {
      const updatedVehicles = garageForm.primaryVehicle
        ? [{ make: '', model: garageForm.primaryVehicle, vin: garageForm.vin, isPrimary: true }]
        : []
      await updateProfile({
        primaryVehicle: garageForm.primaryVehicle,
        vehicles: updatedVehicles,
      })
      showToast('🚗 Garage vehicle saved! Parts catalog will filter for your vehicle.')
    } catch (err) {
      showToast(err.message || 'Failed to update garage')
    } finally {
      setLoading((prev) => ({ ...prev, garage: false }))
    }
  }

  // 3. Shipping Address Update
  async function handleAddressUpdate(e) {
    e.preventDefault()
    setLoading((prev) => ({ ...prev, address: true }))
    try {
      await updateProfile({
        address: addressForm.address,
        city: addressForm.city,
      })
      showToast('📍 Default delivery address saved for faster checkout')
    } catch (err) {
      showToast(err.message || 'Failed to save address')
    } finally {
      setLoading((prev) => ({ ...prev, address: false }))
    }
  }

  // 4. Password Change / Setup
  async function handlePasswordSubmit(e) {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      showToast('Password must be at least 8 characters')
      return
    }

    setLoading((prev) => ({ ...prev, password: true }))
    try {
      await authAPI.changePassword({
        currentPassword: isGoogleUserWithoutPassword ? '' : passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      showToast('✅ Password updated successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      await updateProfile({}) // Refresh user state
    } catch (err) {
      showToast(err.message || 'Password update failed')
    } finally {
      setLoading((prev) => ({ ...prev, password: false }))
    }
  }

  // 5. Privacy Preferences Update
  async function handlePrivacyUpdate(key, value) {
    const updated = { ...privacyPrefs, [key]: value }
    setPrivacyPrefs(updated)
    try {
      await updateProfile({ privacyPreferences: updated })
      showToast('Preferences updated')
    } catch (err) {
      showToast(err.message || 'Failed to save preferences')
    }
  }

  // 6. Export Account Data
  function handleExportData() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(user, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `autogenuine_account_${user.email || 'export'}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    showToast('📁 Account data export downloaded')
  }

  const NAV_ITEMS = [
    { id: 'profile', label: 'Profile Information', icon: User, desc: 'Name, email, avatar & phone' },
    { id: 'garage', label: 'My Garage & Vehicle', icon: Car, desc: 'Primary car & fitment check' },
    { id: 'address', label: 'Shipping Destination', icon: MapPin, desc: 'Default delivery address & city' },
    { id: 'security', label: 'Change Password & Security', icon: Lock, desc: 'Credentials & Google sign-in' },
    { id: 'privacy', label: 'Privacy & Preferences', icon: Shield, desc: 'WhatsApp alerts & receipts' },
  ]

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans">
      <AnnouncementBar />
      <Header />

      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('home')}
              className="inline-flex items-center gap-1.5 text-ink text-xs font-bold hover:text-brand transition-colors"
            >
              <ArrowLeft size={15} /> Back to Storefront
            </button>
            <span className="text-xs font-black text-muted uppercase tracking-widest">Customer Account Portal</span>
          </div>

          {/* Main 2-Column Vertical Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ================= LEFT SIDEBAR (VERTICAL NAVIGATION) ================= */}
            <div className="lg:col-span-4 space-y-4">
              {/* Executive User Profile Card */}
              <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
                {/* Decorative Brand Gradient Header Banner */}
                <div className="h-16 bg-gradient-to-r from-slate-900 via-zinc-800 to-orange-900 relative px-4 flex items-center justify-end">
                  <span className="text-[10px] font-black tracking-widest uppercase text-white/80 bg-white/10 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/10">
                    AutoGenuine Member
                  </span>
                </div>

                {/* Profile Identity Details */}
                <div className="px-5 pb-5 pt-0 relative">
                  {/* Circular Avatar with Ring & Verified Badge */}
                  <div className="-mt-8 mb-3 flex items-end justify-between">
                    <div className="relative w-16 h-16 min-w-[64px] min-h-[64px] max-w-[64px] max-h-[64px] shrink-0">
                      {profileForm.avatar ? (
                        <img
                          src={resolveImageUrl(profileForm.avatar)}
                          referrerPolicy="no-referrer"
                          alt=""
                          className="w-16 h-16 min-w-[64px] min-h-[64px] max-w-[64px] max-h-[64px] rounded-full object-cover border-4 border-white shadow-md bg-white ring-1 ring-black/5 aspect-square overflow-hidden"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div
                        style={{ display: profileForm.avatar ? 'none' : 'flex' }}
                        className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-full bg-brand text-white border-4 border-white shadow-md items-center justify-center text-xl font-black shrink-0 aspect-square"
                      >
                        {initials(user?.name)}
                      </div>

                      {/* Small Verified Badge attached to bottom-right of avatar */}
                      {user?.isGoogleAuth && (
                        <span
                          className="absolute bottom-0 right-0 w-5 h-5 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white shadow-xs"
                          title="Google Verified Account"
                        >
                          <Check size={11} strokeWidth={3.5} />
                        </span>
                      )}
                    </div>

                    {/* Primary Vehicle Pill Tag */}
                    {user?.primaryVehicle && (
                      <span className="text-[10px] font-bold text-brand bg-brand/10 border border-brand/20 px-2.5 py-1 rounded-full flex items-center gap-1 max-w-[155px] truncate shadow-2xs">
                        <Car size={11} /> {user.primaryVehicle.split(' ')[0]} {user.primaryVehicle.split(' ')[1] || ''}
                      </span>
                    )}
                  </div>

                  {/* Name and Email */}
                  <div className="space-y-0.5">
                    <h2 className="font-black text-ink text-base leading-tight tracking-tight truncate">
                      {user?.name || 'Customer'}
                    </h2>
                    <p className="text-xs text-muted truncate flex items-center gap-1.5 font-medium">
                      <Mail size={13} className="text-muted/70 shrink-0" />
                      {user?.email}
                    </p>
                    {user?.phone && (
                      <p className="text-[11px] text-muted truncate flex items-center gap-1.5 pt-0.5">
                        <Phone size={12} className="text-muted/70 shrink-0" />
                        {user.phone}
                      </p>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="mt-3.5 pt-3 border-t border-line/60 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={11} className="text-emerald-600" /> Active Profile
                    </span>
                    {user?.isGoogleAuth && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        <ShieldCheck size={11} className="text-blue-600" /> Google Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Vertical Menu Items */}
              <div className="bg-white rounded-2xl p-2.5 border border-line shadow-sm space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-brand text-white shadow-xs font-bold'
                          : 'hover:bg-cream text-ink/80 hover:text-ink'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-cream text-ink/70'
                          }`}
                        >
                          <Icon size={17} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-ink'}`}>
                            {item.label}
                          </p>
                          <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-white/80' : 'text-muted'}`}>
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={15} className={isActive ? 'text-white' : 'text-muted/60'} />
                    </button>
                  )
                })}

                <div className="pt-2 border-t border-line/60 space-y-1">
                  <button
                    type="button"
                    onClick={() => navigate('orders')}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-cream text-ink/80 hover:text-ink text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-orange-50 text-brand flex items-center justify-center shrink-0">
                        <Package size={17} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink">My Orders &amp; Tracking</p>
                        <p className="text-[11px] text-muted">View live order status</p>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-muted" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      navigate('home')
                      showToast('Logged out successfully')
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 text-left transition-colors font-bold text-xs"
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-100/60 text-red-600 flex items-center justify-center shrink-0">
                      <LogOut size={16} />
                    </div>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ================= RIGHT MAIN CONTENT PANEL ================= */}
            <div className="lg:col-span-8">
              {/* ================= TAB 1: PROFILE & CONTACT ================= */}
              {activeTab === 'profile' && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-line shadow-sm space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="font-black text-lg text-ink uppercase tracking-tight flex items-center gap-2">
                      <User size={18} className="text-brand" /> Profile Information
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      Update your identity and phone number for parcel delivery coordination.
                    </p>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-5">
                    {/* Profile Photo */}
                    <ImageUpload
                      label="Profile Photo"
                      shape="circle"
                      value={profileForm.avatar}
                      onChange={(url) => setProfileForm({ ...profileForm, avatar: url })}
                      helperText="Upload custom avatar or sync your Google profile picture"
                    />

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-black text-muted tracking-widest uppercase mb-1.5">
                          Full Name
                        </label>
                        <div className="relative">
                          <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input
                            type="text"
                            required
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-line bg-cream/30 text-xs font-semibold text-ink focus:outline-none focus:border-brand"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-muted tracking-widest uppercase mb-1.5">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input
                            type="email"
                            required
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-line bg-cream/30 text-xs font-semibold text-ink focus:outline-none focus:border-brand"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-muted tracking-widest uppercase mb-1.5">
                        Primary Phone (for Courier &amp; WhatsApp Tracking)
                      </label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="e.g. +92 321 3498203 or 03213498203"
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-line bg-cream/30 text-xs font-semibold text-ink focus:outline-none focus:border-brand"
                        />
                      </div>
                      <p className="text-[11px] text-muted mt-1">
                        Used by the dispatch courier to reach you on delivery day.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading.profile}
                        className="h-11 px-7 rounded-xl bg-brand hover:bg-brand-600 text-white text-xs font-black tracking-widest uppercase transition-all shadow-xs disabled:opacity-50 flex items-center gap-2"
                      >
                        <Save size={15} /> {loading.profile ? 'SAVING…' : 'SAVE PROFILE'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ================= TAB 2: MY GARAGE & VEHICLES ================= */}
              {activeTab === 'garage' && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-line shadow-sm space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="font-black text-lg text-ink uppercase tracking-tight flex items-center gap-2">
                      <Car size={18} className="text-brand" /> My Garage &amp; Saved Vehicle
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      Save your primary vehicle so AutoGenuine automatically filters compatible OEM parts for your chassis.
                    </p>
                  </div>

                  <form onSubmit={handleGarageUpdate} className="space-y-4">
                    <div className="p-4 bg-brand/5 rounded-2xl border border-brand/20 flex items-start gap-3">
                      <Sparkles size={20} className="text-brand shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-xs text-ink uppercase">Automated Fitment Guarantee</h4>
                        <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                          All brake pads, filters, engine components, and suspension kits will be verified for 100% genuine fitment with your saved car.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-muted tracking-widest uppercase mb-1.5">
                        Primary Vehicle (Year, Make, Model &amp; Engine)
                      </label>
                      <div className="relative">
                        <Car size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          value={garageForm.primaryVehicle}
                          onChange={(e) => setGarageForm({ ...garageForm, primaryVehicle: e.target.value })}
                          placeholder="e.g. 2022 Toyota Land Cruiser Prado 2.8L Diesel"
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-line bg-cream/30 text-xs font-semibold text-ink focus:outline-none focus:border-brand"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-muted tracking-widest uppercase mb-1.5">
                        Chassis / VIN Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={garageForm.vin}
                        onChange={(e) => setGarageForm({ ...garageForm, vin: e.target.value.toUpperCase() })}
                        placeholder="e.g. JTEBU5JR7K5123456"
                        maxLength={17}
                        className="w-full h-11 px-4 rounded-xl border border-line bg-cream/30 text-xs font-mono font-bold text-ink uppercase focus:outline-none focus:border-brand"
                      />
                      <p className="text-[11px] text-muted mt-1">
                        Located on your vehicle registration book or windscreen base.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={loading.garage}
                        className="h-11 px-7 rounded-xl bg-brand hover:bg-brand-600 text-white text-xs font-black tracking-widest uppercase transition-all shadow-xs disabled:opacity-50 flex items-center gap-2"
                      >
                        <Save size={15} /> {loading.garage ? 'SAVING…' : 'UPDATE GARAGE'}
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate('vehicles')}
                        className="h-11 px-5 rounded-xl border border-line hover:border-brand text-ink text-xs font-bold transition-colors"
                      >
                        Browse Compatible Parts →
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ================= TAB 3: SHIPPING DESTINATION ================= */}
              {activeTab === 'address' && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-line shadow-sm space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="font-black text-lg text-ink uppercase tracking-tight flex items-center gap-2">
                      <MapPin size={18} className="text-brand" /> Default Shipping Address
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      Your default destination for expedited same-day and standard auto-parts deliveries.
                    </p>
                  </div>

                  <form onSubmit={handleAddressUpdate} className="space-y-4">
                    <LocationSearchInput
                      label="City & Region (Searchable Autocomplete)"
                      required
                      value={addressForm.city}
                      onChange={(city) => setAddressForm({ ...addressForm, city })}
                      onSelectLocation={(loc) => {
                        setAddressForm({
                          ...addressForm,
                          city: loc.city,
                          address: addressForm.address ? addressForm.address : loc.fullAddress,
                        })
                      }}
                      placeholder="Type to search city, sector, or district…"
                    />

                    <DeliveryAddressField
                      value={addressForm.address}
                      city={addressForm.city}
                      required
                      onChange={(addr) => setAddressForm({ ...addressForm, address: addr })}
                    />

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading.address}
                        className="h-11 px-7 rounded-xl bg-brand hover:bg-brand-600 text-white text-xs font-black tracking-widest uppercase transition-all shadow-xs disabled:opacity-50 flex items-center gap-2"
                      >
                        <Save size={15} /> {loading.address ? 'SAVING…' : 'SAVE ADDRESS'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ================= TAB 4: SECURITY & PASSWORD ================= */}
              {activeTab === 'security' && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-line shadow-sm space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="font-black text-lg text-ink uppercase tracking-tight flex items-center gap-2">
                      <Lock size={18} className="text-brand" /> Change Password &amp; Credentials
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      Update your account security password and review linked sign-in providers.
                    </p>
                  </div>

                  {/* Linked Google Account Indicator */}
                  {user?.isGoogleAuth && (
                    <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-2xs border border-blue-100">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-blue-950">Linked with Google Sign-In</h4>
                          <p className="text-[11px] text-blue-700">{user.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                        Active &amp; Secure
                      </span>
                    </div>
                  )}

                  {/* Standard Change Password Form */}
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {/* Current Password Field */}
                    {!isGoogleUserWithoutPassword && (
                      <div>
                        <label className="block text-[11px] font-black text-muted tracking-widest uppercase mb-1.5">
                          Current Password
                        </label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="Enter current password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className="w-full h-11 pl-10 pr-10 rounded-xl border border-line bg-cream/30 text-xs font-semibold text-ink focus:outline-none focus:border-brand"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    )}

                    {isGoogleUserWithoutPassword && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                        <KeyRound size={16} className="text-amber-700 shrink-0 mt-0.5" />
                        <span>
                          You registered via Google. Enter your desired password below to set your account password.
                        </span>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-black text-muted tracking-widest uppercase mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            placeholder="Min. 8 characters"
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-line bg-cream/30 text-xs font-semibold text-ink focus:outline-none focus:border-brand"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-muted tracking-widest uppercase mb-1.5">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            placeholder="Re-enter password"
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-line bg-cream/30 text-xs font-semibold text-ink focus:outline-none focus:border-brand"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading.password}
                        className="h-11 px-7 rounded-xl bg-ink hover:bg-ink-soft text-white text-xs font-black tracking-widest uppercase transition-all shadow-xs disabled:opacity-50 flex items-center gap-2"
                      >
                        <Lock size={15} /> {loading.password ? 'UPDATING…' : 'UPDATE PASSWORD'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ================= TAB 5: PRIVACY & PREFERENCES ================= */}
              {activeTab === 'privacy' && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-line shadow-sm space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="font-black text-lg text-ink uppercase tracking-tight flex items-center gap-2">
                      <Shield size={18} className="text-brand" /> Privacy &amp; Notification Center
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      Configure tracking alerts, order invoices, and personalized garage notifications.
                    </p>
                  </div>

                  {/* Notification Toggles */}
                  <div className="space-y-3 divide-y divide-line">
                    <div className="pt-3 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-xs text-ink">WhatsApp Dispatch &amp; Tracking Alerts</h4>
                        <p className="text-[11px] text-muted mt-0.5">
                          Receive live courier handover and arrival notifications directly on WhatsApp.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={privacyPrefs.whatsappAlerts}
                          onChange={(e) => handlePrivacyUpdate('whatsappAlerts', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="pt-3 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-xs text-ink">Email Tax Invoices &amp; Receipts</h4>
                        <p className="text-[11px] text-muted mt-0.5">
                          Receive official PDF invoices and warranty records upon order approval.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={privacyPrefs.emailUpdates}
                          onChange={(e) => handlePrivacyUpdate('emailUpdates', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                      </label>
                    </div>

                    <div className="pt-3 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-xs text-ink">Personalized Vehicle Part Recommendations</h4>
                        <p className="text-[11px] text-muted mt-0.5">
                          Notify me of seasonal OEM maintenance discounts tailored to my garage vehicle.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={privacyPrefs.personalizedRecommendations}
                          onChange={(e) => handlePrivacyUpdate('personalizedRecommendations', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                      </label>
                    </div>
                  </div>

                  {/* Data Export & Policy Links */}
                  <div className="pt-4 border-t border-line flex items-center justify-between flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="h-10 px-4 rounded-xl border border-line hover:border-brand text-ink text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Download size={14} className="text-brand" /> Export Account Data (.JSON)
                    </button>

                    <div className="flex items-center gap-3 text-xs text-muted">
                      <button
                        type="button"
                        onClick={() => navigate('privacy')}
                        className="hover:underline hover:text-ink"
                      >
                        Privacy Policy
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => navigate('terms')}
                        className="hover:underline hover:text-ink"
                      >
                        Terms of Service
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="p-5 rounded-2xl bg-red-50/70 border border-red-200 flex items-center justify-between flex-wrap gap-4 mt-6">
                    <div>
                      <h4 className="font-bold text-xs text-red-950 uppercase">Danger Zone</h4>
                      <p className="text-[11px] text-red-700 mt-0.5">
                        Deactivate account and clear all saved vehicles and addresses.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
                          logout()
                          navigate('home')
                          showToast('Account deactivated')
                        }
                      }}
                      className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
                    >
                      <Trash2 size={13} /> Deactivate Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
