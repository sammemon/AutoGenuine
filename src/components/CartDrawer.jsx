import { useState } from 'react'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useNav } from '../context/NavContext'
import { useToast } from '../context/ToastContext'
import { useLocale } from '../context/LocaleContext'
import PaymentGatewayModal from './PaymentGatewayModal'

export default function CartDrawer() {
  const { items, isOpen, close, updateQty, removeItem, subtotal, checkout } = useCart()
  const { isAuthed } = useAuth()
  const { navigate } = useNav()
  const { showToast } = useToast()
  const { formatPrice } = useLocale()
  const [paymentOpen, setPaymentOpen] = useState(false)

  function handleCheckout() {
    if (!isAuthed) {
      close()
      showToast('Please sign in to complete your order')
      navigate('login')
      return
    }
    close()
    setPaymentOpen(true)
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <div className="absolute inset-0 bg-ink/60" style={{ animation: 'overlayIn 0.15s ease-out' }} onClick={close} />

          <div
            className="relative w-full max-w-[420px] h-full bg-white flex flex-col shadow-2xl z-10"
            style={{ animation: 'slideInRight 0.22s ease-out' }}
          >
        <div className="flex items-center justify-between px-6 h-16 border-b border-line shrink-0">
          <h3 className="font-black text-lg text-ink flex items-center gap-2">
            <ShoppingBag size={18} className="text-brand" /> Your Cart
          </h3>
          <button onClick={close} aria-label="Close cart" className="w-9 h-9 rounded-md flex items-center justify-center text-muted hover:bg-cream hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <ShoppingBag size={36} className="text-line" />
              <p className="mt-4 text-ink font-semibold">Your cart is empty</p>
              <p className="text-muted text-[13px] mt-1">Add genuine parts from the catalog to get started.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-md bg-cream flex items-center justify-center shrink-0">
                    <ShoppingBag size={20} className="text-brand/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink text-[14px] leading-snug truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-[13px]">{formatPrice(item.price)} each</span>
                      {item.originalPrice > item.price && (
                        <span className="line-through text-red-500 font-extrabold text-xs bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                          {formatPrice(item.originalPrice)}
                        </span>
                      )}
                      {(item.originalPrice > item.price || item.discount > 0) && (
                        <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 shadow-2xs animate-pulse">
                          -{item.discount || Math.round((1 - item.price / item.originalPrice) * 100)}% OFF
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center border border-line rounded-md">
                        <button
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center text-ink hover:text-brand transition-colors"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-7 text-center text-[13px] font-semibold text-ink">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center text-ink hover:text-brand transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-base">{formatPrice(item.price * item.qty)}</p>
                        {item.originalPrice > item.price && (
                          <p className="line-through text-red-500 font-bold text-xs">{formatPrice(item.originalPrice * item.qty)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="text-muted hover:text-red-500 transition-colors shrink-0 mt-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line px-6 py-5 shrink-0">
            {(() => {
              const totalSavings = items.reduce((sum, item) => {
                const orig = item.originalPrice && item.originalPrice > item.price ? item.originalPrice : item.price
                return sum + ((orig - item.price) * item.qty)
              }, 0)
              return totalSavings > 0 ? (
                <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded text-center">
                  <span className="text-[11px] font-black text-emerald-800">
                    🎉 Promotional Savings: You save {formatPrice(totalSavings)} on this order!
                  </span>
                </div>
              ) : null
            })()}
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted text-[13px] font-semibold">Subtotal</span>
              <span className="font-black text-ink text-lg">{formatPrice(subtotal)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full h-12 rounded-md bg-brand hover:bg-brand-600 transition-colors text-white text-xs font-bold tracking-widest"
            >
              PROCEED TO SECURE CHECKOUT
            </button>
          </div>
        )}
          </div>
        </div>
      )}

      <PaymentGatewayModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        items={items}
        subtotal={subtotal}
        onSuccess={(paymentData) => checkout(paymentData)}
        onNavigateOrders={() => {
          close()
          navigate('orders')
        }}
      />
    </>
  )
}
