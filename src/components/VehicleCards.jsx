import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNav } from '../context/NavContext'
import { findMake } from '../data/vehicleCatalog'
import { catalog } from '../services/api'
import SafeImage from './SafeImage'
import InfiniteCarousel from './InfiniteCarousel'

const vehicleCarouselSpeed = 35 // px/second — right -> left

// Take the first Toyota models and tag each with a display code (#01, #02…).
function toFeatured(models) {
  return models.slice(0, 4).map((m, i) => ({ ...m, code: `#0${i + 1}` }))
}

const staticFeatured = toFeatured(findMake('Toyota').models)

export default function VehicleCards() {
  const { navigate } = useNav()
  const [featured, setFeatured] = useState(staticFeatured)

  // Load vehicles from the API (grouped as makes[]); fall back to static data.
  useEffect(() => {
    catalog.getVehicles()
      .then((data) => {
        const toyota = Array.isArray(data) && data.find((m) => m.make === 'Toyota')
        if (toyota?.models?.length) setFeatured(toFeatured(toyota.models))
      })
      .catch(() => { /* keep static fallback */ })
  }, [])

  return (
    <section id="vehicles" className="bg-cream py-16">
      <div className="container-content px-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-brand text-[11px] font-bold tracking-widest mb-3">SHOP BY VEHICLE</p>
            <h2 className="text-ink font-black text-3xl md:text-[2.25rem] tracking-tight uppercase">
              Genuine parts<br />for your Toyota
            </h2>
            <p className="mt-3 max-w-lg text-muted text-[15px] leading-relaxed">
              We currently stock verified parts for three of Nigeria's most-driven Toyotas — with more models coming soon.
            </p>
          </div>
          <button
            onClick={() => navigate('vehicles')}
            className="flex items-center gap-1.5 text-ink text-[12px] font-bold tracking-widest hover:text-brand transition-colors"
          >
            VIEW ALL VEHICLES <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Full-bleed: carousel spans the whole section so cards slide off the real screen edges */}
      <div className="mt-9 ">
          <InfiniteCarousel
            items={featured}
            speed={vehicleCarouselSpeed}
            gap={24}
            ariaLabel="Shop by vehicle"
            itemClassName="w-[300px] md:w-[360px]"
            className="py-3"
            renderItem={(v) => (
              <button
                onClick={() => navigate('vehicles')}
                className="group bg-white rounded-md overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 text-left w-full"
              >
                <div className="relative h-44 overflow-hidden">
                  <span className="absolute top-3 left-3 z-10 bg-brand text-white text-[10px] font-bold px-2 py-1 rounded">{v.code}</span>
                  <SafeImage
                    src={v.image}
                    alt={`Toyota ${v.model}`}
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <span className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded">{v.parts} Parts</span>
                </div>
                <div className="p-5">
                  <p className="text-brand text-[11px] font-bold tracking-widest">TOYOTA</p>
                  <p className="text-ink font-bold text-lg mt-0.5">{v.model}</p>
                  <p className="text-muted text-[13px] mt-0.5">{v.from} – {v.to}</p>
                  <span className="flex items-center gap-1.5 text-ink text-[12px] font-bold tracking-widest mt-4">
                    SHOP PARTS <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>
            )}
          />
      </div>
    </section>
  )
}
