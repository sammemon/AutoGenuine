import { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck, Package, Truck, CheckCircle2, XCircle, Clock, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'
import { useNav } from '../context/NavContext'
import { useLocale } from '../context/LocaleContext'

function timeAgo(dateString) {
  if (!dateString) return 'Just now'
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const STATUS_ICONS = {
  placed: CheckCircle2,
  pending: Clock,
  processing: Clock,
  packed: Package,
  dispatched: Truck,
  out_for_delivery: Truck,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
}

const STATUS_COLORS = {
  placed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  processing: 'bg-amber-100 text-amber-700 border-amber-200',
  packed: 'bg-orange-100 text-orange-700 border-orange-200',
  dispatched: 'bg-blue-100 text-blue-700 border-blue-200',
  out_for_delivery: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  shipped: 'bg-blue-100 text-blue-700 border-blue-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export default function CustomerNotificationBell() {
  const {
    customerNotifications,
    customerUnreadCount,
    markCustomerNotificationAsRead,
    markAllCustomerNotificationsAsRead,
    clearAllCustomerNotifications,
  } = useNotifications()
  const { navigate } = useNav()
  const { formatPrice } = useLocale()

  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleSelectNotification(item) {
    markCustomerNotificationAsRead(item.id || item._id)
    setOpen(false)
    if (item.orderRef) {
      navigate('track', { ref: item.orderRef })
    } else {
      navigate('orders')
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-full transition-colors flex items-center justify-center ${
          open
            ? 'text-brand bg-cream'
            : 'text-ink hover:text-brand hover:bg-cream/60'
        }`}
        title="Order Updates & Notifications"
        aria-label="Order Notifications"
      >
        <Bell size={18} className={customerUnreadCount > 0 ? 'animate-bounce text-brand' : ''} />

        {/* Unread Counter Badge */}
        {customerUnreadCount > 0 && (
          <span className="absolute 0 top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-brand text-white text-[9px] font-black flex items-center justify-center shadow-xs border border-white">
            {customerUnreadCount > 9 ? '9+' : customerUnreadCount}
          </span>
        )}
      </button>

      {/* Flyout Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] bg-white rounded-2xl border border-line shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 px-4 bg-cream/50 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
                <Bell size={14} />
              </span>
              <div>
                <h4 className="text-ink font-bold text-xs">Order Updates</h4>
                <p className="text-[10px] text-muted">Real-time status tracking</p>
              </div>
            </div>

            {customerNotifications.length > 0 && (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={markAllCustomerNotificationsAsRead}
                  className="text-[11px] font-bold text-brand hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={13} /> Mark read
                </button>
                <span className="text-muted/40 text-xs">•</span>
                <button
                  onClick={clearAllCustomerNotifications}
                  className="text-[11px] font-bold text-muted hover:text-red-600 flex items-center gap-1 transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 size={12} /> Clear
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-line/60">
            {customerNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-cream mx-auto flex items-center justify-center text-muted">
                  <ShoppingBag size={18} />
                </div>
                <p className="text-xs font-bold text-ink">No notifications yet</p>
                <p className="text-[11px] text-muted">
                  Live updates about your orders and shipments will appear here.
                </p>
              </div>
            ) : (
              customerNotifications.slice(0, 15).map((item) => {
                const IconComponent = STATUS_ICONS[item.status] || STATUS_ICONS.processing
                const colorClass = STATUS_COLORS[item.status] || STATUS_COLORS.processing
                const isUnread = !item.read

                return (
                  <button
                    key={item.id || item._id}
                    onClick={() => handleSelectNotification(item)}
                    className={`w-full p-3.5 text-left hover:bg-cream/40 transition-colors flex items-start gap-3 relative ${
                      isUnread ? 'bg-orange-50/30' : ''
                    }`}
                  >
                    {/* Unread Left Border Dot */}
                    {isUnread && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand" />
                    )}

                    {/* Status Icon */}
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${colorClass}`}>
                      <IconComponent size={16} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-ink truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-muted shrink-0 font-medium">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted leading-tight line-clamp-2">
                        {item.message}
                      </p>

                      {item.orderRef && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-mono font-bold text-ink bg-cream px-1.5 py-0.5 rounded border border-line/80">
                            #{item.orderRef}
                          </span>
                          {item.total > 0 && (
                            <span className="text-[10px] font-bold text-brand">
                              {formatPrice(item.total)}
                            </span>
                          )}
                          <span className="text-[10px] text-brand font-semibold ml-auto flex items-center gap-0.5">
                            Track <ArrowRight size={10} />
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {customerNotifications.length > 0 && (
            <div className="p-2.5 bg-cream/40 border-t border-line text-center">
              <button
                onClick={() => {
                  setOpen(false)
                  navigate('orders')
                }}
                className="text-xs font-bold text-brand hover:underline"
              >
                View All My Orders →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
