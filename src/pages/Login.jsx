import { useState, useEffect } from 'react'
import { useNav } from '../context/NavContext'
import { useAuth } from '../context/AuthContext'
import { AtSign, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { landingPage, isStaff } from '../auth/permissions'
import { triggerGoogleOAuth } from '../utils/googleAuth'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ForgotPasswordModal from '../components/ForgotPasswordModal'

export default function Login() {
  const { navigate } = useNav()
  const { login, loginWithGoogle, user, isAuthed, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  // Automatically redirect away from login if already signed in
  useEffect(() => {
    if (!authLoading && isAuthed && user) {
      navigate(landingPage(user))
    }
  }, [authLoading, isAuthed, user, navigate])

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    const timer = setTimeout(() => setGoogleLoading(false), 3500)
    try {
      const googleProfile = await triggerGoogleOAuth()
      const loggedIn = await loginWithGoogle(googleProfile)
      showToast(isStaff(loggedIn) ? 'Signed in with Google — opening your dashboard' : `Welcome, ${loggedIn.name}!`)
      navigate(landingPage(loggedIn))
    } catch (err) {
      if (err.message && !err.message.includes('closed') && !err.message.includes('cancelled')) {
        showToast(err.message || 'Google sign-in failed')
      }
    } finally {
      clearTimeout(timer)
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e) {
    if (e?.preventDefault) e.preventDefault()
    const id = form.identifier.trim().toLowerCase()
    const pwd = form.password.trim()
    if (!id || !pwd) {
      showToast('Please fill all fields')
      return
    }
    const looksEmail = id.includes('@')
    const digitCount = (id.match(/\d/g) || []).length
    if (!looksEmail && digitCount < 10) {
      showToast('Enter your email or phone number')
      return
    }

    setLoading(true)
    try {
      const loggedIn = await login(id, pwd)
      showToast(isStaff(loggedIn) ? `Welcome back, ${loggedIn.name} — opening dashboard` : `Welcome back, ${loggedIn.name}!`)
      navigate(landingPage(loggedIn))
    } catch (err) {
      showToast(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="container-content px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-3xl border border-line/80 shadow-lg p-6 sm:p-8 space-y-6 animate-scale-in">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <button
              onClick={() => navigate('home')}
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand to-amber-500 text-white shadow-md hover:scale-105 transition-transform"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                <circle cx="7.5" cy="17" r="1.4" fill="currentColor"/>
                <circle cx="16.5" cy="17" r="1.4" fill="currentColor"/>
              </svg>
            </button>
            <h1 className="font-black text-2xl sm:text-3xl text-ink tracking-tight">Sign in</h1>
            <p className="text-muted text-xs sm:text-sm">Access your orders, saved vehicles, or staff console.</p>
          </div>

          {/* Continue with Google Button */}
          <div>
            <button
              type="button"
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
              className="w-full h-11 rounded-xl border border-line hover:border-gray-400 bg-white hover:bg-gray-50 transition-all flex items-center justify-center gap-3 text-xs font-bold tracking-wider text-ink shadow-2xs disabled:opacity-50 active:scale-[0.99]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>{googleLoading ? 'CONNECTING TO GOOGLE...' : 'CONTINUE WITH GOOGLE'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-line w-full"></div>
              <span className="bg-white px-3 text-[10px] font-black text-muted uppercase tracking-widest absolute">OR EMAIL / PHONE</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black tracking-widest text-muted mb-1.5 uppercase">EMAIL OR PHONE</label>
              <div className="relative">
                <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={form.identifier}
                  onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                  placeholder="you@example.com or +92 300 0000000"
                  className="w-full border border-line rounded-xl h-11 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-black tracking-widest text-muted uppercase">PASSWORD</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-bold text-brand hover:underline transition-all"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border border-line rounded-xl h-11 pl-10 pr-11 text-xs sm:text-sm font-mono focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all bg-slate-50/50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all text-white text-xs font-black tracking-widest uppercase shadow-sm hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <div className="pt-2 border-t border-line text-center space-y-2">
            <p className="text-muted text-xs">
              Don't have an account?{' '}
              <button onClick={() => navigate('register')} className="text-brand font-bold hover:underline">Create one</button>
            </p>
            <button
              onClick={() => navigate('home')}
              className="inline-flex items-center gap-1.5 text-muted hover:text-brand text-xs font-medium transition-colors pt-1"
            >
              <ArrowLeft size={13} /> Return to Store
            </button>
          </div>
        </div>
      </main>

      <Footer />

      <ForgotPasswordModal
        open={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  )
}

