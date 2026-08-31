import { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  MapPin,
  Car,
  Phone,
  MessageCircle,
  RotateCcw,
  Search,
  Lock,
  ChevronRight,
  X,
  Sparkles,
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
import { orders as ordersAPI } from '../services/api'

const statusConfig = {
  pending: { label: 'Pending Store Approval', icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  processing: { label: 'Processing & Packing', icon: Clock, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  packed: { label: 'Packed — Ready for Dispatch', icon: Package, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  dispatched: { label: 'Dispatched from Warehouse', icon: Truck, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  out_for_delivery: { label: 'Out for Delivery', icon: Truck, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  shipped: { label: 'Dispatched / In Transit', icon: Truck, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

const CANCEL_REASONS = [
  'Ordered wrong part or vehicle model by mistake',
  'Need to change delivery address or contact number',
  'Found alternative OEM part',
  'Order placed by mistake / testing',
  'Other reason',
]

export default function MyOrders() {
  const { navigate } = useNav()
  const { user, isAuthed, loading: authLoading } = useAuth()
  const { addBulkItems } = useCart()
  const { formatPrice } = useLocale()
  const { showToast } = useToast()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  function handleReorder(order) {
    if (!order?.items || order.items.length === 0) return
    addBulkItems(order.items)
    showToast(`🛒 ${order.items.length} item(s) restored to your cart! You can adjust quantities and re-place order.`)
  }

  // Cancel modal state
  const [cancellingOrder, setCancellingOrder] = useState(null)
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [submittingCancel, setSubmittingCancel] = useState(false)

  useEffect(() => {
    if (isAuthed && !authLoading) {
      ordersAPI
        .list()
        .then(setOrders)
        .catch(() => setOrders([]))
        .finally(() => setLoading(false))
    }
  }, [isAuthed, authLoading])

  // Real-time live sync: update orders whenever admin or system changes status
  useEffect(() => {
    function handleLiveOrderEvent(e) {
      const { type, order } = e.detail || {}
      if (type === 'ORDER_STATUS_UPDATED' && order) {
        setOrders((prev) =>
          prev.map((o) => {
            const isMatch =
              String(o._id) === String(order._id) ||
              String(o._id).slice(-6).toUpperCase() === String(order._id || order.orderRef).slice(-6).toUpperCase()
            return isMatch ? { ...o, ...order } : o
          })
        )
      } else if (type === 'NEW_ORDER' && order) {
        // If current user placed a new order, add to top if matches user
        if (order.user === user?._id || order.userId === user?._id) {
          setOrders((prev) => [order, ...prev.filter((o) => o._id !== order._id)])
        }
      }
    }

    window.addEventListener('autogenuine_order_event', handleLiveOrderEvent)
    return () => window.removeEventListener('autogenuine_order_event', handleLiveOrderEvent)
  }, [user?._id])

  const [guestSearchRef, setGuestSearchRef] = useState('')

  const guestOrders = useMemo(() => {
    if (isAuthed) return []
    try {
      const saved = localStorage.getItem('autogenuine_guest_notifs')
      const list = saved ? JSON.parse(saved) : []
      const seen = new Set()
      return list.filter((item) => {
        const key = item.orderRef || item._id
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
    } catch {
      return []
    }
  }, [isAuthed])

  async function handleConfirmCancel(e) {
    e.preventDefault()
    if (!cancellingOrder) return

    const finalReason = cancelReason === 'Other reason' && customReason.trim()
      ? customReason.trim()
      : cancelReason

    setSubmittingCancel(true)
    try {
      const res = await ordersAPI.cancel(cancellingOrder._id, finalReason)
      const updatedOrder = res.order || { ...cancellingOrder, status: 'cancelled', cancellationReason: finalReason }

      // Update state in place
      setOrders((prev) => prev.map((o) => (o._id === cancellingOrder._id ? updatedOrder : o)))

      showToast(`Order #ORD-${String(cancellingOrder._id).slice(-6).toUpperCase()} has been cancelled.`)
      setCancellingOrder(null)
      setCustomReason('')
    } catch (err) {
      showToast(err.message || 'Could not cancel order')
    } finally {
      setSubmittingCancel(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <AnnouncementBar />
        <Header />
        <div className="container-content px-6 py-12">
          <div className="text-center py-16">
            <div className="w-10 h-10 mx-auto rounded-full border-2 border-brand border-t-transparent animate-spin" />
            <p className="mt-4 text-muted text-[14px]">Loading orders...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <AnnouncementBar />
      <Header />

      <div className="container-content px-6 py-12 flex-1">
        <button
          onClick={() => navigate('home')}
          className="inline-flex items-center gap-1.5 text-ink text-[13px] font-semibold hover:text-brand transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back to home
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-ink font-black text-2xl md:text-3xl tracking-tight uppercase">My Orders</h1>
              <p className="text-muted text-[13px] mt-0.5">Track your orders, view receipts, and manage cancellations</p>
            </div>
          </div>

          <a
            href="https://wa.me/923213498203?text=Hi%20AutoGenuine%2C%20I%20have%20an%20inquiry%20about%20my%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
          >
            <MessageCircle size={15} /> WhatsApp Order Support (+92 321 3498203)
          </a>
        </div>

        {/* ================= GUEST LOOKUP & RECENT GUEST ORDERS ================= */}
        {!isAuthed ? (
          <div className="space-y-6 max-w-3xl">
            {/* Guest Search Bar */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-line shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                  <Search size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-ink uppercase">Track Any Order</h2>
                  <p className="text-muted text-xs">Enter your order reference code (e.g. ORD-121179 or CC8F8E)</p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (guestSearchRef.trim()) {
                    navigate('track', { ref: guestSearchRef.trim() })
                  }
                }}
                className="mt-4 flex flex-col sm:flex-row gap-2.5"
              >
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    required
                    value={guestSearchRef}
                    onChange={(e) => setGuestSearchRef(e.target.value)}
                    placeholder="e.g. ORD-121179 or CC8F8E"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-line bg-cream/30 text-xs font-semibold text-ink placeholder:text-muted/60 focus:outline-none focus:border-brand"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-brand hover:bg-brand-600 text-white text-xs font-black tracking-widest uppercase transition-colors shrink-0"
                >
                  TRACK SHIPMENT →
                </button>
              </form>
            </div>

            {/* Recent Orders On This Device */}
            {guestOrders.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-ink uppercase tracking-wider flex items-center gap-2">
                  <Clock size={14} className="text-brand" /> Recent Orders on this Device
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {guestOrders.map((g, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-5 border border-line shadow-xs flex items-center justify-between flex-wrap gap-4 hover:border-brand/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                          <Package size={22} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-ink text-sm">#{g.orderRef}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {g.title || 'Order Update'}
                            </span>
                          </div>
                          <p className="text-xs text-muted truncate mt-0.5 max-w-sm">
                            {g.message || 'Click to view real-time delivery status & receipt.'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate('track', { ref: g.orderRef })}
                        className="h-9 px-4 rounded-xl bg-brand hover:bg-brand-600 text-white text-xs font-bold tracking-wider transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        TRACK <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sign In Prompt Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 rounded-2xl p-6 border border-amber-200/80 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="font-black text-sm text-ink">Have an AutoGenuine Account?</h4>
                  <p className="text-xs text-muted mt-0.5 max-w-md">
                    Sign in to access your complete lifetime order history, download tax invoices, and manage vehicle garage parts across all your devices.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('login')}
                  className="h-10 px-5 rounded-xl bg-brand hover:bg-brand-600 text-white text-xs font-black tracking-widest uppercase transition-colors shadow-xs"
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  onClick={() => navigate('register')}
                  className="h-10 px-4 rounded-xl border border-line bg-white hover:bg-cream text-ink text-xs font-bold transition-colors"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-line shadow-sm max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-muted" />
            </div>
            <h3 className="text-ink font-bold text-lg mb-1">No orders yet</h3>
            <p className="text-muted text-[13px] mb-6">Browse our OEM catalog to find verified genuine parts for your car.</p>
            <button
              onClick={() => navigate('vehicles')}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-brand text-white text-xs font-black tracking-widest hover:bg-brand-600 transition-colors"
            >
              BROWSE CATALOG
            </button>
          </div>
        ) : (
          <div className="space-y-5 max-w-3xl">
            {orders.map((order) => {
              const { label, icon: Icon, color, bg } = statusConfig[order.status] || statusConfig.processing
              const orderRef = `ORD-${String(order._id).slice(-6).toUpperCase()}`
              const canCancel = order.status === 'pending' || order.status === 'processing'
              const isShippedOrDelivered = ['packed', 'shipped', 'dispatched', 'out_for_delivery', 'delivered'].includes(order.status)

              return (
                <div key={order._id} className="bg-white rounded-2xl p-6 border border-line shadow-sm hover:shadow-md transition-shadow">
                  {/* Header: Ref, Date & Status */}
                  <div className="flex items-start justify-between flex-wrap gap-3 pb-4 border-b border-line">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-ink text-base">#{orderRef}</span>
                        {order.paymentMethod && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            {order.paymentMethod}
                          </span>
                        )}
                      </div>
                      <p className="text-muted text-xs mt-1">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${bg} ${color} text-xs font-bold`}>
                        <Icon size={14} /> {label}
                      </span>
                    </div>
                  </div>

                  {/* Customer / Delivery Snapshot if present */}
                  {(order.shippingAddress || order.vehicleInfo || order.customerPhone) && (
                    <div className="py-3 border-b border-line/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted">
                      {order.shippingAddress && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-muted shrink-0" />
                          <span className="truncate">Deliver to: <strong className="text-ink">{order.shippingAddress}{order.city ? `, ${order.city}` : ''}</strong></span>
                        </div>
                      )}
                      {order.vehicleInfo && (
                        <div className="flex items-center gap-1.5">
                          <Car size={13} className="text-muted shrink-0" />
                          <span className="truncate">Vehicle: <strong className="text-ink">{order.vehicleInfo}</strong></span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items list */}
                  <div className="py-4 space-y-2.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
                          <span className="text-ink font-medium truncate">{item.name}</span>
                          <span className="text-muted font-bold text-xs shrink-0">× {item.qty}</span>
                        </div>
                        <span className="font-bold text-ink shrink-0 ml-4">{formatPrice(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Cancellation Reason & Refund Notice if cancelled */}
                  {order.status === 'cancelled' && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 mb-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-600" />
                        <div>
                          <p className="font-bold">Order Cancelled</p>
                          <p className="text-[11px] text-red-600 mt-0.5">
                            Reason: {order.cancellationReason || 'Cancelled by store'}
                          </p>
                        </div>
                      </div>

                      {(order.paymentStatus === 'refunded' || order.refundId) && (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] flex items-center justify-between flex-wrap gap-1 font-bold">
                          <span>💳 100% Payment Refunded ({formatPrice(order.total)})</span>
                          {order.refundId && (
                            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Ref: {order.refundId}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom Bar: Total & Actions */}
                  <div className="border-t border-line pt-4 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-muted uppercase block">Total Amount</span>
                      <span className="font-black text-brand text-lg">{formatPrice(order.total)}</span>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => navigate('track', { ref: orderRef })}
                        className="h-9 px-3.5 rounded-lg border border-line hover:border-brand hover:text-brand bg-cream/50 text-ink text-xs font-bold tracking-wider transition-colors flex items-center gap-1.5"
                      >
                        <Truck size={14} /> TRACK SHIPMENT
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('support', { orderRef })}
                        className="h-9 px-3 rounded-lg border border-amber-300 hover:border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold tracking-wider transition-colors flex items-center gap-1.5"
                      >
                        <Sparkles size={14} className="text-amber-600" /> AI HELP
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('messages', { orderRef })}
                        className="h-9 px-3 rounded-lg border border-line hover:border-brand hover:text-brand bg-white text-ink text-xs font-bold tracking-wider transition-colors flex items-center gap-1.5"
                      >
                        <MessageCircle size={14} /> CONTACT STORE
                      </button>

                      {/* Reorder / Modify in Cart for Cancelled Orders */}
                      {order.status === 'cancelled' && order.items?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleReorder(order)}
                          className="h-9 px-3.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black tracking-wider transition-all shadow-xs flex items-center gap-1.5 active:scale-98"
                          title="Restore items to cart to modify quantities or re-place order"
                        >
                          <RotateCcw size={13} /> REORDER / MODIFY
                        </button>
                      )}

                      {/* Cancel Order Button (Available only if pending or processing) */}
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => setCancellingOrder(order)}
                          className="h-9 px-4 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold tracking-wider transition-colors flex items-center gap-1.5"
                        >
                          <XCircle size={14} /> CANCEL ORDER
                        </button>
                      )}

                      {/* Dispatched Notice (Cannot cancel) */}
                      {isShippedOrDelivered && (
                        <span className="text-[11px] font-semibold text-muted bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                          📦 Dispatched — In transit with courier
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ================= CANCEL ORDER CONFIRMATION MODAL ================= */}
      {cancellingOrder && (
        <Modal open={Boolean(cancellingOrder)} onClose={() => setCancellingOrder(null)} maxWidth="max-w-md">
          <div className="p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertTriangle size={24} />
            </div>

            <h3 className="font-black text-xl text-ink text-center">Cancel This Order?</h3>
            <p className="text-muted text-xs text-center mt-1">
              Order <strong className="text-ink">#ORD-{String(cancellingOrder._id).slice(-6).toUpperCase()}</strong> ({formatPrice(cancellingOrder.total)}) will be stopped before dispatch.
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
                  onClick={() => setCancellingOrder(null)}
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
