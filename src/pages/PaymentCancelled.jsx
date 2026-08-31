import {
  XCircle,
  ShoppingCart,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useNav } from '../context/NavContext'
import { useStoreSettings } from '../context/StoreSettingsContext'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function PaymentCancelled() {
  const { navigate } = useNav()
  const { whatsappNumber, whatsappDisplay } = useStoreSettings()

  return (
    <div className="min-h-screen bg-sand flex flex-col font-sans text-ink">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-12 md:py-20 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xl p-8 sm:p-12 text-center space-y-6 w-full animate-fade-in">
          {/* Cancelled Icon */}
          <div className="w-20 h-20 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <XCircle size={44} className="stroke-[2.2]" />
          </div>

          {/* Heading & Explanation */}
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100/60 text-amber-800 text-[11px] font-black uppercase tracking-wider">
              Payment Not Completed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-ink">Stripe Checkout Cancelled</h1>
            <p className="text-muted text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Your Stripe payment session was cancelled. <strong>No funds have been charged to your card.</strong> Your selected parts are still saved in your cart.
            </p>
          </div>

          {/* Reassurance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <ShoppingCart size={14} className="text-brand" /> Cart Preserved
              </div>
              <p className="text-[11px] text-muted leading-tight">
                All selected OEM items remain safely in your cart ready for checkout.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <HelpCircle size={14} className="text-brand" /> Alternative Methods
              </div>
              <p className="text-[11px] text-muted leading-tight">
                You can also choose Cash on Delivery, Bank Transfer, or WhatsApp order.
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('support', { category: 'payment_support' })}
              className="h-12 px-6 rounded-xl bg-brand hover:bg-brand-600 text-white text-xs font-black tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> Need Help? Chat with AI Support
            </button>

            <button
              onClick={() => navigate('category')}
              className="h-12 px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-black tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Return to Shop
            </button>
          </div>

          {/* Secondary Link */}
          <div className="pt-2">
            <button
              onClick={() => navigate('home')}
              className="text-xs font-bold text-muted hover:text-ink transition-colors underline"
            >
              Back to Homepage
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
