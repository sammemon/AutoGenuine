import { ArrowRight, ShoppingCart, ArrowLeft, Car, X, Search, Filter, MessageCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SafeImage from '../components/SafeImage'
import { categories as staticCategories, allCategory, findCategory, resolveIcon } from '../data/categoryData'
import { parts as staticParts, partsByCategory } from '../data/partsCatalog'
import { catalog } from '../services/api'
import { useNav } from '../context/NavContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useLocale } from '../context/LocaleContext'

export default function Category() {
  const { params = {}, navigate } = useNav()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const { formatPrice } = useLocale()

  const activeCategoryId = params.id || 'all'
  const activeVehicle = params.vehicleLabel || ''
  const activeSearch = params.search || ''

  const [categories, setCategories] = useState(staticCategories || [])
  const [items, setItems] = useState(() =>
    activeCategoryId === 'all' ? staticParts : partsByCategory(activeCategoryId)
  )
  const [loading, setLoading] = useState(true)

  // Category list for the chips — API with static fallback.
  useEffect(() => {
    catalog
      .getCategories()
      .then((data) => {
        if (Array.isArray(data) && data.length) setCategories(data)
      })
      .catch(() => {
        /* keep static fallback */
      })
  }, [])

  // Parts for the active category — refetch whenever the selected id changes.
  useEffect(() => {
    let active = true
    setLoading(true)
    const categoryParam = activeCategoryId === 'all' ? undefined : activeCategoryId
    catalog
      .getParts(categoryParam)
      .then((data) => {
        if (!active) return
        if (Array.isArray(data)) {
          setItems(data)
        }
      })
      .catch(() => {
        if (!active) return
        setItems(activeCategoryId === 'all' ? staticParts : partsByCategory(activeCategoryId))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [activeCategoryId])

  // Safe category resolution
  const category = useMemo(() => {
    if (activeCategoryId === 'all') return allCategory
    const found =
      categories.find((c) => (c.id || c.slug) === activeCategoryId) ||
      findCategory(activeCategoryId)
    return (
      found || {
        id: activeCategoryId,
        label: activeCategoryId.charAt(0).toUpperCase() + activeCategoryId.slice(1),
        icon: 'LayoutGrid',
        description: `Browse genuine OEM parts in ${activeCategoryId}.`,
        image: allCategory.image,
      }
    )
  }, [categories, activeCategoryId])

  const Icon = resolveIcon(category?.icon)

  // Filter items if vehicle or search query is present
  const displayItems = useMemo(() => {
    let list = items || []
    if (activeVehicle) {
      const v = activeVehicle.toLowerCase().trim()
      const words = v.split(/\s+/).filter(Boolean)
      const matching = list.filter((p) => {
        const fitsText = (p.fits || '').toLowerCase()
        const nameText = (p.name || '').toLowerCase()
        // Check if fits or name contains model words (e.g. "corolla" or "toyota")
        return words.some((w) => fitsText.includes(w) || nameText.includes(w))
      })
      if (matching.length > 0) return matching
    }

    if (activeSearch) {
      const q = activeSearch.toLowerCase().trim()
      const matching = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.fits || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q)
      )
      if (matching.length > 0) return matching
    }

    return list
  }, [items, activeVehicle, activeSearch])

  function handleAdd(p) {
    addItem({ id: p.id || p.slug, name: p.name, price: p.price })
      .then(() => showToast(`Added "${p.name}" to cart`))
      .catch((err) => showToast(err.message || 'Could not add to cart'))
  }

  function handleClearVehicleFilter() {
    navigate('category', { id: activeCategoryId })
  }

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Header />

      {/* Category banner */}
      <div className="relative bg-ink overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage
            src={category.image || allCategory.image}
            alt={category.label}
            className="w-full h-full"
            imgClassName="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/70" />
        </div>
        <div className="container-content relative px-6 py-12 md:py-14">
          <button
            onClick={() => navigate('home')}
            className="inline-flex items-center gap-1.5 text-white/70 text-[12px] font-semibold hover:text-brand transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Back to home
          </button>

          <div className="flex items-center gap-3 mb-3">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Icon size={20} />
            </span>

            {activeVehicle && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-orange-400 border border-orange-400/30 text-xs font-bold">
                <Car size={13} /> {activeVehicle} Compatible
                <button
                  onClick={handleClearVehicleFilter}
                  className="hover:text-white ml-1 p-0.5 rounded-full hover:bg-white/20"
                  title="Remove vehicle filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>

          <h1 className="text-white font-black text-3xl md:text-[2.5rem] leading-tight tracking-tight uppercase max-w-2xl">
            {category.label}
          </h1>
          <p className="mt-2.5 max-w-xl text-white/70 text-[14px] leading-relaxed">
            {category.description}
          </p>
        </div>
      </div>

      {/* Category chips */}
      <div className="border-b border-line bg-white sticky top-0 z-20 shadow-2xs backdrop-blur-md bg-white/95">
        <div className="container-content px-6 py-3.5 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
          {[allCategory, ...categories].map((c) => {
            const cId = c.id || c.slug
            const isSelected = cId === (category.id || category.slug)
            return (
              <button
                key={cId}
                onClick={() =>
                  navigate('category', {
                    id: cId,
                    ...(activeVehicle ? { vehicleLabel: activeVehicle } : {}),
                  })
                }
                className={`shrink-0 px-4 py-2 rounded-xl text-[12px] font-bold tracking-wide border transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-orange-500 hover:text-orange-600'
                }`}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Parts grid */}
      <section className="bg-slate-50/60 py-12 min-h-[500px]">
        <div className="container-content px-6">
          {/* Top Results Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <p className="text-slate-600 text-[13px] font-bold">
                {loading ? 'Fetching genuine parts…' : `${displayItems.length} genuine parts available`}
              </p>
              {activeVehicle && (
                <span className="text-xs text-slate-500 font-medium">
                  • Filtered for <strong>{activeVehicle}</strong>
                </span>
              )}
            </div>

            {activeVehicle && (
              <button
                onClick={handleClearVehicleFilter}
                className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
              >
                <X size={13} /> Clear Vehicle Filter
              </button>
            )}
          </div>

          {/* Product Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayItems.map((p) => {
              const partId = p.id || p.slug
              const isLowStock = p.stock !== undefined && p.stock <= 5 && p.stock > 0
              const isOutOfStock = p.stock !== undefined && p.stock <= 0

              return (
                <div
                  key={partId}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      {p.badge && (
                        <span className="absolute top-3 left-3 z-10 bg-slate-900 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                          {p.badge}
                        </span>
                      )}
                      {(p.originalPrice > p.price || p.discount > 0) && !isOutOfStock && (
                        <span className="absolute bottom-3 left-3 z-10 bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md animate-pulse tracking-wider flex items-center gap-1 border border-white/20">
                          🔥 -{p.discount || Math.round((1 - p.price / p.originalPrice) * 100)}% OFF
                        </span>
                      )}
                      {isOutOfStock ? (
                        <span className="absolute top-3 right-3 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                          OUT OF STOCK
                        </span>
                      ) : isLowStock ? (
                        <span className="absolute top-3 right-3 z-10 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                          Only {p.stock} left
                        </span>
                      ) : null}

                      <SafeImage
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full"
                        imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-slate-900 text-[15px] leading-snug group-hover:text-orange-600 transition-colors">
                        {p.name}
                      </h3>
                      {p.fits && (
                        <p className="text-slate-500 text-[12px] mt-1.5 flex items-center gap-1.5">
                          <Car size={13} className="text-slate-400 shrink-0" />
                          <span className="line-clamp-1">Fits: {p.fits}</span>
                        </p>
                      )}
                      {p.sku && (
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          OEM SKU: <span className="font-mono">{p.sku}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 mt-2">
                    <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1">
                        PRICE {p.originalPrice > p.price && <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-1 py-0.2 rounded uppercase animate-pulse">SPECIAL SALE</span>}
                      </p>
                      <div className="flex items-baseline gap-2 flex-wrap mt-0.5">
                        <p className="font-black text-slate-900 text-xl tracking-tight text-brand">{formatPrice(p.price)}</p>
                        {p.originalPrice > p.price && (
                          <p className="line-through text-red-500/80 font-extrabold text-xs bg-red-50 px-1.5 py-0.5 rounded border border-red-200/60 shadow-2xs">
                            {formatPrice(p.originalPrice)}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAdd(p)}
                      disabled={isOutOfStock}
                      className={`flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-bold tracking-wider transition-all shadow-2xs ${
                        isOutOfStock
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700 active:scale-95'
                      }`}
                    >
                      <ShoppingCart size={14} /> {isOutOfStock ? 'Sold Out' : 'ADD TO CART'}
                    </button>
                    </div>
                    <button
                      onClick={() => navigate('messages', { productSlug: partId })}
                      className="mt-3 w-full h-9 rounded-xl border border-slate-200 text-slate-700 hover:border-orange-500 hover:text-orange-600 bg-white text-xs font-bold tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={14} /> CHAT ABOUT THIS PART
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {!loading && displayItems.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3">
                <Car size={24} />
              </div>
              <h4 className="text-slate-900 font-bold text-base">
                No matching parts found {activeVehicle ? `for ${activeVehicle}` : ''}
              </h4>
              <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                We are actively expanding our inventory. You can clear your filter to view all genuine parts or contact our WhatsApp desk for a custom order.
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                {activeVehicle && (
                  <button
                    onClick={handleClearVehicleFilter}
                    className="h-9 px-4 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors"
                  >
                    View All {category.label} Parts
                  </button>
                )}
                <button
                  onClick={() => navigate('home')}
                  className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
