import { useEffect, useState } from 'react'
import {
  ShoppingBag, ArrowRight, X, MapPin, CreditCard,
  AlertTriangle, CheckCircle, Truck, XCircle
} from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { useLocale } from '../../context/LocaleContext'

// Status config for the event popup
const STATUS_CONFIG = {
  cancelled: {
    icon: XCircle,
    label: '❌ ORDER CANCELLED',
    color: 'from-red-600 to-red-500',
    border: 'border-red-500/80',
    shadow: 'shadow-red-500/20',
    iconBg: 'bg-red-100 text-red-600 border-red-200',
    btnColor: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-400/20',
  },
  delivered: {
    icon: CheckCircle,
    label: '✅ ORDER DELIVERED',
    color: 'from-emerald-600 to-green-500',
    border: 'border-emerald-500/80',
    shadow: 'shadow-emerald-500/20',
    iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    btnColor: 'from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-400/20',
  },
  shipped: {
    icon: Truck,
    label: '🚚 ORDER DISPATCHED',
    color: 'from-blue-600 to-sky-500',
    border: 'border-blue-500/80',
    shadow: 'shadow-blue-500/20',
    iconBg: 'bg-blue-100 text-blue-600 border-blue-200',
    btnColor: 'from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 shadow-blue-400/20',
  },
  processing: {
    icon: ShoppingBag,
    label: '⚙️ ORDER PROCESSING',
    color: 'from-amber-600 to-yellow-500',
    border: 'border-amber-500/80',
    shadow: 'shadow-amber-500/20',
    iconBg: 'bg-amber-100 text-amber-600 border-amber-200',
    btnColor: 'from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-amber-400/20',
  },
  default: {
    icon: AlertTriangle,
    label: '🔄 ORDER UPDATED',
    color: 'from-slate-700 to-slate-600',
    border: 'border-slate-400/80',
    shadow: 'shadow-slate-500/20',
    iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
    btnColor: 'from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-slate-400/20',
  },
}

function CountdownToast({ data, onDismiss, onViewOrder, totalDurationMs = 12000 }) {
  const { formatPrice } = useLocale()
  const [progress, setProgress] = useState(100)
  const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.default
  const StatusIcon = cfg.icon

  useEffect(() => {
    setProgress(100)
    const intervalTime = 100
    const step = (intervalTime / totalDurationMs) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          onDismiss()
          return 0
        }
        return prev - step
      })
    }, intervalTime)

    return () => clearInterval(timer)
  }, [data, totalDurationMs, onDismiss])

  function handleView() {
    onDismiss()
    if (onViewOrder) onViewOrder(data.orderId)
  }

  return (
    <div className={`bg-white rounded-2xl border-2 ${cfg.border} shadow-2xl ${cfg.shadow} overflow-hidden relative`}>
      {/* Top Colored Bar */}
      <div className={`bg-gradient-to-r ${cfg.color} text-white px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white border border-white/50" />
          </span>
          <span className="text-[11px] font-black tracking-widest uppercase">
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/80 font-mono font-bold">{data.time}</span>
          <button
            onClick={onDismiss}
            className="text-white/80 hover:text-white p-0.5 rounded hover:bg-white/20 transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${cfg.iconBg}`}>
              <StatusIcon size={20} />
            </div>
            <div>
              <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                #{data.orderRef}
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-0.5 leading-tight">
                {data.customerName}
              </h4>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
            <span className="font-black text-slate-900 text-base">{formatPrice(data.total)}</span>
          </div>
        </div>

        {/* Extra info for cancellations */}
        {data.status === 'cancelled' && data.cancellationReason && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200/80 text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Reason: </span>
              <span>{data.cancellationReason}</span>
              {data.cancelledByName && (
                <span className="text-red-500 ml-1">(by {data.cancelledByName})</span>
              )}
            </div>
          </div>
        )}

        {/* Quick pills */}
        {(data.city || data.paymentMethod) && (
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            {data.city && (
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600">
                <MapPin size={13} className="text-orange-500 shrink-0" />
                <span className="truncate">{data.city}</span>
              </div>
            )}
            {data.paymentMethod && (
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600">
                <CreditCard size={13} className="text-emerald-600 shrink-0" />
                <span className="truncate uppercase font-semibold text-[11px]">{data.paymentMethod}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-1 flex items-center gap-2">
          <button
            onClick={handleView}
            className={`flex-1 h-10 px-4 rounded-xl bg-gradient-to-r ${cfg.btnColor} text-white text-xs font-bold tracking-wider transition-all shadow-md flex items-center justify-center gap-2 active:scale-98`}
          >
            <span>VIEW ORDER</span>
            <ArrowRight size={14} />
          </button>
          <button
            onClick={onDismiss}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-100 w-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${cfg.color} transition-all ease-linear`}
          style={{ width: `${progress}%`, transitionDuration: '100ms' }}
        />
      </div>
    </div>
  )
}

export default function LiveOrderToast({ onViewOrder }) {
  const { livePopupOrder, dismissLivePopupOrder, livePopupEvent, dismissLivePopupEvent } = useNotifications()
  const { formatPrice } = useLocale()
  const [progress, setProgress] = useState(100)

  // Auto-dismiss countdown for new order (12 seconds)
  useEffect(() => {
    if (!livePopupOrder) return
    setProgress(100)
    const totalDuration = 12000
    const intervalTime = 100
    const step = (intervalTime / totalDuration) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          dismissLivePopupOrder()
          return 0
        }
        return prev - step
      })
    }, intervalTime)

    return () => clearInterval(timer)
  }, [livePopupOrder, dismissLivePopupOrder])

  function handleNewOrderAction() {
    const targetId = livePopupOrder?.orderId
    dismissLivePopupOrder()
    if (onViewOrder) onViewOrder(targetId)
  }

  // Stack position — show event popup above new order popup if both exist
  return (
    <aside
      aria-label="Live order notifications"
      className="fixed top-5 right-4 sm:right-6 z-50 max-w-[420px] w-full pointer-events-auto space-y-3"
    >
      {/* Status Update Popup (cancellation / dispatch / delivery) */}
      {livePopupEvent && (
        <div className="animate-in fade-in slide-in-from-top-6 duration-300">
          <CountdownToast
            data={livePopupEvent}
            onDismiss={dismissLivePopupEvent}
            onViewOrder={onViewOrder}
            totalDurationMs={14000}
          />
        </div>
      )}

      {/* New Order Popup */}
      {livePopupOrder && (
        <div className="animate-in fade-in slide-in-from-top-6 duration-300">
          <div className="bg-white rounded-2xl border-2 border-orange-500/90 shadow-2xl shadow-orange-500/20 overflow-hidden relative">
            {/* Top Live Bar */}
            <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-white" />
                </span>
                <span className="text-[11px] font-black tracking-widest uppercase">
                  ⚡ LIVE NEW ORDER RECEIVED
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/80 font-mono font-bold">{livePopupOrder.time}</span>
                <button
                  onClick={dismissLivePopupOrder}
                  className="text-white/80 hover:text-white p-0.5 rounded hover:bg-white/20 transition-colors"
                  title="Close notification"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0 shadow-xs">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      #{livePopupOrder.orderRef}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5 leading-tight">
                      {livePopupOrder.customerName}
                    </h4>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Due</span>
                  <span className="font-black text-slate-900 text-base">{formatPrice(livePopupOrder.total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600">
                  <MapPin size={13} className="text-orange-500 shrink-0" />
                  <span className="truncate">{livePopupOrder.city || 'Storefront'}</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600">
                  <CreditCard size={13} className="text-emerald-600 shrink-0" />
                  <span className="truncate uppercase font-semibold text-[11px]">{livePopupOrder.paymentMethod}</span>
                </div>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={handleNewOrderAction}
                  className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold tracking-wider transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>VIEW & DISPATCH ORDER</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={dismissLivePopupOrder}
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {/* Progress Countdown Bar */}
            <div className="h-1 bg-slate-100 w-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all ease-linear"
                style={{ width: `${progress}%`, transitionDuration: '100ms' }}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
