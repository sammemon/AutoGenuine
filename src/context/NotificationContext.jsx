import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { isStaff } from '../auth/permissions'
import { admin as adminAPI, orders as ordersAPI } from '../services/api'
import { useToast } from './ToastContext'

const NotificationContext = createContext(null)

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:5000'

/**
 * High-fidelity executive audio chime using the Web Audio API.
 * Synthesizes a crisp, luxury two-tone chime without external MP3 files.
 */
function playExecutiveChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return

    const ctx = new AudioContext()
    const now = ctx.currentTime

    // First tone (G5 - 784Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(783.99, now)
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.04)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.45)

    // Second tone (C6 - 1046.5Hz) - Higher melodic ring
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1046.5, now + 0.12)
    gain2.gain.setValueAtTime(0, now + 0.12)
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.16)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.9)
  } catch (err) {
    console.warn('Audio chime play blocked:', err.message)
  }
}

// Check if an order belongs to the currently authenticated user
function isOrderForUser(order, currentUser) {
  if (!currentUser) return false
  const uid = String(currentUser._id || currentUser.id || '')
  const orderUserId = String(order.user?._id || order.user || order.userId || '')
  if (uid && orderUserId && uid === orderUserId) return true

  if (currentUser.email) {
    const userEmail = currentUser.email.toLowerCase().trim()
    const orderEmail = (order.customerEmail || order.user?.email || '').toLowerCase().trim()
    if (userEmail && orderEmail && userEmail === orderEmail) return true
  }

  if (currentUser.phone) {
    const userPhone = String(currentUser.phone).replace(/\D/g, '')
    const orderPhone = String(order.customerPhone || '').replace(/\D/g, '')
    if (userPhone && orderPhone && userPhone === orderPhone) return true
  }

  return false
}

// Human-friendly title and message for each customer status update
const CUSTOMER_STATUS_MESSAGES = {
  pending: {
    title: 'Order Placed — Pending Approval',
    message: 'Your AutoGenuine order has been placed & paid. It is currently awaiting store owner / admin approval.',
  },
  placed: {
    title: 'Order Placed — Pending Approval',
    message: 'Your AutoGenuine order has been placed & paid. It is currently awaiting store owner / admin approval.',
  },
  processing: {
    title: 'Order Approved & Processing',
    message: 'Great news! Your order has been approved by our store team and parts are being packed.',
  },
  packed: {
    title: 'Order Packed & Ready for Dispatch',
    message: 'Your parts have been inspected, packed in secure casing, and marked ready for courier handover.',
  },
  dispatched: {
    title: 'Order Dispatched from Warehouse',
    message: 'Your package has been dispatched from our central warehouse and handed to courier.',
  },
  out_for_delivery: {
    title: 'Out for Delivery Today',
    message: 'Your package is on the way! The courier agent will arrive at your delivery address soon.',
  },
  shipped: {
    title: 'Order in Transit',
    message: 'Your package is in transit with the courier service.',
  },
  delivered: {
    title: 'Order Delivered Successfully',
    message: 'Your AutoGenuine parcel has been safely delivered. Thank you for shopping genuine OEM!',
  },
  cancelled: {
    title: 'Order Cancelled & Refunded',
    message: 'Your order was cancelled. 100% payment has been refunded to your original payment method.',
  },
}

export function NotificationProvider({ children }) {
  const { user, isAuthed } = useAuth()
  const { showToast } = useToast()
  const socketRef = useRef(null)

  // Staff notifications state
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [connected, setConnected] = useState(false)
  const [livePopupOrder, setLivePopupOrder] = useState(null)
  const [livePopupEvent, setLivePopupEvent] = useState(null)

  // Customer notifications state (strictly for the authenticated user)
  const [customerNotifications, setCustomerNotifications] = useState(() => {
    if (!isAuthed || !user?._id) return []
    try {
      const storageKey = `autogenuine_user_notifs_${user._id}`
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [customerUnreadCount, setCustomerUnreadCount] = useState(0)
  const [customerLiveAlert, setCustomerLiveAlert] = useState(null)

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('autogenuine_notification_sound')
    return saved !== null ? saved === 'true' : true
  })

  const staffUser = isAuthed && isStaff(user)

  // Reload customer notifications when active user changes
  useEffect(() => {
    if (!isAuthed || !user?._id) {
      setCustomerNotifications([])
      setCustomerUnreadCount(0)
      return
    }
    try {
      const storageKey = `autogenuine_user_notifs_${user._id}`
      const saved = localStorage.getItem(storageKey)
      const list = saved ? JSON.parse(saved) : []
      setCustomerNotifications(list)
      setCustomerUnreadCount(list.filter((n) => !n.read).length)
    } catch {
      setCustomerNotifications([])
      setCustomerUnreadCount(0)
    }

    // Auto-fetch customer orders to ensure bell always shows their orders and live statuses
    if (!staffUser) {
      ordersAPI.list()
        .then((res) => {
          const orderList = Array.isArray(res) ? res : (res?.orders || [])
          if (orderList.length > 0) {
            setCustomerNotifications((prev) => {
              const existingIds = new Set(prev.map((n) => String(n.orderId || n.id)))
              const fromOrders = orderList.slice(0, 10).map((o) => {
                const oRef = o.orderRef || String(o._id || '').slice(-6).toUpperCase()
                const statusMsg = CUSTOMER_STATUS_MESSAGES[o.status] || {
                  title: `Order Status: ${String(o.status || '').toUpperCase()}`,
                  message: `Order #${oRef} is currently ${o.status}.`,
                }
                return {
                  id: `order-sync-${o._id}`,
                  orderId: o._id,
                  orderRef: oRef,
                  status: o.status,
                  title: statusMsg.title,
                  message: statusMsg.message,
                  total: o.total,
                  read: prev.some((p) => String(p.orderId) === String(o._id) && p.read),
                  createdAt: o.updatedAt || o.createdAt,
                }
              })

              const merged = [...prev]
              for (const fo of fromOrders) {
                if (!existingIds.has(String(fo.orderId))) {
                  merged.push(fo)
                }
              }
              merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              return merged.slice(0, 30)
            })
          }
        })
        .catch(() => {})
    }
  }, [isAuthed, user?._id, staffUser])

  // Sync customer notifications to localStorage whenever changed
  useEffect(() => {
    if (!isAuthed || !user?._id) return
    try {
      const storageKey = `autogenuine_user_notifs_${user._id}`
      localStorage.setItem(storageKey, JSON.stringify(customerNotifications.slice(0, 30)))
      setCustomerUnreadCount(customerNotifications.filter((n) => !n.read).length)
    } catch {}
  }, [customerNotifications, isAuthed, user?._id])

  // Save sound setting preference
  const toggleSound = (val) => {
    setSoundEnabled(val)
    localStorage.setItem('autogenuine_notification_sound', String(val))
    if (val) playExecutiveChime()
  }

  // Fetch initial staff notifications from DB
  const loadNotifications = useCallback(async () => {
    if (!staffUser) return
    try {
      const res = await adminAPI.listNotifications()
      setNotifications(res.notifications || [])
      setUnreadCount(res.unreadCount || 0)
    } catch (err) {
      console.warn('Could not load notification history:', err.message)
    }
  }, [staffUser])

  useEffect(() => {
    if (staffUser) {
      loadNotifications()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [staffUser, loadNotifications])

  // Request browser desktop notification permission
  useEffect(() => {
    if (isAuthed && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [isAuthed])

  // Establish real-time Socket.io connection for all users (staff & customers)
  useEffect(() => {
    const token = localStorage.getItem('autogenuine_token') || ''

    const socket = io(SOCKET_SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    // Listen for notification_created event from centralized Notification Service
    socket.on('notification_created', (notif) => {
      if (staffUser || String(notif.recipient || notif.userId) === String(user?._id)) {
        if (soundEnabled) playExecutiveChime()

        setNotifications((prev) => {
          if (prev.some((n) => String(n._id) === String(notif._id))) return prev
          return [{ ...notif, read: false }, ...prev]
        })
        setUnreadCount((c) => c + 1)
      }
    })

    // Listen for NEW_ORDER event
    socket.on('new_order', (order) => {
      const orderRef = order.orderRef || String(order._id || '').slice(-6).toUpperCase()

      // 1. Staff notifications and live popup
      if (staffUser) {
        if (soundEnabled) playExecutiveChime()

        const newNotif = {
          _id: `live-${Date.now()}`,
          type: 'NEW_ORDER',
          title: `New Order Placed (#${orderRef})`,
          message: `Rs ${Number(order.total || 0).toLocaleString()} by ${order.customerName || 'Customer'}`,
          orderId: order._id,
          orderRef,
          customerName: order.customerName,
          total: order.total,
          paymentMethod: order.paymentMethod,
          read: false,
          createdAt: new Date().toISOString(),
        }

        setNotifications((prev) => [newNotif, ...prev])
        setUnreadCount((c) => c + 1)

        setLivePopupOrder({
          orderId: order._id,
          orderRef,
          customerName: order.customerName || 'Customer',
          customerPhone: order.customerPhone || '',
          city: order.city || 'Storefront',
          total: order.total || 0,
          paymentMethod: order.paymentMethod || 'cash',
          itemsCount: order.items?.length || 1,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      }

      // 2. Customer notification if order belongs to current user
      const isMyOrder = isOrderForUser(order, user)
      if (isMyOrder && !staffUser) {
        if (soundEnabled) playExecutiveChime()

        const custNotif = {
          id: `cust-${Date.now()}`,
          orderId: order._id,
          orderRef,
          status: 'placed',
          title: 'Order Confirmed & Placed',
          message: `Your order #${orderRef} has been confirmed. Total: Rs ${Number(order.total || 0).toLocaleString()}`,
          total: order.total,
          read: false,
          createdAt: new Date().toISOString(),
        }

        setCustomerNotifications((prev) => [custNotif, ...prev])

        setCustomerLiveAlert({
          orderId: order._id,
          orderRef,
          status: 'placed',
          title: '🎉 Order Confirmed Successfully!',
          message: `Your order #${orderRef} is placed and being prepared for inspection.`,
          total: order.total,
          city: order.city,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      }

      // Dispatch global window event for live table updates without reloading
      window.dispatchEvent(new CustomEvent('autogenuine_order_event', { detail: { type: 'NEW_ORDER', order } }))
    })

    // Listen for ORDER_STATUS_UPDATED event
    socket.on('order_status_updated', (order) => {
      console.log('🔄 [Socket.io] Live Order Status Updated:', order)
      const orderRef = order.orderRef || String(order._id || '').slice(-6).toUpperCase()
      const newStatus = order.status || 'updated'

      // 1. Staff handling
      if (staffUser) {
        const updateNotif = {
          _id: `live-update-${Date.now()}`,
          type: 'ORDER_STATUS_UPDATED',
          title: `Order Status Changed (#${orderRef})`,
          message: `Order #${orderRef} changed to ${newStatus.toUpperCase()}`,
          orderId: order._id,
          orderRef,
          customerName: order.customerName,
          total: order.total,
          read: false,
          createdAt: new Date().toISOString(),
        }

        setNotifications((prev) => [updateNotif, ...prev])
        setUnreadCount((c) => c + 1)

        if (soundEnabled && ['cancelled', 'delivered', 'shipped', 'packed', 'dispatched', 'out_for_delivery'].includes(newStatus)) {
          playExecutiveChime()
        }

        setLivePopupEvent({
          type: 'STATUS_UPDATE',
          status: newStatus,
          orderId: order._id,
          orderRef,
          customerName: order.customerName || 'Customer',
          city: order.city || '',
          total: order.total || 0,
          paymentMethod: order.paymentMethod || 'cash',
          cancellationReason: order.cancellationReason || order.cancelReason || '',
          cancelledByName: order.cancelledByName || '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      }

      // 2. Customer handling if order belongs to current user
      const isMyOrder = isOrderForUser(order, user)
      if (isMyOrder && !staffUser) {
        if (soundEnabled) playExecutiveChime()

        const statusInfo = CUSTOMER_STATUS_MESSAGES[newStatus] || {
          title: `Order Status: ${newStatus.toUpperCase()}`,
          message: `Your order #${orderRef} status changed to ${newStatus}.`,
        }

        const custNotif = {
          id: `cust-${Date.now()}`,
          orderId: order._id,
          orderRef,
          status: newStatus,
          title: statusInfo.title,
          message: statusInfo.message,
          total: order.total,
          read: false,
          createdAt: new Date().toISOString(),
        }

        setCustomerNotifications((prev) => [custNotif, ...prev])

        setCustomerLiveAlert({
          orderId: order._id,
          orderRef,
          status: newStatus,
          title: statusInfo.title,
          message: statusInfo.message,
          total: order.total,
          city: order.city,
          cancellationReason: order.cancellationReason || order.cancelReason,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })

        // Desktop web notification
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`AutoGenuine: ${statusInfo.title} (#${orderRef})`, {
              body: statusInfo.message,
              icon: '/favicon.ico',
            })
          } catch {}
        }
      }

      // Dispatch global event for live table update across all pages (MyOrders, TrackOrder, OrdersSection)
      window.dispatchEvent(new CustomEvent('autogenuine_order_event', { detail: { type: 'ORDER_STATUS_UPDATED', order } }))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [staffUser, soundEnabled, showToast, user])

  // Mark staff notification as read
  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
    if (!String(id).startsWith('live-')) {
      try {
        await adminAPI.markNotificationRead(id)
      } catch (err) {
        console.warn('Mark read failed:', err.message)
      }
    }
  }

  // Mark all staff notifications as read
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await adminAPI.markAllNotificationsRead()
    } catch (err) {
      console.warn('Mark all read failed:', err.message)
    }
  }

  // Customer notification operations
  const markCustomerNotificationAsRead = (id) => {
    setCustomerNotifications((prev) =>
      prev.map((n) => ((n.id === id || n._id === id) ? { ...n, read: true } : n))
    )
  }

  const markAllCustomerNotificationsAsRead = () => {
    setCustomerNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearAllCustomerNotifications = () => {
    setCustomerNotifications([])
    setCustomerUnreadCount(0)
    try {
      if (user?._id) {
        localStorage.removeItem(`autogenuine_user_notifs_${user._id}`)
      }
      localStorage.removeItem('autogenuine_guest_notifs')
    } catch {}
  }

  return (
    <NotificationContext.Provider
      value={{
        // Staff
        notifications,
        unreadCount,
        connected,
        soundEnabled,
        setSoundEnabled: toggleSound,
        markAsRead,
        markAllAsRead,
        refreshNotifications: loadNotifications,
        playChime: playExecutiveChime,
        livePopupOrder,
        dismissLivePopupOrder: () => setLivePopupOrder(null),
        livePopupEvent,
        dismissLivePopupEvent: () => setLivePopupEvent(null),

        // Customer
        customerNotifications,
        customerUnreadCount,
        customerLiveAlert,
        dismissCustomerLiveAlert: () => setCustomerLiveAlert(null),
        markCustomerNotificationAsRead,
        markAllCustomerNotificationsAsRead,
        clearAllCustomerNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return ctx
}
