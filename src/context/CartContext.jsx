import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { cart as cartAPI, orders as ordersAPI } from '../services/api'

const CartContext = createContext(null)
const CART_STORAGE_KEY = 'autogenuine_guest_cart'
const USER_CART_KEY = 'autogenuine_user_cart'

function getInitialCart() {
  try {
    const token = localStorage.getItem('autogenuine_token')
    if (token) {
      const cached = localStorage.getItem(USER_CART_KEY)
      if (cached) return JSON.parse(cached)
    } else {
      const guest = localStorage.getItem(CART_STORAGE_KEY)
      if (guest) return JSON.parse(guest)
    }
  } catch {
    /* ignore parse errors */
  }
  return []
}

export function CartProvider({ children }) {
  const { isAuthed, user, loading: authLoading } = useAuth()
  const [items, setItems] = useState(() => getInitialCart())
  const [isOpen, setIsOpen] = useState(false)

  // Fetch fresh cart from server whenever authenticated user or token is active
  useEffect(() => {
    let cancelled = false
    const token = localStorage.getItem('autogenuine_token')

    if (token) {
      cartAPI.get()
        .then((data) => {
          if (!cancelled) {
            const serverItems = data.items || []
            setItems(serverItems)
            try {
              localStorage.setItem(USER_CART_KEY, JSON.stringify(serverItems))
            } catch {
              /* ignore */
            }
          }
        })
        .catch(() => {
          if (!cancelled && !authLoading && !isAuthed) {
            setItems([])
            localStorage.removeItem(USER_CART_KEY)
          }
        })
    } else if (!authLoading && !isAuthed) {
      // Guest: load from guest localStorage
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY)
        setItems(raw ? JSON.parse(raw) : [])
      } catch {
        setItems([])
      }
    }
    return () => {
      cancelled = true
    }
  }, [isAuthed, user?._id, authLoading])

  // Sync state changes to local storage cache for instant reload hydration
  useEffect(() => {
    try {
      if (isAuthed || localStorage.getItem('autogenuine_token')) {
        localStorage.setItem(USER_CART_KEY, JSON.stringify(items))
      } else if (!authLoading) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      }
    } catch {
      /* ignore storage errors */
    }
  }, [items, isAuthed, authLoading])

  const addItem = useCallback(async (product) => {
    if (isAuthed) {
      // Let errors propagate so the caller can show a failure toast instead of a false success.
      const data = await cartAPI.add({ partSlug: product.id, qty: 1 })
      setItems(data.items || [])
    } else {
      // Guest: local only
      setItems((prev) => {
        const existing = prev.find((i) => i.id === product.id)
        if (existing) {
          return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
        }
        return [...prev, { ...product, qty: 1 }]
      })
    }
  }, [isAuthed])

  const removeItem = useCallback(async (id) => {
    if (isAuthed) {
      try {
        const data = await cartAPI.remove(id)
        setItems(data.items || [])
      } catch (err) {
        console.error('Remove from cart failed:', err)
      }
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id))
    }
  }, [isAuthed])

  const updateQty = useCallback(async (id, qty) => {
    if (isAuthed) {
      try {
        const data = await cartAPI.update(id, { qty })
        setItems(data.items || [])
      } catch (err) {
        console.error('Update cart failed:', err)
      }
    } else {
      if (qty < 1) return setItems((prev) => prev.filter((i) => i.id !== id))
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)))
    }
  }, [isAuthed])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const clearCart = useCallback(async () => {
    if (isAuthed) {
      try {
        await cartAPI.clear()
      } catch (err) {
        console.error('Clear cart failed:', err)
      }
    }
    setItems([])
  }, [isAuthed])

  // Place an order from the current cart. Authed users get a persisted order;
  // guests just have their local cart cleared (no server order without an account).
  const checkout = useCallback(async (checkoutData = {}) => {
    if (isAuthed) {
      const order = await ordersAPI.create(checkoutData)
      setItems([]) // Server clears the cart as part of order creation
      return order
    }
    setItems([])
    return null
  }, [isAuthed])

  // Reorder / Restore multiple items into cart from a previous or cancelled order
  const addBulkItems = useCallback(async (orderItems = []) => {
    if (!orderItems || orderItems.length === 0) return

    if (isAuthed) {
      try {
        let lastData = null
        for (const item of orderItems) {
          const slug = item.partSlug || item.id || item.slug || item._id
          const qty = item.qty || item.quantity || 1
          if (slug) {
            lastData = await cartAPI.add({ partSlug: slug, qty })
          }
        }
        if (lastData?.items) {
          setItems(lastData.items)
        }
      } catch (err) {
        console.warn('Bulk cart add fallback:', err.message)
      }
    } else {
      setItems((prev) => {
        let updated = [...prev]
        for (const item of orderItems) {
          const id = item.partSlug || item.id || item.slug || item._id
          const qty = item.qty || item.quantity || 1
          const existing = updated.find((i) => i.id === id)
          if (existing) {
            updated = updated.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i))
          } else {
            updated.push({
              id,
              name: item.name,
              price: item.price,
              image: item.image,
              qty,
            })
          }
        }
        return updated
      })
    }
    setIsOpen(true)
  }, [isAuthed])

  const count = useMemo(() => items.reduce((sum, i) => sum + (i.qty || 1), 0), [items])
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (i.qty || 1) * (i.price || 0), 0), [items])

  const value = useMemo(() => ({
    items,
    addItem,
    addBulkItems,
    removeItem,
    updateQty,
    clearCart,
    checkout,
    count,
    subtotal,
    isOpen,
    open,
    close,
  }), [items, addItem, addBulkItems, removeItem, updateQty, clearCart, checkout, count, subtotal, isOpen, open, close])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
