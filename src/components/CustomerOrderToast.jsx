import { useEffect, useState } from 'react'
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  X,
  Sparkles,
  MapPin,
  Receipt,
  ExternalLink,
} from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'
import { useNav } from '../context/NavContext'
import { useLocale } from '../context/LocaleContext'

const CUSTOMER_ALERT_CONFIG = {
  pending: {
    icon: Clock,
    label: 'Order Received • Pending Approval',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    accentGradient: 'from-amber-500 to-orange-500',
  },
  placed: {
    icon: Clock,
    label: 'Order Received • Pending Approval',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    accentGradient: 'from-amber-500 to-orange-500',
  },
  processing: {
    icon: Sparkles,
    label: 'Order Confirmed • Processing',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    accentGradient: 'from-emerald-500 to-teal-500',
  },
  packed: {
    icon: Package,
    label: 'Packed • Ready for Dispatch',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    iconBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    accentGradient: 'from-orange-500 to-amber-500',
  },
  dispatched: {
    icon: Truck,
    label: 'Dispatched from Warehouse',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    iconBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    accentGradient: 'from-sky-500 to-blue-500',
  },
  out_for_delivery: {
    icon: Truck,
    label: 'Out for Delivery Today',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    accentGradient: 'from-indigo-500 to-blue-500',
  },
  shipped: {
    icon: Truck,
    label: 'In Transit with Courier',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    accentGradient: 'from-blue-500 to-sky-500',
  },
  delivered: {
    icon: CheckCircle2,
    label: 'Delivered Successfully',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    accentGradient: 'from-emerald-500 to-teal-500',
  },
  cancelled: {
    icon: XCircle,
    label: 'Order Cancelled',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/30',
    iconBg: 'bg-red-500/20 text-red-400 border-red-500/30',
    accentGradient: 'from-red-500 to-rose-500',
  },
}

export default function CustomerOrderToast() {
  const { customerLiveAlert, dismissCustomerLiveAlert } = useNotifications()
  const { page, navigate } = useNav()
  const { formatPrice } = useLocale()
  const [progress, setProgress] = useState(100)

  // 10-second countdown auto dismiss cleanly without updating parent inside render
  useEffect(() => {
    if (!customerLiveAlert) return
    setProgress(100)
    const totalDuration = 10000

    const dismissTimer = setTimeout(() => {
      dismissCustomerLiveAlert()
    }, totalDuration)

    const intervalTime = 100
    const step = (intervalTime / totalDuration) * 100

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step))
    }, intervalTime)

    return () => {
      clearTimeout(dismissTimer)
      clearInterval(progressTimer)
    }
  }, [customerLiveAlert, dismissCustomerLiveAlert])

  // Don't show toast if there's no alert or user is already on payment-success page
  if (!customerLiveAlert || page === 'payment-success') return null

  const cfg = CUSTOMER_ALERT_CONFIG[customerLiveAlert.status] || CUSTOMER_ALERT_CONFIG.processing
  const AlertIcon = cfg.icon

  function handleTrackOrder() {
    const ref = customerLiveAlert?.orderRef
    dismissCustomerLiveAlert()
    if (ref) {
      navigate('track', { ref })
    } else {
      navigate('orders')
    }
  }

  function handleViewOrders() {
    dismissCustomerLiveAlert()
    navigate('orders')
  }

  return (
    <aside
      aria-label="Order update notification"
      className="fixed top-5 right-4 sm:right-6 z-50 max-w-[390px] w-full pointer-events-auto animate-scale-in"
    >
      <div className="bg-slate-950/95 text-white rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl space-y-0">
        {/* Top Header Bar */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.badgeBg}`}>
              {cfg.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono font-medium">
              {customerLiveAlert.time || 'Just now'}
            </span>
            <button
              onClick={dismissCustomerLiveAlert}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${cfg.iconBg}`}>
                <AlertIcon size={18} />
              </div>
              <div className="min-w-0">
                <span className="font-mono text-[11px] font-black text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                  #{customerLiveAlert.orderRef}
                </span>
                <h4 className="font-bold text-white text-xs sm:text-sm mt-1 leading-tight truncate">
                  {customerLiveAlert.title}
                </h4>
              </div>
            </div>

            {customerLiveAlert.total > 0 && (
              <div className="text-right shrink-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Total</span>
                <span className="font-black text-white text-xs sm:text-sm">{formatPrice(customerLiveAlert.total)}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            {customerLiveAlert.message}
          </p>

          {/* Cancellation Reason if applicable */}
          {customerLiveAlert.status === 'cancelled' && customerLiveAlert.cancellationReason && (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300">
              <span className="font-bold">Reason: </span>
              <span>{customerLiveAlert.cancellationReason}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={handleTrackOrder}
              className={`flex-1 h-9 px-4 rounded-xl bg-gradient-to-r ${cfg.accentGradient} text-white text-xs font-black tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95`}
            >
              <span>TRACK ORDER</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={handleViewOrders}
              className="h-9 px-3.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              My Orders
            </button>
          </div>
        </div>

        {/* Progress Countdown Bar */}
        <div className="h-0.5 bg-slate-900 w-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${cfg.accentGradient} transition-all ease-linear`}
            style={{ width: `${progress}%`, transitionDuration: '100ms' }}
          />
        </div>
      </div>
    </aside>
  )
}
