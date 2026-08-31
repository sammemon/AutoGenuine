import { ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { categories as staticCategories, allCategory, resolveIcon } from '../data/categoryData'
import { catalog } from '../services/api'
import { useNav } from '../context/NavContext'
import SafeImage from './SafeImage'
import InfiniteCarousel from './InfiniteCarousel'

const categoryCarouselSpeed = 40

export default function CategorySection() {
  const { navigate } = useNav()
  const [categories, setCategories] = useState(staticCategories)

  // Load categories from the API; keep static data as the fallback if it fails.
  useEffect(() => {
    catalog.getCategories()
      .then((data) => { if (Array.isArray(data) && data.length) setCategories(data) })
      .catch(() => { /* keep static fallback */ })
  }, [])

  const allCategories = [allCategory, ...categories]

  const renderCategory = useCallback(({ id, label, icon, image }) => {
    const Icon = resolveIcon(icon)
    return (
    <button
      onClick={() => navigate('category', { id })}
      className="group relative bg-white rounded-lg overflow-hidden flex flex-col text-left hover:shadow-xl transition-all duration-300 border border-line hover:border-brand w-full"
    >
      <div className="relative h-40 md:h-44 lg:h-48 overflow-hidden">
        <SafeImage
          src={image}
          alt={label}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/20 to-transparent group-hover:from-ink/40 transition-colors" />
        <span className="absolute bottom-3 left-3 w-11 h-11 rounded-lg bg-brand flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
          <Icon size={18} />
        </span>
      </div>
      <div className="px-5 py-5 bg-white">
        <span className="block font-bold text-ink text-[16px] mb-1 whitespace-nowrap">{label}</span>
        <span className="flex items-center gap-1.5 text-brand text-[12px] font-bold tracking-wide">
          SHOP NOW <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </button>
    )
  }, [navigate])

  return (
    <section className="bg-white py-16">
      <div className="container-content px-6">
        <p className="text-brand text-[11px] font-bold tracking-widest mb-3">SHOP PARTS</p>
        <h2 className="text-ink font-black text-3xl md:text-[2.25rem] tracking-tight uppercase">Browse by category</h2>
        <p className="mt-3 max-w-xl text-muted text-[15px] leading-relaxed">
          Seven categories cover 95% of routine service and repair jobs. Every SKU is genuine or OEM-certified.
        </p>
      </div>

      {/* Full-bleed carousel */}
      <div className="mt-9 ">
        <InfiniteCarousel
          items={allCategories}
          speed={categoryCarouselSpeed}
          gap={20}
          ariaLabel="Browse by category"
          itemClassName="w-[240px] md:w-[280px]"
          className="py-3"
          renderItem={renderCategory}
        />
      </div>
    </section>
  )
}
