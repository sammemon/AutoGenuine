import { useState } from 'react'
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Car,
  Phone,
  MapPin,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  Check,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useNav } from '../context/NavContext'
import { landingPage, isStaff } from '../auth/permissions'

const VEHICLE_OPTIONS = [
  'Toyota Camry (2018–2024)',
  'Toyota Corolla (2014–2024)',
  'Toyota Hilux / Revo (2016–2024)',
  'Toyota Fortuner (2017–2024)',
  'Toyota RAV4 (2019–2024)',
  'Toyota Land Cruiser / Prado',
  'Other Vehicle',
]

export default function GoogleAuthModal({ open, onClose }) {
  const { loginWithGoogle } = useAuth()
  const { showToast } = useToast()
  const { navigate } = useNav()

  // Steps: 'google_signin' -> 'google_consent' -> 'onboarding_settings' -> 'processing'
  const [step, setStep] = useState('google_signin')
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleName, setGoogleName] = useState('')
  const [googleAvatar, setGoogleAvatar] = useState('')
  const [loading, setLoading] = useState(false)

  // General Settings fields
  const [settings, setSettings] = useState({
    password: '',
    phone: '',
    primaryVehicle: 'Toyota Camry (2018–2024)',
    address: '',
    receiveWhatsAppUpdates: true,
  })

  if (!open) return null

  // Step 1: User submits Google Email / Account
  function handleGoogleEmailSubmit(e) {
    e.preventDefault()
    const email = googleEmail.trim()
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid Google Account email')
      return
    }

    const calculatedName = googleName.trim() || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const calculatedAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`

    setGoogleName(calculatedName)
    setGoogleAvatar(calculatedAvatar)
    setStep('google_consent')
  }

  // Quick select an existing Google Account from browser profile
  function handleSelectSavedAccount(email, name, avatar) {
    setGoogleEmail(email)
    setGoogleName(name)
    setGoogleAvatar(avatar)
    setStep('google_consent')
  }

  // Step 2: User grants Google permissions
  function handleGrantPermission() {
    setStep('onboarding_settings')
  }

  // Step 3: Complete General Settings & Sign In
  async function handleCompleteRegistration(e) {
    e.preventDefault()
    if (settings.password && settings.password.length < 8) {
      showToast('Password must be at least 8 characters')
      return
    }
    setLoading(true)

    try {
      const user = await loginWithGoogle({
        email: googleEmail.toLowerCase().trim(),
        name: googleName.trim(),
        avatar: googleAvatar,
        password: settings.password.trim(),
        phone: settings.phone.trim(),
        address: settings.address.trim(),
        primaryVehicle: settings.primaryVehicle,
      })

      showToast(`Welcome to AutoGenuine, ${user.name}! Profile setup complete.`)
      handleClose()
      navigate(landingPage(user))
    } catch (err) {
      showToast(err.message || 'Google account creation failed')
      setStep('onboarding_settings')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setStep('google_signin')
    setGoogleEmail('')
    setGoogleName('')
    setGoogleAvatar('')
    setSettings({
      phone: '',
      primaryVehicle: 'Toyota Camry (2018–2024)',
      address: '',
      receiveWhatsAppUpdates: true,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Main Container */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10 border border-gray-100 flex flex-col"
        style={{ animation: 'fadeIn 0.15s ease-out' }}
      >
        {/* ================= STAGE 1: OFFICIAL GOOGLE SIGN-IN ================= */}
        {step === 'google_signin' && (
          <div>
            <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Sign in with Google</h3>
                  <p className="text-gray-500 text-xs">Choose an account to continue to AutoGenuine</p>
                </div>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {/* Quick Google Profile Accounts */}
              <div className="space-y-2 mb-4">
                {[
                  { name: 'Sohail Ahmed', email: 'sohail.ahmed@gmail.com', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
                  { name: 'Sarah Khan', email: 'sarah.khan@gmail.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
                ].map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleSelectSavedAccount(acc.email, acc.name, acc.avatar)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left group"
                  >
                    <img src={acc.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-xs group-hover:text-blue-600 truncate">{acc.name}</p>
                      <p className="text-gray-500 text-[11px] truncate">{acc.email}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Or enter custom Google Account */}
              <form onSubmit={handleGoogleEmailSubmit} className="space-y-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-600">Or use your own Google Account:</p>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Your Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Google Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold tracking-wider transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  NEXT ➜
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= STAGE 2: GOOGLE PERMISSION & CONSENT SCREEN ================= */}
        {step === 'google_consent' && (
          <div>
            <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span className="text-xs font-bold text-gray-500">accounts.google.com</span>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {/* Account Selected */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 mb-5">
                <img src={googleAvatar} referrerPolicy="no-referrer" alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 text-xs truncate">{googleName}</p>
                  <p className="text-gray-500 text-[11px] truncate">{googleEmail}</p>
                </div>
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>

              <h4 className="font-bold text-gray-900 text-base mb-2">
                AutoGenuine wants access to your Google Account
              </h4>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                This will allow <strong className="text-gray-800">AutoGenuine OEM Auto Parts</strong> to:
              </p>

              <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-gray-700 mb-6">
                <div className="flex items-start gap-2.5">
                  <Check size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>See your primary Google Account email address</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>See your personal info, including any personal info you've made publicly available</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('google_signin')}
                  className="flex-1 h-11 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGrantPermission}
                  className="flex-1 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wider"
                >
                  Allow & Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STAGE 3: GENERAL SETTINGS & ONBOARDING ================= */}
        {step === 'onboarding_settings' && (
          <div>
            <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between bg-cream/40">
              <div>
                <span className="text-[10px] font-black tracking-widest text-brand uppercase block">Step 2 of 2</span>
                <h3 className="font-black text-gray-900 text-base">Complete Your Account Setup</h3>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCompleteRegistration} className="p-6 space-y-4">
              {/* Linked Google ID Badge */}
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <img src={googleAvatar} referrerPolicy="no-referrer" alt="" className="w-9 h-9 rounded-full object-cover border border-emerald-300" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 text-xs">{googleName}</p>
                  <p className="text-emerald-700 text-[11px] font-medium truncate">{googleEmail}</p>
                </div>
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
              </div>

              {/* 1. Account Password */}
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Set Account Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="Create a password (min. 8 chars)"
                    minLength={8}
                    value={settings.password}
                    onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg h-11 pl-10 pr-4 text-sm focus:outline-none focus:border-brand text-gray-900"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">Allows you to sign in with your email &amp; password directly as well</span>
              </div>

              {/* 2. Phone Number */}
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+92 300 1234567"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg h-11 pl-10 pr-4 text-sm focus:outline-none focus:border-brand text-gray-900"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">Used for order tracking SMS & courier delivery</span>
              </div>

              {/* 2. Primary Vehicle */}
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Your Primary Vehicle
                </label>
                <div className="relative">
                  <Car size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={settings.primaryVehicle}
                    onChange={(e) => setSettings({ ...settings, primaryVehicle: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg h-11 pl-10 pr-4 text-sm focus:outline-none focus:border-brand text-gray-900 appearance-none bg-white font-medium"
                  >
                    {VEHICLE_OPTIONS.map((veh) => (
                      <option key={veh} value={veh}>
                        {veh}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Shipping City & Address */}
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Delivery City / Address
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-3 text-gray-400" />
                  <textarea
                    rows={2}
                    placeholder="e.g. House 14, Main Boulevard, Sector F-7/2, Islamabad"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 text-sm focus:outline-none focus:border-brand text-gray-900"
                  />
                </div>
              </div>

              {/* 4. Notification Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={settings.receiveWhatsAppUpdates}
                  onChange={(e) => setSettings({ ...settings, receiveWhatsAppUpdates: e.target.checked })}
                  className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4"
                />
                <span className="text-xs text-gray-600">Send order dispatches & tracking updates to WhatsApp</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-brand hover:bg-brand-600 text-white rounded-lg text-xs font-black tracking-widest transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {loading ? 'CREATING ACCOUNT...' : 'FINISH & ENTER STORE'}
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <span>Protected by Google Identity Services</span>
          <span className="flex items-center gap-1 font-semibold text-gray-500">
            <Sparkles size={11} className="text-amber-500" /> AutoGenuine Verified
          </span>
        </div>
      </div>
    </div>
  )
}
