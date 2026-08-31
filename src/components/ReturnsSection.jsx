import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import PolicyModal from './PolicyModal'

const steps = [
  { n: '01', title: 'REQUEST FROM MAIL', desc: 'Reach out us through mail.' },
  { n: '02', title: 'TELL US WHY', desc: 'Wrong part, defective, or changed your mind.' },
  { n: '03', title: 'SHIP IT BACK', desc: 'Free return pickup in Lagos. Prepaid label nationwide.' },
  { n: '04', title: 'GET REFUNDED', desc: 'Refund in your back account.' },
]

export default function ReturnsSection() {
  const [policyOpen, setPolicyOpen] = useState(false)

  return (
    <section id="returns" className="bg-cream py-16">
      <div className="container-content px-6 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-brand text-[11px] font-bold tracking-widest mb-3">OUR PROMISE</p>
          <h2 className="text-ink font-black text-3xl md:text-[2.15rem] leading-tight tracking-tight uppercase">
            30-day returns.<br />No awkward questions.
          </h2>
          <p className="mt-4 max-w-md text-muted text-[15px] leading-relaxed">
            If a part doesn't fit or isn't what you expected, request a return from your account within 30 days. Unused parts in original packaging qualify — full refund via Paystack.
          </p>
          <button
            onClick={() => setPolicyOpen(true)}
            className="mt-7 inline-flex items-center gap-2 bg-ink hover:bg-ink-soft transition-colors text-white text-xs font-bold tracking-widest px-6 h-12 rounded-md"
          >
            READ THE FULL POLICY <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="bg-white rounded-md p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg">
              <p className="text-brand font-black text-lg">{s.n}</p>
              <p className="font-bold text-ink text-[13px] tracking-wide mt-2">{s.title}</p>
              <p className="text-muted text-[12px] leading-relaxed mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <PolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
    </section>
  )
}
