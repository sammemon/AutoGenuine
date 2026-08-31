import { ShieldCheck, Lock, RotateCcw, Truck } from 'lucide-react'

const features = [
  { icon: ShieldCheck, title: '100% GENUINE & OEM', sub: 'Every part certified' },
  { icon: Lock, title: 'SECURE PAYSTACK CHECKOUT', sub: 'Card, transfer, USSD' },
  { icon: RotateCcw, title: '30-DAY RETURNS', sub: 'Self-service, hassle-free' },
  { icon: Truck, title: 'SAME-DAY LAGOS DELIVERY', sub: 'Nationwide shipping too' },
]

export default function FeatureBar() {
  return (
    <div className="bg-white border-b border-line">
      <div className="container-content grid grid-cols-2 md:grid-cols-4 divide-x divide-line px-6">
        {features.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="group flex items-center gap-3 py-6 px-5 transition-colors duration-300 hover:bg-cream/60">
            <Icon size={20} className="text-brand shrink-0 transition-transform duration-300 group-hover:scale-110" />
            <div className="leading-tight">
              <p className="text-[12px] font-bold text-ink tracking-wide">{title}</p>
              <p className="text-[12px] text-muted">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
