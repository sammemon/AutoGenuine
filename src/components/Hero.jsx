import { ShieldCheck, ArrowRight, ScanLine, Star } from 'lucide-react'
import VehicleFinder from './VehicleFinder'
import { useNav } from '../context/NavContext'

const stats = [
  { value: '4,200+', label: 'Genuine Parts' },
  { value: 'Same-Day', label: 'Lagos Delivery' },
  { value: '30-Day', label: 'Returns' },
]

export default function Hero() {
  const { navigate } = useNav()

  return (
    <section className="relative bg-ink overflow-hidden">
      {/* Orange geometric background shape, right side only */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[46%] hidden md:block">
        <svg viewBox="0 0 600 760" preserveAspectRatio="none" className="w-full h-full">
          <polygon points="230,0 380,0 180,760 20,760" fill="#F2650D" />
        </svg>
      </div>

      <div className="container-content relative px-6 pt-16 pb-14 grid md:grid-cols-2 gap-10 items-center">
        {/* Left column */}
        <div>
          <span className="inline-flex items-center gap-2 border border-brand text-brand text-[11px] font-bold tracking-widest px-3 py-1.5 rounded-full">
            <ShieldCheck size={13} /> 100% GENUINE &amp; OEM CERTIFIED
          </span>

          <h1 className="mt-6 text-white font-black text-3xl sm:text-4xl md:text-[2.75rem] leading-[1.1] md:leading-[1.08] tracking-tight uppercase">
            The right part.<br />
            <span className="text-brand">Verified</span> for your car.<br />
            Delivered <span className="text-brand">same-<br />day</span> in Lagos.
          </h1>

          <p className="mt-5 max-w-md text-white/60 text-[15px] leading-relaxed">
            Search by VIN, vehicle, or part number. Every listing is checked against your car's exact fitment before you pay — so it fits the first time.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button onClick={() => navigate('vehicles')} className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 transition-colors text-white text-xs font-bold tracking-widest px-6 h-12 rounded-md">
              SHOP BY VEHICLE <ArrowRight size={15} />
            </button>
            <a href="#vin" className="inline-flex items-center gap-2 border border-white/30 hover:border-white transition-colors text-white text-xs font-bold tracking-widest px-6 h-12 rounded-md">
              <ScanLine size={15} /> CHECK BY VIN
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 sm:gap-10">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-brand font-black text-xl">{s.value}</p>
                <p className="text-white/50 text-[11px] font-semibold tracking-wide uppercase mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: vehicle finder card + trust badge */}
        <div className="relative flex flex-col items-center md:items-end">
          <VehicleFinder />
          <div className="mt-5 inline-flex items-center gap-2 bg-ink/90 border border-white/10 rounded-md px-4 py-2 text-white text-[12px] font-semibold">
            <span className="uppercase tracking-wide text-white/60 text-[10px] mr-1">Trusted by</span>
            <span className="flex text-brand">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
              ))}
            </span>
            2,400+ drivers
          </div>
        </div>
      </div>
    </section>
  )
}
