import React from 'react'
import { ShieldAlert, Lock, ArrowLeft, LogOut, UserCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { roleLabel } from '../auth/permissions'
import { useNav } from '../context/NavContext'
import Header from './Header'
import AnnouncementBar from './AnnouncementBar'
import Footer from './Footer'

export default function AccessDenied() {
  const { user, logout } = useAuth()
  const { navigate } = useNav()

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="container-content px-4 md:px-6 py-12 flex-1 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-red-200/80 p-6 sm:p-8 shadow-md text-center space-y-5 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
            <ShieldAlert size={36} className="animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-900 text-[11px] font-black uppercase tracking-wider border border-red-200">
              <Lock size={12} /> 403 Forbidden Access
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950">
              Staff Authorization Required
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              The <strong>AutoGenuine Management Console</strong> &amp; Admin Dashboard is restricted to verified store staff.
            </p>
          </div>

          {user && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1">
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Current Session:</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-900 truncate">{user.name} ({user.email})</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[10px] font-black uppercase shrink-0">
                  {roleLabel(user.role)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => navigate('home')}
              className="group relative overflow-hidden w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 text-white text-xs font-black tracking-wider uppercase transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-20deg] -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />
              <ArrowLeft size={15} className="transition-transform duration-300 ease-out group-hover:-translate-x-1" />
              <span className="relative z-10 font-bold">Return to Store</span>
            </button>

            <button
              onClick={async () => {
                try {
                  await logout()
                } finally {
                  navigate('login')
                }
              }}
              className="group w-full h-10 rounded-xl border border-slate-200 hover:border-brand bg-white hover:bg-orange-50/50 text-xs font-bold text-slate-700 hover:text-brand transition-all duration-200 shadow-2xs hover:shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <LogOut size={14} className="transition-transform duration-200 group-hover:rotate-[-12deg]" />
              <span>Sign Out &amp; Login as Staff</span>
            </button>

            <button
              onClick={() => navigate('support')}
              className="w-full text-center text-xs font-bold text-amber-700 hover:underline pt-1 flex items-center justify-center gap-1"
            >
              <Sparkles size={13} /> Need help? Ask AutoGenuine AI Support
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
