import Modal from './Modal'

export default function PolicyModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg">
      <div className="p-8">
        <p className="text-brand text-[11px] font-bold tracking-widest mb-2">OUR PROMISE</p>
        <h3 className="font-black text-xl text-ink">30-Day Return Policy</h3>

        <div className="mt-5 space-y-4 text-[13px] text-muted leading-relaxed">
          <p>
            Every part sold on AutoGenuine is covered by a 30-day return window from the date of delivery. If a part
            doesn't fit, arrives defective, or you simply change your mind, you can request a return from your account.
          </p>
          <p>
            <span className="font-semibold text-ink">Eligibility:</span> parts must be unused, in their original
            packaging, and free of installation marks. Electrical components must not have been wired in.
          </p>
          <p>
            <span className="font-semibold text-ink">Pickup:</span> free return pickup is available across Lagos.
            For other states, we email a prepaid shipping label.
          </p>
          <p>
            <span className="font-semibold text-ink">Refunds:</span> once we receive and inspect the item, refunds
            are issued to your original Paystack payment method within 3–5 business days.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-7 h-11 px-6 rounded-md bg-ink text-white text-xs font-bold tracking-widest hover:bg-ink-soft transition-colors"
        >
          GOT IT
        </button>
      </div>
    </Modal>
  )
}
