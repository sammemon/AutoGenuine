import { useState, useEffect } from 'react'
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Car,
  Phone,
  MessageCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  XCircle,
  Receipt,
  Lock,
  User,
} from 'lucide-react'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Modal from '../components/Modal'
import { useNav } from '../context/NavContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLocale } from '../context/LocaleContext'
import { useToast } from '../context/ToastContext'
import { useStoreSettings } from '../context/StoreSettingsContext'
import { triggerGoogleOAuth } from '../utils/googleAuth'
import { orders as ordersAPI } from '../services/api'

const STAGES = [
  { key: 'placed', label: 'Order Confirmed', desc: 'Order verified & payment confirmed', icon: CheckCircle2 },
  { key: 'processing', label: 'Processing & Packing', desc: 'OEM parts inspected and packed at hub', icon: Clock },
  { key: 'shipped', label: 'Dispatched / In Transit', desc: 'Handed over to courier for delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', desc: 'Parcel safely delivered to recipient', icon: Package },
]

// Maps all backend status values to a UI stage key
function statusToStage(status) {
  const map = {
    pending: 'processing',
    processing: 'processing',
    packed: 'processing',
    dispatched: 'shipped',
    out_for_delivery: 'shipped',
    shipped: 'shipped',
    delivered: 'delivered',
  }
  return map[status] || 'processing'
}

// Human-readable label for each status on the tracking page
const STATUS_TRACKING_LABELS = {
  pending: 'Pending Store Approval',
  processing: 'Processing & Packing',
  packed: 'Packed — Ready for Dispatch',
  dispatched: 'Dispatched from Warehouse',
  out_for_delivery: 'Out for Delivery',
  shipped: 'Shipped / In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const CANCEL_REASONS = [
  'Ordered wrong part or vehicle model by mistake',
  'Need to change delivery address or contact number',
  'Found alternative OEM part',
  'Order placed by mistake / testing',
  'Other reason',
]

export default function TrackOrder() {
  const { navigate, params } = useNav()
  const { user, isAuthed, loading: authLoading, loginWithGoogle } = useAuth()
  const { addBulkItems } = useCart()
  const { formatPrice } = useLocale()
  const { showToast } = useToast()
  const { whatsappNumber, storeName } = useStoreSettings()

  const [searchRef, setSearchRef] = useState(params?.ref || '')
  const [order, setOrder] = useState(null)

  function handleReorderToCart() {
    if (!order?.items || order.items.length === 0) return
    addBulkItems(order.items)
    showToast(`🛒 ${order.items.length} item(s) restored to your cart! You can adjust quantities and re-place order.`)
  }
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [submittingCancel, setSubmittingCancel] = useState(false)

  // Auto-search if ref is provided in query params (guest or signed in)
  useEffect(() => {
    if (params?.ref) {
      setSearchRef(params.ref)
      fetchTracking(params.ref)
    }
  }, [params?.ref])

  // Real-time live sync: update tracking data when admin updates fulfillment status
  useEffect(() => {
    function handleLiveOrderEvent(e) {
      const { type, order: updatedOrder } = e.detail || {}
      if (type === 'ORDER_STATUS_UPDATED' && updatedOrder) {
        setOrder((prev) => {
          if (!prev) return prev
          const isMatch =
            String(prev._id) === String(updatedOrder._id) ||
            String(prev._id).slice(-6).toUpperCase() === String(updatedOrder._id || updatedOrder.orderRef).slice(-6).toUpperCase() ||
            String(prev.orderRef || '').toUpperCase() === String(updatedOrder.orderRef || '').toUpperCase()

          if (isMatch) {
            showToast(`⚡ Order status updated: ${STATUS_TRACKING_LABELS[updatedOrder.status] || updatedOrder.status}`)
            return { ...prev, ...updatedOrder }
          }
          return prev
        })
      }
    }

    window.addEventListener('autogenuine_order_event', handleLiveOrderEvent)
    return () => window.removeEventListener('autogenuine_order_event', handleLiveOrderEvent)
  }, [showToast])

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    const timer = setTimeout(() => setGoogleLoading(false), 3500)
    try {
      const googleProfile = await triggerGoogleOAuth()
      const loggedIn = await loginWithGoogle(googleProfile)
      showToast(`Welcome back, ${loggedIn.name}!`)
    } catch (err) {
      if (err.message && !err.message.includes('closed') && !err.message.includes('cancelled')) {
        showToast(err.message || 'Google sign-in failed')
      }
    } finally {
      clearTimeout(timer)
      setGoogleLoading(false)
    }
  }

  async function fetchTracking(queryToUse) {
    const q = (queryToUse || searchRef).trim()
    if (!q) {
      setError('Please enter your order number or reference code.')
      return
    }

    setLoading(true)
    setError('')
    setOrder(null)
    setSearched(true)

    try {
      const data = await ordersAPI.track(q)
      setOrder(data)
    } catch (err) {
      setError(
        err.message || `No order found with reference "${q}". Please double check your order number.`
      )
    } finally {
      setLoading(false)
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    fetchTracking(searchRef)
  }

  // Determine active step index (0=Confirmed, 1=Processing, 2=Shipped, 3=Delivered)
  function getActiveStepIndex(status) {
    if (status === 'cancelled') return -1
    if (status === 'delivered') return 3
    if (['shipped', 'out_for_delivery', 'dispatched'].includes(status)) return 2
    if (['processing', 'packed'].includes(status)) return 1
    return 0 // pending / placed
  }

  async function handleConfirmCancel(e) {
    e.preventDefault()
    if (!order) return

    const finalReason =
      cancelReason === 'Other reason' && customReason.trim()
        ? customReason.trim()
        : cancelReason

    setSubmittingCancel(true)
    try {
      const res = await ordersAPI.cancel(order._id, finalReason)
      const updated = res.order || {
        ...order,
        status: 'cancelled',
        cancellationReason: finalReason,
        cancelledAt: new Date(),
      }
      setOrder(updated)
      showToast(`Order #${order.orderRef || 'ORD'} has been cancelled.`)
      setCancelModalOpen(false)
      setCustomReason('')
    } catch (err) {
      showToast(err.message || 'Could not cancel order')
    } finally {
      setSubmittingCancel(false)
    }
  }

  const activeStep = order ? getActiveStepIndex(order.status) : 0
  const isCancelled = order?.status === 'cancelled'
  const canCancel = order && (order.status === 'pending' || order.status === 'processing')

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Guest helper banner */}
          {!isAuthed && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 gap-2 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <Lock size={14} className="text-amber-700 shrink-0" />
                <span className="truncate">Tracking as Guest. <strong>Sign in</strong> to sync all your orders across devices.</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('login')}
                className="font-black text-amber-900 hover:text-brand underline shrink-0 uppercase text-[11px] tracking-wider transition-colors"
              >
                Sign In →
              </button>
            </div>
          )}

          {/* ================= HERO SEARCH CARD ================= */}
          <div className="bg-white rounded-2xl border border-line p-6 sm:p-8 shadow-sm text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
                  <Truck size={28} />
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight uppercase">
                  Track Your Order
                </h1>
                <p className="text-muted text-xs sm:text-sm mt-1.5 max-w-md mx-auto">
                  Enter your Order Number (e.g. <strong className="text-ink">ORD-121179</strong> or <strong className="text-ink">121179</strong>) to view real-time delivery status.
                </p>

                <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-2.5 max-w-lg mx-auto">
                  <div className="relative flex-1">
                    <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      required
                      value={searchRef}
                      onChange={(e) => setSearchRef(e.target.value)}
                      placeholder="e.g. ORD-121179 or 121179"
                      className="w-full h-12 pl-10 pr-4 rounded-xl border border-line bg-cream/40 text-sm font-semibold text-ink placeholder:text-muted/60 focus:outline-none focus:border-brand focus:bg-white transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-12 px-7 rounded-xl bg-brand hover:bg-brand-600 transition-colors text-white text-xs font-black tracking-widest uppercase disabled:opacity-50 shadow-xs shrink-0"
                  >
                    {loading ? 'TRACKING…' : 'TRACK ORDER'}
                  </button>
                </form>

                {/* Quick samples hint */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
                  <span>Looking for past orders?</span>
                  <button
                    type="button"
                    onClick={() => navigate('orders')}
                    className="font-bold text-brand hover:underline"
                  >
                    View My Orders →
                  </button>
                </div>
              </div>

              {/* ================= ERROR STATE ================= */}
              {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-2">
                  <AlertTriangle size={28} className="text-red-600 mx-auto" />
                  <p className="font-bold text-red-900 text-sm">{error}</p>
                  <p className="text-red-700 text-xs">
                    Need assistance? Contact our WhatsApp support at{' '}
                    <a
                      href="https://wa.me/923213498203"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline"
                    >
                      +92 321 3498203
                    </a>
                  </p>
                </div>
              )}

              {/* ================= ORDER TRACKING RESULT ================= */}
              {order && !loading && (
                <div className="space-y-6">
                  {/* STATUS TIMELINE CARD */}
                  <div className="bg-white rounded-2xl border border-line p-6 sm:p-8 shadow-sm">
                    {/* Header with Reference & Status Badge */}
                    <div className="flex items-start justify-between flex-wrap gap-4 pb-6 border-b border-line">
                      <div>
                        <span className="text-[10px] font-black tracking-widest text-muted uppercase block">
                          Order Reference
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-ink mt-0.5">
                          #{order.orderRef || `ORD-${String(order._id).slice(-6).toUpperCase()}`}
                        </h2>
                        <p className="text-xs text-muted mt-1">
                          Placed on{' '}
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-black tracking-widest text-muted uppercase block">
                          Fulfillment Status
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase mt-1 border ${
                            isCancelled
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : order.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : ['shipped', 'out_for_delivery', 'dispatched'].includes(order.status)
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : ['processing', 'packed'].includes(order.status)
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {STATUS_TRACKING_LABELS[order.status] || order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* VISUAL STEP PROGRESS TRACKER */}
                    {!isCancelled ? (
                      <div className="py-8">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
                          {STAGES.map((stage, idx) => {
                            const Icon = stage.icon
                            const isDone = idx < activeStep || (idx === 0 && order.status !== 'pending' && activeStep >= 0)
                            const isCurrent = idx === activeStep

                            return (
                              <div
                                key={stage.key}
                                className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2 relative z-10"
                              >
                                {/* Step Indicator Circle */}
                                <div
                                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold transition-all shadow-xs ${
                                    isDone
                                      ? 'bg-emerald-500 text-white'
                                      : isCurrent
                                      ? order.status === 'pending'
                                        ? 'bg-amber-500 text-white ring-4 ring-amber-500/20 scale-105'
                                        : 'bg-brand text-white ring-4 ring-brand/20 scale-105'
                                      : 'bg-cream text-muted border border-line'
                                  }`}
                                >
                                  {isDone ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                                </div>

                                <div className="min-w-0 flex-1 sm:flex-none">
                                  <p
                                    className={`text-xs font-black uppercase tracking-tight ${
                                      isDone ? 'text-emerald-700' : isCurrent ? (order.status === 'pending' ? 'text-amber-700' : 'text-brand') : 'text-muted'
                                    }`}
                                  >
                                    {stage.key === 'placed' && order.status === 'pending'
                                      ? 'Pending Approval'
                                      : stage.key === 'placed' && order.status !== 'pending'
                                      ? 'Order Confirmed'
                                      : stage.key === 'processing' && order.status === 'packed'
                                      ? 'Packed & Ready'
                                      : stage.key === 'processing' && order.status === 'processing'
                                      ? 'Processing & Packing'
                                      : stage.key === 'processing' && order.status === 'pending'
                                      ? 'Processing & Packing'
                                      : stage.key === 'shipped' && order.status === 'dispatched'
                                      ? 'Dispatched'
                                      : stage.key === 'shipped' && order.status === 'out_for_delivery'
                                      ? 'Out for Delivery'
                                      : stage.label}
                                  </p>
                                  <p className="text-[11px] text-muted leading-tight mt-0.5 sm:max-w-[140px] sm:mx-auto">
                                    {stage.key === 'placed' && order.status === 'pending'
                                      ? 'Order placed & awaiting store approval'
                                      : stage.key === 'placed' && order.status !== 'pending'
                                      ? 'Order verified & approved by store'
                                      : stage.key === 'processing' && order.status === 'pending'
                                      ? 'Starts once order is approved by store'
                                      : stage.key === 'processing' && order.status === 'packed'
                                      ? 'OEM parts inspected & securely packed'
                                      : stage.key === 'processing' && order.status === 'processing'
                                      ? 'Approved! Parts being verified & prepared'
                                      : stage.key === 'shipped' && order.status === 'dispatched'
                                      ? 'Dispatched from warehouse to courier'
                                      : stage.key === 'shipped' && order.status === 'out_for_delivery'
                                      ? 'Courier is out for delivery to your address'
                                      : stage.desc}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 my-4 bg-red-50 rounded-2xl border border-red-200 p-5 space-y-4">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <XCircle size={24} className="text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-red-900 text-sm">Order Cancelled</h4>
                              <p className="text-xs text-red-700 mt-0.5">
                                <strong>Reason:</strong> {order.cancellationReason || 'Cancelled by store'}
                              </p>
                              {order.cancelledAt && (
                                <p className="text-[11px] text-red-500 mt-1">
                                  Cancelled on {new Date(order.cancelledAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>

                          {order.items?.length > 0 && (
                            <button
                              type="button"
                              onClick={handleReorderToCart}
                              className="h-10 px-4 rounded-xl bg-brand hover:bg-brand-600 text-white text-xs font-black tracking-wide transition-all shadow-xs flex items-center gap-2 shrink-0 active:scale-98"
                              title="Restore items to cart to adjust quantities or reorder"
                            >
                              <RotateCcw size={14} /> REORDER / MODIFY IN CART
                            </button>
                          )}
                        </div>

                        {/* Automatic Refund Banner */}
                        {(order.paymentStatus === 'refunded' || order.refundId) && (
                          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between flex-wrap gap-3 text-xs text-emerald-900">
                            <div className="flex items-center gap-2.5">
                              <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                              <div>
                                <p className="font-black text-emerald-950">
                                  100% Payment Refunded ({formatPrice(order.total)})
                                </p>
                                <p className="text-[11px] text-emerald-800 mt-0.5">
                                  Amount has been refunded to your original payment method. Depending on your bank, it may take 2-5 business days to reflect.
                                </p>
                              </div>
                            </div>
                            {order.refundId && (
                              <span className="font-mono text-[11px] font-bold bg-emerald-100/90 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-300">
                                Stripe Refund: {order.refundId}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* DELIVERY & FITMENT SUMMARY */}
                    <div className="border-t border-line pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="flex items-start gap-2.5">
                        <MapPin size={16} className="text-brand shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-ink">Delivery Destination</p>
                          <p className="text-muted mt-0.5">
                            {order.shippingAddress || 'Standard Delivery'}{order.city ? `, ${order.city}` : ''}
                          </p>
                          {order.customerName && (
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Recipient: {order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Car size={16} className="text-brand shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-ink">Vehicle Fitment</p>
                          <p className="text-muted mt-0.5">
                            {order.vehicleInfo || 'Genuine OEM Guaranteed Fit'}
                          </p>
                          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                            ✓ 100% Genuine &amp; Inspected
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ITEMS & PAYMENT BREAKDOWN CARD */}
                  <div className="bg-white rounded-2xl border border-line p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-line">
                      <h3 className="font-black text-ink text-base uppercase tracking-tight flex items-center gap-2">
                        <Receipt size={18} className="text-brand" /> Items in this Order ({order.items?.length || 0})
                      </h3>
                      <span className="text-xs font-bold text-muted uppercase">
                        Payment: <strong className="text-ink">{order.paymentMethod || 'Card'}</strong>
                      </span>
                    </div>

                    <div className="py-4 space-y-3 divide-y divide-line/40">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-ink truncate">{item.name}</p>
                              <p className="text-muted text-xs">Quantity: {item.qty} unit(s)</p>
                            </div>
                          </div>
                          <span className="font-black text-ink shrink-0 ml-4">
                            {formatPrice(item.price * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="border-t border-line pt-4 flex items-center justify-between">
                      <span className="text-xs font-black tracking-widest text-muted uppercase">
                        Total Amount
                      </span>
                      <span className="text-2xl font-black text-brand">
                        {formatPrice(order.total)}
                      </span>
                    </div>

                    {/* ACTIONS & CONTACT SUPPORT */}
                    <div className="border-t border-line mt-6 pt-6 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => setCancelModalOpen(true)}
                            className="h-10 px-4 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <XCircle size={14} /> Cancel Order
                          </button>
                        )}

                        {isCancelled && order.items?.length > 0 && (
                          <button
                            type="button"
                            onClick={handleReorderToCart}
                            className="h-10 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black tracking-wide transition-all shadow-md shadow-orange-500/20 flex items-center gap-2"
                          >
                            <RotateCcw size={14} /> REORDER / MODIFY IN CART
                          </button>
                        )}

                        <a
                          href={`https://wa.me/${whatsappNumber}?text=Hi%20${encodeURIComponent(storeName)}%2C%20I'm%20tracking%20my%20order%20%23${order.orderRef || order._id}.%20Can%20you%20please%20give%20me%20an%20update%3F`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 px-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <MessageCircle size={15} className="text-emerald-600" /> WhatsApp Live Support
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate('vehicles')}
                        className="h-10 px-5 rounded-xl bg-brand text-white text-xs font-bold tracking-widest hover:bg-brand-600 transition-colors"
                      >
                        CONTINUE SHOPPING →
                      </button>
                    </div>
                  </div>
                </div>
              )}
        </div>
      </main>

      {/* ================= CANCEL ORDER CONFIRMATION MODAL ================= */}
      {cancelModalOpen && order && (
        <Modal
          open={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          maxWidth="max-w-md"
        >
          <div className="p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertTriangle size={24} />
            </div>

            <h3 className="font-black text-xl text-ink text-center">Cancel This Order?</h3>
            <p className="text-muted text-xs text-center mt-1">
              Order <strong className="text-ink">#{order.orderRef}</strong> ({formatPrice(order.total)}) will be stopped before dispatch.
            </p>

            <form onSubmit={handleConfirmCancel} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-muted uppercase mb-1.5">
                  Reason for Cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border border-line rounded-lg h-11 px-3 text-xs font-medium text-ink bg-white focus:outline-none focus:border-brand"
                >
                  {CANCEL_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {cancelReason === 'Other reason' && (
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-muted uppercase mb-1.5">
                    Please Specify
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Tell us why you are cancelling..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full border border-line rounded-lg p-2.5 text-xs text-ink focus:outline-none focus:border-brand"
                  />
                </div>
              )}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                ⚠️ Once cancelled, items will be restocked and this action cannot be reversed.
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="flex-1 h-11 rounded-lg border border-line text-xs font-bold text-muted hover:text-ink transition-colors"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="flex-1 h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-black tracking-wider transition-colors disabled:opacity-50"
                >
                  {submittingCancel ? 'CANCELLING...' : 'CONFIRM CANCEL'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      <Footer />
    </div>
  )
}
