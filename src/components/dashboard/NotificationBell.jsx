import { useState, useRef, useEffect } from 'react'
import { Bell, Check, Volume2, VolumeX, ShoppingBag, Clock, Sparkles, X } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { useLocale } from '../../context/LocaleContext'

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

export default function NotificationBell({ onNavigateOrder }) {
  const {
    notifications,
    unreadCount,
    connected,
    soundEnabled,
    setSoundEnabled,
    markAsRead,
    markAllAsRead,
    playChime,
  } = useNotifications()
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

  function handleSelectNotification(n) {
    markAsRead(n._id)
    setOpen(false)
    if (onNavigateOrder) {
      onNavigateOrder(n.orderId || n.orderRef)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
          open
            ? 'bg-orange-50 border-orange-300 text-orange-600 shadow-sm'
            : 'bg-white border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-300 shadow-2xs'
        }`}
        title="Real-Time Order Notifications"
        aria-label="Order Notifications"
      >
        <Bell size={16} className={unreadCount > 0 ? 'animate-bounce text-orange-600' : ''} />

        {/* Live Socket Status Dot */}
        <span
          className={`absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white ${
            connected ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-slate-300'
          }`}
          title={connected ? 'Socket.io Connected Live' : 'Connecting...'}
        />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm border border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Panel */}
      {open && (
        <div className="absolute right-0 mt-2.5 w-[360px] sm:w-[400px] bg-white rounded-2xl border border-slate-200/90 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-orange-100/70 text-orange-600 flex items-center justify-center font-bold text-xs">
                <Bell size={14} />
              </span>
              <div>
                <h4 className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                  Live Notifications
                  {connected && (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                    </span>
                  )}
                </h4>
                <p className="text-slate-500 text-[10px]">
                  {unreadCount > 0 ? `${unreadCount} unread order alerts` : 'All alerts up to date'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs transition-colors ${
                  soundEnabled
                    ? 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
                title={soundEnabled ? 'Chime Enabled (Click to mute)' : 'Chime Muted (Click to enable)'}
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-orange-600 hover:bg-orange-50 border border-orange-200/60 transition-colors"
                >
                  <Check size={12} /> Mark all
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Sparkles size={20} />
                </div>
                <p className="text-xs font-bold text-slate-700">No Notifications Yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When customers place new orders, you'll receive real-time alerts right here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isNewOrder = n.type === 'NEW_ORDER'
                return (
                  <div
                    key={n._id}
                    onClick={() => handleSelectNotification(n)}
                    className={`p-3.5 px-4 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                      !n.read
                        ? 'bg-orange-50/40 hover:bg-orange-50/70'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Unread Indicator Bar */}
                    {!n.read && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 bg-orange-500 rounded-r" />
                    )}

                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isNewOrder
                          ? 'bg-orange-100 text-orange-700 border-orange-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}
                    >
                      <ShoppingBag size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-black text-slate-900 text-xs truncate">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                          <Clock size={10} /> {timeAgo(n.createdAt)}
                        </span>
                      </div>

                      <p className="text-slate-600 text-xs line-clamp-1">{n.message}</p>

                      {n.total && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-black border border-slate-200">
                            {formatPrice(n.total)}
                          </span>
                          {n.customerName && (
                            <span className="text-[10px] text-slate-500 truncate">
                              • Customer: {n.customerName}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 text-[10px]">
              Socket.io Live Dispatch Ready
            </span>
            <button
              onClick={() => {
                playChime()
              }}
              className="text-orange-600 hover:underline font-bold text-[10px] flex items-center gap-1"
            >
              Test Chime 🔊
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
