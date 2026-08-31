import { ArrowRight, ShoppingCart } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useLocale } from '../context/LocaleContext'
import { parts as staticParts } from '../data/partsCatalog'
import { catalog } from '../services/api'
import { useNav } from '../context/NavContext'
import SafeImage from './SafeImage'
import InfiniteCarousel from './InfiniteCarousel'

const productCarouselSpeed = 35 // px/second — right -> left

export default function PopularProducts() {
  const { addItem } = useCart()
  const { showToast } = useToast()
  const { formatPrice } = useLocale()
  const { navigate } = useNav()
  const [featured, setFeatured] = useState(() => staticParts.slice(0, 8))

  // Load featured parts from the API; fall back to static data on failure.
  useEffect(() => {
    catalog.getParts()
      .then((data) => { if (Array.isArray(data) && data.length) setFeatured(data.slice(0, 8)) })
      .catch(() => { /* keep static fallback */ })
  }, [])

  const handleAdd = useCallback(async (product, e) => {
    try {
      await addItem({ id: product.id, name: product.name, price: product.price })
      showToast(`Added "${product.name}" to cart`)
    } catch (err) {
      showToast(err.message || 'Could not add to cart')
    }
    // The carousel pauses on :focus-within — drop focus so it keeps scrolling after a click.
    e?.currentTarget?.blur()
  }, [addItem, showToast])

  const renderProduct = useCallback((p) => (
    <div className="group bg-white rounded-md overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 w-full">
      <div className="relative h-40 overflow-hidden bg-cream-light">
        <span className="absolute top-3 left-3 z-10 bg-ink text-white text-[9px] font-bold px-2 py-1 rounded">{p.badge}</span>
        {(p.originalPrice > p.price || p.discount > 0) && (
          <span className="absolute top-3 right-3 z-10 bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-md uppercase tracking-wider animate-pulse flex items-center gap-1 border border-white/20">
            🔥 -{p.discount || Math.round((1 - p.price / p.originalPrice) * 100)}% OFF
          </span>
        )}
        <SafeImage
          src={p.image}
          alt={p.name}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="p-4">
        <p className="font-bold text-ink text-[14px] leading-snug">{p.name}</p>
        <p className="text-muted text-[12px] mt-1">{p.fits}</p>
        <div className="flex items-end justify-between mt-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-muted">PRICE</p>
            <div className="flex items-baseline gap-2 flex-wrap mt-0.5">
              <p className="font-black text-slate-900 text-base text-brand">{formatPrice(p.price)}</p>
              {p.originalPrice > p.price && (
                <p className="line-through text-red-500/80 font-extrabold text-[11px] bg-red-50 px-1.5 py-0.5 rounded border border-red-200/60 shadow-2xs">
                  {formatPrice(p.originalPrice)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={(e) => handleAdd(p, e)}
            aria-label={`Add ${p.name} to cart`}
            className="w-9 h-9 rounded-md bg-brand text-white flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-all"
          >
            <ShoppingCart size={15} />
          </button>
        </div>
      </div>
    </div>
  ), [handleAdd])

  return (
    <section id="products" className="bg-cream py-16">
      <div className="container-content px-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-brand text-[11px] font-bold tracking-widest mb-3">FAST-MOVING STOCK</p>
            <h2 className="text-ink font-black text-3xl md:text-[2.25rem] tracking-tight uppercase">Popular right now</h2>
            <p className="mt-3 max-w-lg text-muted text-[15px] leading-relaxed">
              Best-selling parts across our Toyota range — in stock and ready to ship today.
            </p>
          </div>
          <button
            onClick={() => navigate('vehicles')}
            className="flex items-center gap-1.5 text-ink text-[12px] font-bold tracking-widest hover:text-brand transition-colors"
          >
            BROWSE CATALOG <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Full-bleed carousel */}
      <div className="mt-9 ">
        <InfiniteCarousel
          items={featured}
          speed={productCarouselSpeed}
          gap={20}
          ariaLabel="Popular products"
          itemClassName="w-[240px] md:w-[280px]"
          className="py-3"
          renderItem={renderProduct}
        />
      </div>
    </section>
  )
}
