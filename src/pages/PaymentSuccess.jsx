import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Package,
  Truck,
  Download,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  MapPin,
  Calendar,
  AlertCircle,
  Loader2,
  Sparkles,
  MessageCircle,
  ExternalLink,
} from 'lucide-react'
import { useNav } from '../context/NavContext'
import { useLocale } from '../context/LocaleContext'
import { useCart } from '../context/CartContext'
import { payments as paymentsAPI } from '../services/api'
import Header from '../components/Header'
import AnnouncementBar from '../components/AnnouncementBar'
import Footer from '../components/Footer'
import { generatePdfInvoice } from '../utils/generatePdfInvoice'

export default function PaymentSuccess() {
  const { navigate, params } = useNav()
  const { formatPrice } = useLocale()
  const { clearCart } = useCart()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  // Extract session_id from query params or window.location
  const sessionId =
    params?.session_id ||
    new URLSearchParams(window.location.hash.split('?')[1] || '').get('session_id') ||
    new URLSearchParams(window.location.search).get('session_id')

  useEffect(() => {
    async function verifySession() {
      if (!sessionId) {
        setError('No payment session reference found in the URL.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const res = await paymentsAPI.getSession(sessionId)
        setData(res)
        clearCart?.()
      } catch (err) {
        setError(err.message || 'Failed to verify payment session with Stripe.')
      } finally {
        setLoading(false)
      }
    }

    verifySession()
  }, [sessionId])

  const order = data?.order
  const orderRef = order ? (order.orderRef || `ORD-${String(order._id).slice(-6).toUpperCase()}`) : ''

  function handleDownloadInvoice() {
    if (!order) return
    generatePdfInvoice(order, sessionId)
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans text-ink">
      <AnnouncementBar />
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12">
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xl max-w-md mx-auto space-y-4">
            <Loader2 size={48} className="text-brand animate-spin mx-auto" />
            <h2 className="text-lg font-black uppercase tracking-wider text-ink">Verifying Stripe Payment…</h2>
            <p className="text-xs text-muted leading-relaxed">
              Confirming your 3D-Secure payment session directly with Stripe. Please do not close this window.
            </p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-red-200 shadow-xl max-w-lg mx-auto space-y-5">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-ink">Payment Verification Issue</h2>
              <p className="text-xs text-muted leading-relaxed">{error}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => navigate('orders')}
                className="h-11 px-6 rounded-xl bg-brand text-white text-xs font-black tracking-wider uppercase hover:bg-brand-600 transition-all shadow-md"
              >
                View My Orders
              </button>
              <button
                onClick={() => navigate('home')}
                className="h-11 px-6 rounded-xl border border-slate-200 text-ink text-xs font-bold uppercase hover:bg-slate-50 transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-scale-in">
            {/* Premium Dark Celebratory Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-2xl text-center space-y-5">
              <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-lg backdrop-blur-md">
                <CheckCircle2 size={44} className="stroke-[2.5]" />
              </div>

              <div className="space-y-2 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                  <ShieldCheck size={14} /> Stripe 3D-Secure Verified • Paid
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Payment Successful!
                </h1>
                <p className="text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
                  Thank you for your order! Your payment has been securely authorized and order{' '}
                  <strong className="text-amber-400 font-mono">#{orderRef}</strong> is confirmed. Our warehouse team is preparing your genuine parts.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3 relative z-10">
                <button
                  onClick={() => navigate('track', { ref: orderRef })}
                  className="h-12 px-7 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black tracking-wider uppercase transition-all shadow-md flex items-center gap-2 active:scale-95"
                >
                  <Truck size={16} /> Track Order Live <ArrowRight size={14} />
                </button>

                <button
                  onClick={handleDownloadInvoice}
                  className="h-12 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 shadow-sm"
                >
                  <Download size={16} /> Download Invoice
                </button>
              </div>
            </div>

            {/* Itemized Order & Delivery Receipt */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
              {/* Order Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-muted block">Order Reference</span>
                  <span className="text-xl sm:text-2xl font-black text-ink font-mono tracking-tight">
                    #{orderRef}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-ink flex items-center gap-1.5">
                    <CreditCard size={14} className="text-brand" /> Stripe Card
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-700 uppercase tracking-wider">
                    PAID
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 uppercase tracking-wider">
                    {order?.status || 'PROCESSING'}
                  </div>
                </div>
              </div>

              {/* Two Column Summary: Customer & Shipping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-2">
                    <MapPin size={14} className="text-brand" /> Delivery Destination
                  </h4>
                  <p className="text-sm font-bold text-ink">{order?.customerName || 'Customer'}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{order?.shippingAddress}</p>
                  <p className="text-xs font-bold text-brand">{order?.city}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-2">
                    <Calendar size={14} className="text-brand" /> Timeline &amp; Contact
                  </h4>
                  <p className="text-xs text-ink font-semibold">
                    Placed: {new Date(order?.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-slate-600">Phone: {order?.customerPhone || 'N/A'}</p>
                  <p className="text-xs text-slate-600">Email: {order?.customerEmail || 'N/A'}</p>
                  {order?.vehicleInfo && <p className="text-xs font-bold text-emerald-700">Vehicle: {order.vehicleInfo}</p>}
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-2">
                  <Package size={15} className="text-brand" /> Ordered OEM Parts ({order?.items?.length || 0})
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {order?.items?.map((item, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-sm font-bold text-ink truncate">{item.name}</p>
                        <p className="text-[11px] text-muted font-mono">Part Code: {item.partSlug}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-ink">{formatPrice(item.price * item.qty)}</p>
                        <p className="text-[11px] text-muted">Qty: {item.qty} × {formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Breakdown */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-ink">{formatPrice(order?.total || 0)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Nationwide Express Dispatch</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="pt-2 border-t border-amber-200/80 flex justify-between text-base font-black text-ink">
                  <span>Total Paid via Stripe</span>
                  <span className="text-brand text-lg">{formatPrice(order?.total || 0)}</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => navigate('support', { orderRef })}
                  className="h-11 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black tracking-wider uppercase transition-all shadow-xs flex items-center gap-2"
                >
                  <Sparkles size={14} /> Questions? Ask AI Support
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('home')}
                    className="h-11 px-5 rounded-xl border border-slate-200 text-ink text-xs font-black tracking-wider uppercase hover:bg-slate-50 transition-all"
                  >
                    Continue Shopping
                  </button>

                  <button
                    onClick={() => navigate('orders')}
                    className="h-11 px-5 rounded-xl bg-ink text-white text-xs font-black tracking-wider uppercase hover:bg-black transition-all shadow-xs"
                  >
                    View All Orders
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
