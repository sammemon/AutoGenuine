import { useState } from 'react'
import Modal from './Modal'
import { auth as authAPI } from '../services/api'
import { useToast } from '../context/ToastContext'
import { Mail, Lock, ShieldCheck, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react'

export default function ForgotPasswordModal({ open, onClose, onSwitchToLogin }) {
  const { showToast } = useToast()
  const [step, setStep] = useState(1) // 1: Send Request, 2: Enter Code, 3: Set New Password, 4: Success
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleClose() {
    setStep(1)
    setEmail('')
    setCode('')
    setNewPassword('')
    setConfirmPassword('')
    setLoading(false)
    onClose()
  }

  // Step 1: Send reset code & link
  async function handleSendRequest(e) {
    if (e?.preventDefault) e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.forgotPassword(cleanEmail)
      showToast(res.message || 'Reset code sent to your email!')
      setStep(2)
    } catch (err) {
      showToast(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify 6-digit code
  async function handleVerifyCode(e) {
    if (e?.preventDefault) e.preventDefault()
    const cleanCode = code.trim()
    if (!cleanCode || cleanCode.length < 6) {
      showToast('Please enter the 6-digit code sent to your Gmail')
      return
    }

    setLoading(true)
    try {
      await authAPI.verifyResetCode({ email, code: cleanCode })
      showToast('Code verified! Please set your new password.')
      setStep(3)
    } catch (err) {
      showToast(err.message || 'Invalid or expired verification code')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Save new password
  async function handleResetPassword(e) {
    if (e?.preventDefault) e.preventDefault()
    if (!newPassword || newPassword.length < 8) {
      showToast('Password must be at least 8 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.resetPassword({
        email,
        code,
        newPassword,
      })
      showToast(res.message || 'Password reset successfully!')
      setStep(4)
    } catch (err) {
      showToast(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="p-6 sm:p-8 max-w-md w-full mx-auto">
        {/* Step 1: Request Reset Email */}
        {step === 1 && (
          <div className="space-y-5 animate-scale-in">
            <div className="text-center space-y-2">
              <span className="inline-flex w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 items-center justify-center shadow-xs border border-orange-100 mx-auto">
                <KeyRound size={28} />
              </span>
              <h3 className="font-black text-xl text-ink">Forgot your password?</h3>
              <p className="text-muted text-xs sm:text-sm">
                Enter your registered Gmail address below. We'll send you a <strong>6-digit verification code</strong> and a <strong>direct reset link</strong>.
              </p>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-widest text-muted mb-1.5 uppercase">REGISTERED GMAIL ADDRESS</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full border border-line rounded-xl h-11 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black tracking-widest uppercase transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                <span>{loading ? 'SENDING RESET EMAIL...' : 'SEND VERIFICATION CODE & LINK'}</span>
              </button>
            </form>

            <div className="pt-3 border-t border-line text-center">
              <button
                type="button"
                onClick={() => {
                  handleClose()
                  if (onSwitchToLogin) onSwitchToLogin()
                }}
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-brand font-semibold transition-colors"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Enter 6-Digit Code */}
        {step === 2 && (
          <div className="space-y-5 animate-scale-in">
            <div className="text-center space-y-2">
              <span className="inline-flex w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 items-center justify-center shadow-xs border border-amber-100 mx-auto">
                <ShieldCheck size={28} />
              </span>
              <h3 className="font-black text-xl text-ink">Check your email</h3>
              <p className="text-muted text-xs sm:text-sm">
                We sent a 6-digit code to <strong className="text-slate-800">{email}</strong>. Enter it below or click the link in your email.
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-widest text-muted mb-1.5 uppercase text-center">ENTER 6-DIGIT CODE</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-[10px] font-mono text-2xl font-black border border-line rounded-xl h-14 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all bg-amber-50/30"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black tracking-widest uppercase transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                <span>{loading ? 'VERIFYING CODE...' : 'VERIFY CODE'}</span>
              </button>
            </form>

            <div className="flex items-center justify-between pt-2 border-t border-line text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-muted hover:text-ink font-semibold flex items-center gap-1"
              >
                <ArrowLeft size={13} /> Change email
              </button>
              <button
                type="button"
                onClick={handleSendRequest}
                className="text-brand font-bold hover:underline"
              >
                Resend code
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Set New Password */}
        {step === 3 && (
          <div className="space-y-5 animate-scale-in">
            <div className="text-center space-y-2">
              <span className="inline-flex w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 items-center justify-center shadow-xs border border-emerald-100 mx-auto">
                <Lock size={28} />
              </span>
              <h3 className="font-black text-xl text-ink">Set new password</h3>
              <p className="text-muted text-xs sm:text-sm">
                Create a strong password for <strong className="text-slate-800">{email}</strong>.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
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
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black tracking-widest uppercase transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>{loading ? 'SAVING NEW PASSWORD...' : 'SAVE NEW PASSWORD'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="space-y-6 text-center animate-scale-in py-2">
            <span className="inline-flex w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={36} />
            </span>
            <div className="space-y-2">
              <h3 className="font-black text-2xl text-ink">Password updated!</h3>
              <p className="text-muted text-xs sm:text-sm max-w-xs mx-auto">
                Your AutoGenuine password has been reset successfully. You can now log in with your new credentials.
              </p>
            </div>
            <button
              onClick={() => {
                handleClose()
                if (onSwitchToLogin) onSwitchToLogin()
              }}
              className="w-full h-12 rounded-xl bg-ink hover:bg-slate-900 text-white text-xs font-black tracking-widest uppercase shadow-md transition-transform active:scale-[0.99]"
            >
              Sign In Now
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
