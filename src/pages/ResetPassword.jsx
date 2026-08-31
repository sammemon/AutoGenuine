import { useState, useEffect } from 'react'
import { useNav } from '../context/NavContext'
import { auth as authAPI } from '../services/api'
import { useToast } from '../context/ToastContext'
import { Lock, ShieldCheck, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function ResetPassword() {
  const { navigate, params } = useNav()
  const { showToast } = useToast()
  const token = params?.token || ''
  const email = params?.email || ''

  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  // Verify token on mount
  useEffect(() => {
    async function checkToken() {
      if (!token || !email) {
        setVerifying(false)
        setVerified(false)
        setErrorMsg('Invalid or missing password reset link parameters.')
        return
      }

      try {
        await authAPI.verifyResetCode({ email, token })
        setVerified(true)
      } catch (err) {
        setVerified(false)
        setErrorMsg(err.message || 'This password reset link has expired or is invalid.')
      } finally {
        setVerifying(false)
      }
    }
    checkToken()
  }, [token, email])

  async function handleSubmit(e) {
    if (e?.preventDefault) e.preventDefault()
    if (!newPassword || newPassword.length < 8) {
      showToast('Password must be at least 8 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      const res = await authAPI.resetPassword({
        email,
        token,
        newPassword,
      })
      showToast(res.message || 'Password updated successfully!')
      setCompleted(true)
    } catch (err) {
      showToast(err.message || 'Failed to update password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="container-content px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-3xl border border-line/80 shadow-lg p-6 sm:p-8 space-y-6 animate-scale-in">
          
          {/* State 1: Verifying link */}
          {verifying && (
            <div className="text-center py-8 space-y-3">
              <Loader2 size={36} className="animate-spin text-brand mx-auto" />
              <h2 className="text-lg font-black text-ink">Verifying reset link...</h2>
              <p className="text-xs text-muted">Checking security token from your email.</p>
            </div>
          )}

          {/* State 2: Invalid / Expired Link */}
          {!verifying && !verified && !completed && (
            <div className="text-center space-y-4 py-4">
              <span className="inline-flex w-14 h-14 rounded-2xl bg-red-50 text-red-600 items-center justify-center border border-red-100 mx-auto">
                <AlertCircle size={30} />
              </span>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-ink">Link Expired or Invalid</h2>
                <p className="text-xs sm:text-sm text-muted max-w-xs mx-auto">
                  {errorMsg}
                </p>
              </div>
              <button
                onClick={() => navigate('login')}
                className="w-full h-11 rounded-xl bg-brand text-white text-xs font-black tracking-wider uppercase shadow-xs hover:bg-orange-600 transition-colors"
              >
                Request New Reset Link
              </button>
            </div>
          )}

          {/* State 3: Verified -> Enter New Password Form */}
          {!verifying && verified && !completed && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <span className="inline-flex w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 items-center justify-center shadow-xs border border-emerald-100 mx-auto">
                  <ShieldCheck size={28} />
                </span>
                <h1 className="font-black text-2xl text-ink">Reset Your Password</h1>
                <p className="text-muted text-xs sm:text-sm">
                  Setting new password for <strong className="text-slate-800">{email}</strong>.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-muted mb-1.5 uppercase">NEW PASSWORD</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full border border-line rounded-xl h-11 pl-10 pr-11 text-xs sm:text-sm font-mono focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all bg-slate-50/50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black tracking-widest text-muted mb-1.5 uppercase">CONFIRM NEW PASSWORD</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full border border-line rounded-xl h-11 pl-10 pr-11 text-xs sm:text-sm font-mono focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black tracking-widest uppercase transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>{submitting ? 'SAVING NEW PASSWORD...' : 'UPDATE PASSWORD NOW'}</span>
                </button>
              </form>

              <div className="pt-3 border-t border-line text-center">
                <button
                  onClick={() => navigate('login')}
                  className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-brand font-semibold transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* State 4: Reset Complete */}
          {completed && (
            <div className="space-y-6 text-center py-4">
              <span className="inline-flex w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center mx-auto shadow-md">
                <CheckCircle2 size={36} />
              </span>
              <div className="space-y-2">
                <h2 className="font-black text-2xl text-ink">Password Changed!</h2>
                <p className="text-muted text-xs sm:text-sm max-w-xs mx-auto">
                  Your password has been reset successfully. You can now log in to your account.
                </p>
              </div>
              <button
                onClick={() => navigate('login')}
                className="w-full h-12 rounded-xl bg-ink hover:bg-slate-900 text-white text-xs font-black tracking-widest uppercase shadow-md transition-transform active:scale-[0.99]"
              >
                Sign In Now
              </button>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}
