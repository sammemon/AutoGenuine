// Orders: clean table with basic order rows and an ultra-modern, professional,
// executive Order Details & Status Editor Modal.
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Eye,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Shield,
  Crown,
  MapPin,
  Car,
  Package,
  Phone,
  Mail,
  Receipt,
  MessageCircle,
  CreditCard,
  Calendar,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react'
import { admin as adminAPI } from '../../services/api'
import { useLocale } from '../../context/LocaleContext'
import { useToast } from '../../context/ToastContext'
import { useStoreSettings } from '../../context/StoreSettingsContext'
import { SectionHeader, DataState, TableWrap, Th, Td, Pill, DashModal, Pagination } from './ui'
import { ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_TONES } from './orderMeta'

const STAFF_CANCEL_REASONS = [
  'Item out of stock with OEM supplier',
  'Customer requested cancellation via phone / support',
  'Duplicate order placed by customer',
  'Delivery address outside courier coverage',
  'Payment verification failed / fraudulent attempt',
  'Other reason',
]

export default function OrdersSection({ params, clearParams }) {
  const { formatPrice } = useLocale()
  const { showToast } = useToast()
  const { whatsappNumber } = useStoreSettings()
  const [orders, setOrders] = useState([])
  const [waitingCarts, setWaitingCarts] = useState([])
  const [activeTab, setActiveTab] = useState('placed_orders') // 'placed_orders' | 'waiting_carts'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState(params?.filter || 'all')
  const [sendingReminderId, setSendingReminderId] = useState(null)

  // Pagination State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Order Details Modal State (Eye icon)
  const [viewOrder, setViewOrder] = useState(null)
  const [modalNewStatus, setModalNewStatus] = useState('')
  const [modalCancelReason, setModalCancelReason] = useState(STAFF_CANCEL_REASONS[0])
  const [customModalReason, setCustomModalReason] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (params?.filter) {
      setFilter(params.filter)
      if (clearParams) clearParams()
    }
  }, [params?.filter])

  function loadOrders(silent = false) {
    if (!silent) setLoading(true)
    adminAPI
      .listOrders()
      .then(setOrders)
      .catch((e) => setError(e.message || 'Failed to load orders'))
      .finally(() => { if (!silent) setLoading(false) })
  }

  function loadWaitingCarts() {
    adminAPI
      .listWaitingCarts()
      .then((res) => setWaitingCarts(res.waitingCarts || []))
      .catch((e) => console.warn('Failed to load waiting carts:', e.message))
  }

  useEffect(() => {
    loadOrders()
    loadWaitingCarts()
  }, [])

  async function handleSendReminder(cartId, customerEmail) {
    setSendingReminderId(cartId)
    try {
      await adminAPI.sendAbandonedCartReminder(cartId)
      showToast(`Cart reminder email sent successfully to ${customerEmail || 'customer'}!`, 'success')
      loadWaitingCarts()
    } catch (err) {
      showToast(err.message || 'Failed to send cart reminder', 'error')
    } finally {
      setSendingReminderId(null)
    }
  }

  // Listen for real-time Socket.io events
  useEffect(() => {
    function handleLiveOrderEvent() {
      loadOrders(true) // silent background update
    }
    window.addEventListener('autogenuine_order_event', handleLiveOrderEvent)
    return () => window.removeEventListener('autogenuine_order_event', handleLiveOrderEvent)
  }, [])

  // Auto-open view modal when navigated from notification bell or live toast
  useEffect(() => {
    if (!params?.orderId || orders.length === 0) return
    const targetOrder = orders.find(
      (o) =>
        String(o._id) === String(params.orderId) ||
        String(o._id).slice(-6).toUpperCase() === String(params.orderId).slice(-6).toUpperCase()
    )
    if (targetOrder) {
      handleOpenViewModal(targetOrder)
      if (clearParams) clearParams()
    }
  }, [params?.orderId, orders])

  // Filter and search records
  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return orders.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false
      if (!needle) return true
      const ref = String(o._id).slice(-6).toLowerCase()
      return (
        ref.includes(needle) ||
        (o.customerName || '').toLowerCase().includes(needle) ||
        (o.customerPhone || '').toLowerCase().includes(needle) ||
        (o.user?.name || '').toLowerCase().includes(needle) ||
        (o.user?.email || '').toLowerCase().includes(needle) ||
        (o.shippingAddress || '').toLowerCase().includes(needle) ||
        (o.city || '').toLowerCase().includes(needle) ||
        (o.cancellationReason || '').toLowerCase().includes(needle) ||
        (o.cancelledByName || '').toLowerCase().includes(needle)
      )
    })
  }, [orders, q, filter])

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setPage(1)
  }, [q, filter])

  // Slice rows for pagination
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  // Open Details Modal
  function handleOpenViewModal(order) {
    setViewOrder(order)
    setModalNewStatus(order.status)
    setModalCancelReason(STAFF_CANCEL_REASONS[0])
    setCustomModalReason('')
  }

  // Update order status inside modal
  async function handleSaveStatus(e) {
    if (e) e.preventDefault()
    if (!viewOrder || !modalNewStatus) return

    if (modalNewStatus === viewOrder.status) {
      showToast('Status is already ' + modalNewStatus)
      return
    }

    const finalReason =
      modalNewStatus === 'cancelled'
        ? modalCancelReason === 'Other reason' && customModalReason.trim()
          ? customModalReason.trim()
          : modalCancelReason
        : undefined

    setUpdatingStatus(true)
    try {
      const updated = await adminAPI.updateOrderStatus(
        viewOrder._id,
        modalNewStatus,
        finalReason
      )
      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o._id === viewOrder._id ? { ...o, ...updated } : o))
      )
      setViewOrder((prev) => (prev ? { ...prev, ...updated } : prev))
      showToast(`Order #ORD-${String(viewOrder._id).slice(-6).toUpperCase()} updated to ${modalNewStatus}`)
    } catch (err) {
      showToast(err.message || 'Status update failed')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Format who cancelled the order
  function renderCancelledByBadge(order) {
    const by = (order.cancelledBy || '').toLowerCase()
    const name = order.cancelledByName || order.customerName || order.user?.name || ''
    const cleanName = name.replace(/\s*\((Customer|Admin|Store Owner|Owner)\)\s*/gi, '').trim()

    if (
      by === 'owner' ||
      order.cancellationReason?.toLowerCase().includes('store owner') ||
      order.cancelledByName?.toLowerCase().includes('owner')
    ) {
      const display = cleanName && cleanName.toLowerCase() !== 'store owner' && cleanName.toLowerCase() !== 'owner' ? ` (${cleanName})` : ''
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
          <Crown size={12} className="text-purple-700 shrink-0" />
          <span>Cancelled by <strong>Store Owner</strong>{display}</span>
        </span>
      )
    }

    if (
      by === 'admin' ||
      order.cancellationReason?.toLowerCase().includes('admin') ||
      order.cancelledByName?.toLowerCase().includes('admin')
    ) {
      const display = cleanName && cleanName.toLowerCase() !== 'admin' ? ` (${cleanName})` : ''
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
          <Shield size={12} className="text-blue-700 shrink-0" />
          <span>Cancelled by <strong>Admin</strong>{display}</span>
        </span>
      )
    }

    const display = cleanName && cleanName.toLowerCase() !== 'customer' && cleanName.toLowerCase() !== 'user' ? ` (${cleanName})` : ''
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
        <User size={12} className="text-red-700 shrink-0" />
        <span>Cancelled by <strong>Customer</strong>{display}</span>
      </span>
    )
  }

  return (
    <>
      <SectionHeader
        title="Orders & Waiting Carts"
        subtitle="Track live customer orders, view full customer details, or monitor waiting customer carts to send 1-click order recovery emails."
      />

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-line mb-5">
        <button
          onClick={() => setActiveTab('placed_orders')}
          className={`pb-2.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'placed_orders'
              ? 'border-brand text-brand'
              : 'border-transparent text-muted hover:text-dark'
          }`}
        >
          <Package size={14} />
          <span>Placed Orders</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-extrabold">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('waiting_carts')}
          className={`pb-2.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'waiting_carts'
              ? 'border-brand text-brand'
              : 'border-transparent text-muted hover:text-dark'
          }`}
        >
          <Receipt size={14} />
          <span>Waiting / Abandoned Carts</span>
          {waitingCarts.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-orange-500 text-white font-extrabold animate-pulse">
              {waitingCarts.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'waiting_carts' ? (
        /* Waiting / Abandoned Carts View */
        <div className="space-y-4">
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-4 flex items-start gap-3">
            <Clock className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Live Abandoned &amp; Waiting Carts ({waitingCarts.length})
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                These are active customers who added OEM auto parts to their cart but have not placed their order yet. Click <strong>"Send Reminder"</strong> to email them a 1-click order completion link.
              </p>
            </div>
          </div>

          <DataState
            loading={false}
            error={''}
            empty={waitingCarts.length === 0}
            emptyLabel="No waiting carts right now. All shopping carts have completed checkout!"
          >
            <TableWrap>
              <thead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Cart Items</Th>
                  <Th>Estimated Total</Th>
                  <Th>Last Active</Th>
                  <Th>Reminder Status</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {waitingCarts.map((cart) => {
                  const custName = cart.user?.name || 'Guest / Customer'
                  const custEmail = cart.user?.email || 'No email on file'
                  const custPhone = cart.user?.phone || ''
                  const isSending = sendingReminderId === cart._id

                  return (
                    <tr key={cart._id} className="hover:bg-slate-50 transition-colors">
                      <Td className="font-semibold text-dark">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 uppercase">
                            {custName.slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-dark">{custName}</div>
                            <div className="text-[11px] text-muted flex items-center gap-1">
                              <Mail size={10} />
                              <span>{custEmail}</span>
                            </div>
                            {custPhone && (
                              <div className="text-[10px] text-muted flex items-center gap-1">
                                <Phone size={9} />
                                <span>{custPhone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Td>

                      <Td>
                        <div className="space-y-1 max-w-[260px]">
                          {cart.items.map((item, idx) => (
                            <div key={idx} className="text-xs flex justify-between gap-2 border-b border-dashed border-slate-200 pb-0.5">
                              <span className="font-medium text-slate-800 truncate">{item.name}</span>
                              <span className="font-bold text-slate-600 shrink-0">x{item.qty} (Rs {formatPrice(item.price)})</span>
                            </div>
                          ))}
                        </div>
                      </Td>

                      <Td className="font-extrabold text-brand text-sm">
                        Rs {formatPrice(cart.total)}
                      </Td>

                      <Td className="text-xs text-muted">
                        {cart.lastUpdated ? new Date(cart.lastUpdated).toLocaleString() : 'Recently'}
                      </Td>

                      <Td>
                        {cart.lastReminderSentAt ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <CheckCircle2 size={10} />
                            <span>Reminder Sent ({new Date(cart.lastReminderSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            <Clock size={10} />
                            <span>Awaiting Reminder</span>
                          </span>
                        )}
                      </Td>

                      <Td className="text-right">
                        <button
                          disabled={isSending || !cart.user?.email}
                          onClick={() => handleSendReminder(cart._id, custEmail)}
                          className="px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded text-xs font-bold transition-all shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                        >
                          <Mail size={12} />
                          <span>{isSending ? 'Sending…' : 'Send Reminder'}</span>
                        </button>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </TableWrap>
          </DataState>
        </div>
      ) : (
        /* Placed Orders View */
        <>
          {/* Filter and search bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by order ref, customer, phone, address…"
                className="w-full h-10 pl-9 pr-3 border border-line rounded-md text-sm focus:outline-none focus:border-brand bg-white"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-10 px-3 border border-line rounded-md text-sm bg-white focus:outline-none focus:border-brand font-medium"
            >
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s] || s.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <DataState
            loading={loading}
            error={error}
            empty={filteredRows.length === 0}
            emptyLabel="No orders match your search or filter"
          >
            <TableWrap>
              <thead>
                <tr>
                  <Th>Order Ref</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Total</Th>
              <Th>Placed Date</Th>
              <Th>Status</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((o) => {
              const isCancelled = o.status === 'cancelled'
              return (
                <tr key={o._id} className={isCancelled ? 'bg-red-50/20' : ''}>
                  {/* Order Ref & Payment Type */}
                  <Td className="font-bold text-ink whitespace-nowrap align-middle">
                    <span className="block font-black text-sm">ORD-{String(o._id).slice(-6).toUpperCase()}</span>
                    {o.paymentMethod && (
                      <span className="inline-block mt-0.5 text-[10px] uppercase tracking-wider font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {o.paymentMethod}
                      </span>
                    )}
                  </Td>

                  {/* Customer Basic Info */}
                  <Td className="align-middle">
                    <span className="block text-ink font-bold text-sm truncate max-w-[200px]">
                      {o.customerName || o.user?.name || 'Customer'}
                    </span>
                    <span className="block text-muted text-xs truncate max-w-[200px]">
                      {o.customerEmail || o.user?.email || o.customerPhone || '—'}
                    </span>
                  </Td>

                  {/* Items Count & Preview */}
                  <Td className="align-middle text-xs whitespace-nowrap">
                    <span className="font-bold text-ink block">{o.items?.length || 0} {o.items?.length === 1 ? 'Part' : 'Parts'}</span>
                    <span className="block text-muted text-[11px] truncate max-w-[180px]">
                      {o.items?.[0]?.name || 'Item'}
                      {o.items?.length > 1 ? ` +${o.items.length - 1} more` : ''}
                    </span>
                  </Td>

                  {/* Total */}
                  <Td className="font-black text-ink whitespace-nowrap align-middle text-sm">
                    {formatPrice(o.total)}
                  </Td>

                  {/* Placed Date */}
                  <Td className="text-muted text-xs whitespace-nowrap align-middle">
                    {new Date(o.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Td>

                  {/* Status Pill Only */}
                  <Td className="align-middle whitespace-nowrap">
                    <Pill tone={ORDER_TONES[o.status] || 'ink'}>
                      {o.status.toUpperCase()}
                    </Pill>
                  </Td>

                  {/* Action Column: Quick Approve & Eye Icon */}
                  <Td className="align-middle text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {o.status === 'pending' && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              const res = await adminAPI.updateOrderStatus(o._id, 'processing')
                              const updated = res.order || res || { ...o, status: 'processing' }
                              setOrders((prev) => prev.map((r) => (r._id === o._id ? { ...r, ...updated } : r)))
                              showToast(`✅ Order #ORD-${String(o._id).slice(-6).toUpperCase()} approved and moved to Processing!`)
                            } catch (err) {
                              showToast(err.message || 'Failed to approve order')
                            }
                          }}
                          className="h-8 px-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1 shadow-2xs"
                          title="Approve Order and Start Processing"
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenViewModal(o)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-orange-600 hover:border-orange-500 transition-colors shadow-2xs"
                        title="View Order Details & Status"
                        aria-label="View Order Details"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </TableWrap>

        {/* Pagination Bar */}
        <Pagination
          page={page}
          total={filteredRows.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </DataState>
      </>
      )}

      {/* ================= HIGH-END CLEAN ORDER DETAILS POPUP MODAL ================= */}
      {viewOrder && (
        <DashModal
          open={Boolean(viewOrder)}
          onClose={() => setViewOrder(null)}
          maxWidth="max-w-2xl"
          title={`Order Details — ORD-${String(viewOrder._id).slice(-6).toUpperCase()}`}
          footer={
            <div className="w-full flex items-center justify-between flex-wrap gap-3">
              <a
                href={`https://wa.me/${(viewOrder.customerPhone || '').replace(/\D/g, '') || whatsappNumber}?text=Hi%20${encodeURIComponent(viewOrder.customerName || 'Customer')}%2C%20regarding%20your%20AutoGenuine%20order%20%23ORD-${String(viewOrder._id).slice(-6).toUpperCase()}...`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2"
              >
                <MessageCircle size={16} /> WhatsApp Customer
              </a>

              <button
                type="button"
                onClick={() => setViewOrder(null)}
                className="h-10 px-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors"
              >
                CLOSE
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Top Order Overview Banner */}
            <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted text-xs">
                  <Calendar size={13} className="text-brand" />
                  <span className="font-semibold text-ink">
                    {new Date(viewOrder.createdAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-[11px] text-muted">
                    at {new Date(viewOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <CreditCard size={13} className="text-gray-400" />
                  <span className="text-muted">Payment:</span>
                  <span className="font-bold text-ink uppercase text-[11px] bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    {viewOrder.paymentMethod === 'stripe' ? 'STRIPE 3DS' : viewOrder.paymentMethod || 'Card'}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    viewOrder.paymentStatus === 'paid'
                      ? 'text-green-700 bg-green-50 border-green-200'
                      : viewOrder.paymentStatus === 'refunded'
                      ? 'text-purple-700 bg-purple-50 border-purple-200'
                      : viewOrder.paymentStatus === 'failed'
                      ? 'text-red-700 bg-red-50 border-red-200'
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    {viewOrder.paymentStatus === 'refunded' ? 'REFUNDED 💳' : viewOrder.paymentStatus || 'pending'}
                  </span>
                  {(viewOrder.refundId || viewOrder.stripePaymentIntentId || viewOrder.transactionReference) && (
                    <span className="text-[10px] font-mono text-muted bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 truncate max-w-[160px]" title={viewOrder.refundId || viewOrder.stripePaymentIntentId || viewOrder.transactionReference}>
                      {viewOrder.refundId ? `Ref: ${viewOrder.refundId}` : viewOrder.stripePaymentIntentId || viewOrder.transactionReference}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black tracking-widest text-muted uppercase block">
                  Current Status
                </span>
                <div className="mt-1">
                  <Pill tone={ORDER_TONES[viewOrder.status] || 'ink'}>
                    {viewOrder.status.toUpperCase()}
                  </Pill>
                </div>
              </div>
            </div>

            {/* PENDING CONFIRMATION QUICK APPROVAL BANNER */}
            {viewOrder.status === 'pending' && (
              <div className="p-4 bg-amber-50/95 rounded-2xl border border-amber-200 flex items-center justify-between flex-wrap gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                    <Clock size={20} />
                  </span>
                  <div>
                    <h5 className="font-black text-xs text-amber-950 uppercase tracking-wide">
                      Awaiting Store Approval
                    </h5>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      This order is newly placed &amp; paid. Verify stock availability before approving.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={async () => {
                      setUpdatingStatus(true)
                      try {
                        const res = await adminAPI.updateOrderStatus(viewOrder._id, 'processing')
                        const updated = res.order || res || { ...viewOrder, status: 'processing' }
                        setViewOrder(updated)
                        setModalNewStatus('processing')
                        setOrders((prev) => prev.map((r) => (r._id === viewOrder._id ? { ...r, ...updated } : r)))
                        showToast(`✅ Order #${String(viewOrder._id).slice(-6).toUpperCase()} approved! Status is now Processing.`)
                      } catch (err) {
                        showToast(err.message || 'Failed to approve order')
                      } finally {
                        setUpdatingStatus(false)
                      }
                    }}
                    className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black tracking-widest uppercase transition-all shadow-xs flex items-center gap-2 shrink-0 active:scale-98"
                  >
                    <CheckCircle2 size={16} /> {updatingStatus ? 'APPROVING…' : 'APPROVE & PROCESS'}
                  </button>
                </div>
              </div>
            )}

            {/* If order was approved, show approval audit info */}
            {viewOrder.approvedByName && viewOrder.status !== 'pending' && viewOrder.status !== 'cancelled' && (
              <div className="px-3.5 py-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>
                  Approved by <strong>{viewOrder.approvedByName}</strong> ({viewOrder.approvedBy === 'owner' ? 'Store Owner' : 'Admin'})
                  {viewOrder.approvedAt ? ` on ${new Date(viewOrder.approvedAt).toLocaleDateString()}` : ''}
                </span>
              </div>
            )}

            {/* FULFILLMENT STATUS UPDATER */}
            <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs text-ink uppercase tracking-wider flex items-center gap-2">
                  <Package size={15} className="text-brand" /> Update Fulfillment Status
                </h4>
                <span className="text-[11px] text-muted">Real-time sync</span>
              </div>

              <form onSubmit={handleSaveStatus} className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex-1">
                    <select
                      value={modalNewStatus}
                      onChange={(e) => setModalNewStatus(e.target.value)}
                      className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-xs font-bold text-ink bg-white focus:outline-none focus:border-brand shadow-2xs"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {ORDER_STATUS_LABELS[s] || s.replace(/_/g, ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={updatingStatus || modalNewStatus === viewOrder.status}
                    className="h-11 px-5 rounded-xl bg-brand hover:bg-brand-600 transition-all text-white text-xs font-black tracking-widest uppercase disabled:opacity-50 shadow-xs shrink-0"
                  >
                    {updatingStatus ? 'SAVING…' : 'UPDATE STATUS'}
                  </button>
                </div>

                {/* If changing to cancelled, prompt for cancellation reason */}
                {modalNewStatus === 'cancelled' && (
                  <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 space-y-2 mt-2">
                    <label className="block text-[11px] font-bold text-red-900 uppercase">
                      Cancellation Reason *
                    </label>
                    <select
                      value={modalCancelReason}
                      onChange={(e) => setModalCancelReason(e.target.value)}
                      className="w-full h-10 px-3 border border-red-200 rounded-lg text-xs font-medium bg-white text-ink focus:outline-none focus:border-red-500"
                    >
                      {STAFF_CANCEL_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>

                    {modalCancelReason === 'Other reason' && (
                      <textarea
                        rows={2}
                        required
                        placeholder="Specify reason..."
                        value={customModalReason}
                        onChange={(e) => setCustomModalReason(e.target.value)}
                        className="w-full p-2.5 border border-red-200 rounded-lg text-xs text-ink focus:outline-none focus:border-red-500"
                      />
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Cancellation Notice if Order is Cancelled */}
            {viewOrder.status === 'cancelled' && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <XCircle size={16} className="text-red-600 shrink-0" />
                    <h4 className="font-bold text-red-900 text-sm">Order is Cancelled</h4>
                  </div>
                  <div>{renderCancelledByBadge(viewOrder)}</div>
                </div>

                <p className="text-xs text-red-800">
                  <strong>Recorded Reason:</strong> {viewOrder.cancellationReason || 'No reason specified'}
                </p>

                {/* Refund Status Banner */}
                {viewOrder.paymentStatus === 'refunded' && (
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      100% Payment Refunded to Customer ({formatPrice(viewOrder.total)})
                    </span>
                    {viewOrder.refundId && (
                      <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                        Stripe Ref: {viewOrder.refundId}
                      </span>
                    )}
                  </div>
                )}

                {viewOrder.cancelledAt && (
                  <p className="text-[11px] text-red-500">
                    Cancelled on {new Date(viewOrder.cancelledAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Customer & Delivery Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Customer Contact Card */}
              <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-xs space-y-2">
                <p className="font-black text-ink uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-orange-100 text-brand flex items-center justify-center shrink-0">
                    <User size={12} />
                  </span>
                  Customer Information
                </p>
                <div className="space-y-1 pt-1">
                  <p className="font-black text-ink text-sm">
                    {viewOrder.customerName || viewOrder.user?.name || 'Customer'}
                  </p>
                  <p className="text-muted flex items-center gap-1.5 text-xs">
                    <Phone size={12} className="text-gray-400" />
                    <a href={`tel:${viewOrder.customerPhone || viewOrder.user?.phone}`} className="hover:text-brand transition-colors font-medium">
                      {viewOrder.customerPhone || viewOrder.user?.phone || '—'}
                    </a>
                  </p>
                  <p className="text-muted flex items-center gap-1.5 text-xs">
                    <Mail size={12} className="text-gray-400" />
                    <a href={`mailto:${viewOrder.customerEmail || viewOrder.user?.email}`} className="hover:text-brand transition-colors truncate">
                      {viewOrder.customerEmail || viewOrder.user?.email || '—'}
                    </a>
                  </p>
                </div>
              </div>

              {/* Delivery Address & Fitment Card */}
              <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-xs space-y-2">
                <p className="font-black text-ink uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <MapPin size={12} />
                  </span>
                  Delivery &amp; Fitment
                </p>
                <div className="space-y-1 pt-1">
                  <p className="text-ink font-semibold text-xs leading-relaxed">
                    {viewOrder.shippingAddress || 'Standard Delivery'}
                    {viewOrder.city ? `, ${viewOrder.city}` : ''}
                  </p>
                  {viewOrder.vehicleInfo && (
                    <p className="text-brand font-bold text-xs flex items-center gap-1 mt-1 bg-brand/5 px-2 py-0.5 rounded-md inline-block border border-brand/10">
                      <Car size={12} className="inline mr-1" /> {viewOrder.vehicleInfo}
                    </p>
                  )}
                  {viewOrder.notes && (
                    <p className="text-muted text-[11px] italic mt-1 bg-gray-50 p-1.5 rounded border border-gray-200">
                      Note: "{viewOrder.notes}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Itemized Parts Breakdown Card */}
            <div className="space-y-2">
              <h4 className="font-black text-xs text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Receipt size={14} className="text-brand" /> Ordered Genuine Parts ({viewOrder.items?.length || 0})
              </h4>
              <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-xs divide-y divide-gray-100">
                {viewOrder.items?.map((it, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-ink truncate text-[13px]">{it.name}</p>
                        <p className="text-muted text-[11px] mt-0.5">
                          Unit Price: <span className="font-semibold text-ink">{formatPrice(it.price)}</span> × Quantity: <span className="font-black text-ink">{it.qty}</span>
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-ink text-sm shrink-0 ml-4">
                      {formatPrice(it.price * it.qty)}
                    </span>
                  </div>
                ))}

                {/* Highlighted Total Banner */}
                <div className="p-4 bg-gray-50 flex items-center justify-between border-t border-gray-200/80">
                  <div>
                    <span className="font-black text-xs text-ink uppercase tracking-wider block">
                      Total Amount
                    </span>
                    <span className="text-[11px] text-muted">Inclusive of all taxes &amp; delivery</span>
                  </div>
                  <span className="font-black text-brand text-xl">
                    {formatPrice(viewOrder.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DashModal>
      )}
    </>
  )
}
