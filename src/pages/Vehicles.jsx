import { ArrowRight, CheckCircle2, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SafeImage from '../components/SafeImage'
import { makes } from '../data/vehicleCatalog'
import { catalog } from '../services/api'
import { useNav } from '../context/NavContext'
import { useToast } from '../context/ToastContext'

export default function Vehicles() {
  const { navigate } = useNav()
  const { showToast } = useToast()

  const [inStockMakes, setInStockMakes] = useState(() => makes.filter((m) => m.inStock))
  // Coming-soon makes aren't seeded in the DB — always sourced from static data.
  const comingSoonMakes = makes.filter((m) => !m.inStock)

  // In-stock makes come from the API; fall back to static in-stock data on failure.
  useEffect(() => {
    catalog.getVehicles()
      .then((data) => {
        const live = Array.isArray(data) ? data.filter((m) => m.inStock) : []
        if (live.length) setInStockMakes(live)
      })
      .catch(() => { /* keep static fallback */ })
  }, [])

  function handleShopModel(make, model) {
    showToast(`Showing parts for ${make} ${model}`)
    navigate('category', { id: 'brakes', vehicleLabel: `${make} ${model}` })
  }

  function handleNotify(make) {
    showToast(`We'll notify you when ${make} parts land.`)
  }

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Header />

      {/* Page hero banner */}
      <div className="relative bg-ink py-14">
        <div className="container-content px-6">
          <p className="text-brand text-[11px] font-bold tracking-widest mb-3">FULL CATALOG</p>
          <h1 className="text-white font-black text-3xl md:text-[2.5rem] leading-tight tracking-tight uppercase max-w-2xl">
            Shop by vehicle
          </h1>
          <p className="mt-3 max-w-xl text-white/60 text-[15px] leading-relaxed">
            Browse every make and model we carry parts for. Toyota is fully in stock today — more brands are on the way.
          </p>
        </div>
      </div>

      {inStockMakes.map((mk) => (
        <section key={mk.make} className="bg-white py-14 border-b border-line">
          <div className="container-content px-6">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="font-black text-ink text-2xl uppercase tracking-tight">{mk.make}</h2>
              <span className="flex items-center gap-1.5 bg-brand/10 text-brand text-[11px] font-bold px-3 py-1 rounded-full">
                <CheckCircle2 size={12} /> In Stock
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mk.models.map((m) => (
                <button
                  key={m.model}
                  onClick={() => handleShopModel(mk.make, m.model)}
                  className="group bg-cream rounded-md overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 text-left"
                >
                  <div className="relative h-48 overflow-hidden">
                    <SafeImage
                      src={m.image}
                      alt={`${mk.make} ${m.model}`}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {m.parts && (
                      <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-md">
                        {String(m.parts).includes('Parts') ? m.parts : `${m.parts} Parts`}
                      </span>
                    )}
                  </div>
                  <div className="p-5 bg-white">
                    <p className="text-brand text-[11px] font-bold tracking-widest">{mk.make.toUpperCase()}</p>
                    <p className="text-ink font-bold text-lg mt-0.5">{m.model}</p>
                    <p className="text-muted text-[13px] mt-0.5">{m.from} – {m.to}</p>
                    <span className="flex items-center gap-1.5 text-ink text-[12px] font-bold tracking-widest mt-4">
                      SHOP PARTS <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="bg-cream py-14">
        <div className="container-content px-6">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="font-black text-ink text-2xl uppercase tracking-tight">More makes, coming soon</h2>
            <span className="flex items-center gap-1.5 bg-white text-muted text-[11px] font-bold px-3 py-1 rounded-full">
              <Clock size={12} /> Coming Soon
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {comingSoonMakes.map((mk) => (
              <div key={mk.make} className="group bg-white rounded-md overflow-hidden shadow-sm">
                <div className="relative h-40 overflow-hidden">
                  <SafeImage
                    src={mk.models[0].image}
                    alt={mk.make}
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-ink/40" />
                </div>
                <div className="p-5">
                  <p className="text-ink font-bold text-lg">{mk.make}</p>
                  <p className="text-muted text-[13px] mt-0.5">
                    {mk.models.map((m) => m.model).join(', ')}
                  </p>
                  <button
                    onClick={() => handleNotify(mk.make)}
                    className="mt-4 text-brand text-[12px] font-bold tracking-widest hover:underline"
                  >
                    NOTIFY ME WHEN AVAILABLE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
