import { Lock, CreditCard, Landmark, Smartphone, Truck, Clock, MapPin } from 'lucide-react'

const paymentMethods = [
  { icon: CreditCard, label: 'CARD' },
  { icon: Landmark, label: 'BANK TRANSFER' },
  { icon: Smartphone, label: 'USSD' },
]

const deliveryOptions = [
  { icon: Clock, title: 'SAME-DAY · LAGOS', desc: 'Order before 12pm for same-day dispatch.' },
  { icon: MapPin, title: 'NATIONWIDE · 2–4 DAYS', desc: 'Tracked shipping to all 36 states.' },
]

export default function PaymentSection() {
  return (
    <section className="grid md:grid-cols-2">
      {/* Payment */}
      <div className="bg-cream px-6 md:px-14 py-16">
        <div className="max-w-md">
          <span className="w-10 h-10 rounded-md bg-brand flex items-center justify-center text-white mb-5">
            <Lock size={18} />
          </span>
          <h2 className="text-ink font-black text-2xl md:text-[1.9rem] leading-tight tracking-tight uppercase">
            Secure Paystack checkout
          </h2>
          <p className="mt-3 text-muted text-[15px] leading-relaxed">
            Pay the way that suits you. Every transaction is encrypted and processed through Paystack, Nigeria's most trusted payment gateway.
          </p>

          <div className="mt-7 grid grid-cols-3 gap-3">
            {paymentMethods.map(({ icon: Icon, label }) => (
              <div key={label} className="bg-white rounded-md py-4 flex flex-col items-center gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                <Icon size={18} className="text-ink" />
                <span className="text-[11px] font-bold tracking-wide text-ink text-center">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-6 text-muted text-[12px] font-semibold tracking-wide">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Verve</span>
            <span>Paystack</span>
          </div>
        </div>
      </div>

      {/* Delivery */}
      <div className="bg-ink px-6 md:px-14 py-16">
        <div className="max-w-md">
          <span className="w-10 h-10 rounded-md bg-brand flex items-center justify-center text-white mb-5">
            <Truck size={18} />
          </span>
          <h2 className="text-white font-black text-2xl md:text-[1.9rem] leading-tight tracking-tight uppercase">
            Delivery that actually delivers
          </h2>
          <p className="mt-3 text-white/60 text-[15px] leading-relaxed">
            Pick the speed that fits your job — from urgent workshop repairs to routine restocking anywhere in Nigeria.
          </p>

          <div className="mt-7 space-y-3">
            {deliveryOptions.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4 bg-white/5 rounded-md px-5 py-4 transition-colors duration-300 hover:bg-white/10">
                <Icon size={18} className="text-brand shrink-0" />
                <div>
                  <p className="text-white font-bold text-[13px] tracking-wide">{title}</p>
                  <p className="text-white/50 text-[12px] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
