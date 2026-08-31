import { Search, ShieldCheck, Lock, PackageCheck, ArrowRight } from 'lucide-react'

const steps = [
  { n: '01', icon: Search, title: 'Find your part', desc: 'Search by VIN, choose your vehicle, or type a part number.' },
  { n: '02', icon: ShieldCheck, title: 'Verify fitment', desc: 'We match against NHTSA so you only see parts that fit your car.' },
  { n: '03', icon: Lock, title: 'Pay securely', desc: 'Paystack checkout — card, bank transfer or USSD. No hidden fees.' },
  { n: '04', icon: PackageCheck, title: 'Get it fast', desc: 'Same-day in Lagos. Nationwide shipping in 2–4 working days.' },
]

export default function HowItWorks() {
  return (
    <section className="bg-white py-16">
      <div className="container-content px-6">
        <p className="text-brand text-[11px] font-bold tracking-widest mb-3">HOW IT WORKS</p>
        <h2 className="text-ink font-black text-3xl md:text-[2.25rem] leading-tight tracking-tight uppercase">
          From part search<br />to your driveway
        </h2>
        <p className="mt-3 max-w-lg text-muted text-[15px] leading-relaxed">
          Four steps between you and the exact part your car needs.
        </p>

        <div className="mt-9 grid md:grid-cols-4 gap-6 relative">
          {steps.map((s, i) => (
            <div key={s.n} className="relative bg-cream rounded-md border-t-[3px] border-brand p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <span className="w-10 h-10 rounded-md bg-ink flex items-center justify-center text-brand">
                  <s.icon size={18} />
                </span>
                <span className="text-brand/25 font-black text-3xl leading-none">{s.n}</span>
              </div>
              <p className="font-bold text-ink text-[15px] mt-5">{s.title}</p>
              <p className="text-muted text-[13px] leading-relaxed mt-1.5">{s.desc}</p>

              {i < steps.length - 1 && (
                <ArrowRight
                  size={18}
                  className="hidden md:block text-brand absolute top-1/2 -right-3 -translate-y-1/2 z-10"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
