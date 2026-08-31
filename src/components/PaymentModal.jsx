import { useState } from 'react'
import { CreditCard, MessageCircle, CheckCircle2 } from 'lucide-react'
import Modal from './Modal'
import { useLocale } from '../context/LocaleContext'

export default function PaymentModal({ open, onClose, items, subtotal, onSuccess }) {
  const { formatPrice } = useLocale()
  const [status, setStatus] = useState('choose') // choose | processing | success | error
  const [error, setError] = useState('')
  // Snapshot the amount at pay time — checkout() empties the cart, dropping subtotal to 0
  // before the success screen renders, so the live subtotal can't be trusted there.
  const [paidAmount, setPaidAmount] = useState(0)

  async function handlePaystack() {
    setStatus('processing')
    setError('')
    setPaidAmount(subtotal)
    // Simulate the Paystack payment gateway, then persist the order.
    await new Promise((resolve) => setTimeout(resolve, 1400))
    try {
      await onSuccess?.()
      setStatus('success')
    } catch (err) {
      setError(err.message || 'Could not place your order. Please try again.')
      setStatus('error')
    }
  }

  function handleWhatsappOrder() {
    const lines = items.map((i) => `• ${i.name} x${i.qty} — ${formatPrice(i.price * i.qty)}`).join('\n')
    const message = `Hi AutoGenuine, I'd like to order:\n${lines}\n\nTotal: ${formatPrice(subtotal)}`
    window.open(`https://wa.me/2348123456799?text=${encodeURIComponent(message)}`, '_blank')
    onClose()
  }

  function handleClose() {
    setStatus('choose')
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="p-8">
        {status === 'choose' && (
          <>
            <h3 className="font-black text-xl text-ink">Choose how to pay</h3>
            <p className="mt-1.5 text-muted text-[14px]">
              Total due: <span className="font-bold text-ink">{formatPrice(subtotal)}</span>
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handlePaystack}
                className="flex items-center gap-3 h-14 px-5 rounded-md border border-line hover:border-brand transition-colors text-left"
              >
                <span className="w-9 h-9 rounded-md bg-brand flex items-center justify-center text-white shrink-0">
                  <CreditCard size={16} />
                </span>
                <span>
                  <span className="block font-bold text-ink text-[14px]">Pay with Paystack</span>
                  <span className="block text-muted text-[12px]">Card, bank transfer, or USSD</span>
                </span>
              </button>

              <button
                onClick={handleWhatsappOrder}
                className="flex items-center gap-3 h-14 px-5 rounded-md border border-line hover:border-brand transition-colors text-left"
              >
                <span className="w-9 h-9 rounded-md bg-ink flex items-center justify-center text-white shrink-0">
                  <MessageCircle size={16} />
                </span>
                <span>
                  <span className="block font-bold text-ink text-[14px]">Order via WhatsApp</span>
                  <span className="block text-muted text-[12px]">Send your cart to our team directly</span>
                </span>
              </button>
            </div>
          </>
        )}

        {status === 'processing' && (
          <div className="py-8 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-2 border-brand border-t-transparent animate-spin" />
            <p className="mt-4 text-ink font-semibold text-[14px]">Processing payment…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 text-center">
            <span className="inline-flex w-14 h-14 rounded-full bg-red-50 items-center justify-center text-red-600 mx-auto">
              <CreditCard size={28} />
            </span>
            <h3 className="mt-4 font-black text-xl text-ink">Payment failed</h3>
            <p className="mt-1.5 text-muted text-[14px]">{error}</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStatus('choose')}
                className="flex-1 h-11 px-6 rounded-md bg-ink text-white text-xs font-bold tracking-widest hover:bg-ink-soft transition-colors"
              >
                TRY AGAIN
              </button>
              <button
                onClick={handleClose}
                className="flex-1 h-11 px-6 rounded-md border border-line text-ink text-xs font-bold tracking-widest hover:border-brand transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 text-center">
            <span className="inline-flex w-14 h-14 rounded-full bg-brand/10 items-center justify-center text-brand mx-auto">
              <CheckCircle2 size={28} />
            </span>
            <h3 className="mt-4 font-black text-xl text-ink">Payment successful</h3>
            <p className="mt-1.5 text-muted text-[14px]">
              We've received your order for {formatPrice(paidAmount)}. A confirmation will be sent to your phone.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 h-11 px-6 rounded-md bg-ink text-white text-xs font-bold tracking-widest hover:bg-ink-soft transition-colors"
            >
              DONE
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
