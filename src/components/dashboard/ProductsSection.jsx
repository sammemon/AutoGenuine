// Products: list + create / edit / delete against /admin/parts.
// Fully connected to Categories and Vehicles database collections with a
// single clean autocomplete vehicle selector dropdown and Product Details modal.
import { useEffect, useMemo, useState, useRef } from 'react'
import { Plus, Search, Pencil, Trash2, Star, Car, ChevronDown, Check, X, Eye, CheckCircle2, XCircle, Tag, Package, ShoppingBag, ShieldCheck, Flame, Sparkles, RefreshCw } from 'lucide-react'
import { admin as adminAPI } from '../../services/api'
import { useLocale } from '../../context/LocaleContext'
import { useToast } from '../../context/ToastContext'
import ImageUpload from '../ImageUpload'
import { sanitizeDigits, validateStock, validateDiscount } from '../../utils/validation'
import {
  SectionHeader, DataState, TableWrap, Th, Td, Pill,
  DashModal, ConfirmDialog, Field, SelectField, Toggle, BtnPrimary, BtnGhost, Pagination,
} from './ui'

const BLANK = {
  slug: '', name: '', categorySlug: '', price: '', originalPrice: '', stock: '', badge: '',
  fits: '', image: '', sku: '', oemNumber: '', discount: '',
  featured: false, popular: false, active: true,
}

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function ProductsSection({ params, clearParams }) {
  const { formatPrice } = useLocale()
  const { showToast } = useToast()
  const [parts, setParts] = useState([])
  const [cats, setCats] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  // Pagination State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [editing, setEditing] = useState(null)   // part being edited, or null
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  // View Product Details Modal (Eye icon)
  const [viewProduct, setViewProduct] = useState(null)

  // 1-Click Flash Sale & Promotional Campaign State
  const [promoPercent, setPromoPercent] = useState(15)
  const [promoScope, setPromoScope] = useState('all')
  const [promoCategory, setPromoCategory] = useState('')
  const [promoBanner, setPromoBanner] = useState('')
  const [promoBusy, setPromoBusy] = useState(false)
  const [activeCampaign, setActiveCampaign] = useState(null)

  // Single Clean Autocomplete Dropdown State
  const [showVehiclePicker, setShowVehiclePicker] = useState(false)
  const vehiclePickerRef = useRef(null)

  function load() {
    setLoading(true)
    Promise.all([
      adminAPI.listParts(),
      adminAPI.listCategories(),
      adminAPI.listVehicles(),
      adminAPI.getSettings().catch(() => ({})),
    ])
      .then(([p, c, v, s]) => {
        setParts(p || [])
        setCats(c || [])
        setVehicles(v || [])
        if (s && s.activePromoCampaign) {
          setActiveCampaign(s.activePromoCampaign)
        }
      })
      .catch((e) => setError(e.message || 'Failed to load products'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleLaunchPromo() {
    setPromoBusy(true)
    try {
      const res = await adminAPI.applyPromoCampaign({
        discountPercent: Number(promoPercent) || 15,
        targetScope: promoScope,
        categorySlug: promoCategory,
        bannerText: promoBanner,
      })
      showToast(res.message)
      if (res.campaign) setActiveCampaign(res.campaign)
      load()
    } catch (err) {
      showToast(err.message || 'Failed to launch promotional sale')
    } finally {
      setPromoBusy(false)
    }
  }

  async function handleClearPromo() {
    setPromoBusy(true)
    try {
      const res = await adminAPI.clearPromoCampaign()
      showToast(res.message)
      setActiveCampaign(null)
      load()
    } catch (err) {
      showToast(err.message || 'Failed to clear promotional sale')
    } finally {
      setPromoBusy(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (vehiclePickerRef.current && !vehiclePickerRef.current.contains(e.target)) {
        setShowVehiclePicker(false)
      }
    }
    if (showVehiclePicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showVehiclePicker])

  function openCreate() {
    setForm({ ...BLANK, categorySlug: cats[0]?.id || cats[0]?.slug || '' })
    setCreating(true)
    setEditing(null)
    setShowVehiclePicker(false)
  }

  useEffect(() => {
    if (params?.autoCreate && !loading) {
      openCreate()
      if (clearParams) clearParams()
    }
  }, [params?.autoCreate, loading])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return parts
    return parts.filter((p) =>
      p.name.toLowerCase().includes(needle)
      || p.slug.toLowerCase().includes(needle)
      || (p.sku || '').toLowerCase().includes(needle)
      || (p.categorySlug || '').toLowerCase().includes(needle)
      || (p.fits || '').toLowerCase().includes(needle)
    )
  }, [parts, q])

  useEffect(() => {
    setPage(1)
  }, [q])

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  // Real-time Autocomplete Filter by what user types in fits
  const filteredVehicles = useMemo(() => {
    const rawSearch = form.fits.replace(/^fits:\s*/i, '').trim().toLowerCase()
    if (!rawSearch) return vehicles
    return vehicles.filter((v) => {
      const full = `${v.make} ${v.model} ${v.from} ${v.to}`.toLowerCase()
      const makeModel = `${v.make} ${v.model}`.toLowerCase()
      const model = v.model.toLowerCase()
      return full.includes(rawSearch) || makeModel.startsWith(rawSearch) || model.startsWith(rawSearch)
    })
  }, [vehicles, form.fits])

  function openEdit(p) {
    setForm({
      slug: p.slug, name: p.name, categorySlug: p.categorySlug || '', price: p.price ?? '',
      originalPrice: p.originalPrice ? String(p.originalPrice) : '',
      stock: p.stock !== undefined && p.stock !== null ? String(p.stock) : '',
      badge: p.badge || '', fits: p.fits || '', image: p.image || '',
      sku: p.sku || '', oemNumber: p.oemNumber || '',
      discount: p.discount !== undefined && p.discount !== null ? String(p.discount) : '',
      featured: !!p.featured, popular: !!p.popular, active: p.active !== false,
    })
    setEditing(p)
    setCreating(false)
    setShowVehiclePicker(false)
  }

  function close() {
    setCreating(false)
    setEditing(null)
    setForm(BLANK)
    setShowVehiclePicker(false)
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setDigits = (k) => (e) => setForm((f) => ({ ...f, [k]: sanitizeDigits(e.target.value) }))
  const setDiscount = (e) => {
    const raw = sanitizeDigits(e.target.value)
    if (raw === '' || Number(raw) <= 100) {
      setForm((f) => ({ ...f, discount: raw }))
    }
  }
  const setBool = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  // Select vehicle from autocomplete dropdown
  function handleSelectVehicle(v) {
    const yearRange = v.from && v.to ? `${v.from} – ${v.to}` : v.from || v.to || ''
    const fitString = `Fits: ${v.make} ${v.model}${yearRange ? ` ${yearRange}` : ''}`
    setForm((f) => ({ ...f, fits: fitString }))
    setShowVehiclePicker(false)
  }

  async function save() {
    if (!form.name.trim()) { showToast('Product name is required'); return }
    if (form.price === '') { showToast('Price is required'); return }

    const stockValidation = validateStock(form.stock)
    if (!stockValidation.valid) {
      showToast(stockValidation.error)
      return
    }

    const discountValidation = validateDiscount(form.discount)
    if (!discountValidation.valid) {
      showToast(discountValidation.error)
      return
    }

    setSaving(true)
    const payload = {
      name: form.name.trim(),
      categorySlug: form.categorySlug || 'engine',
      price: Number(form.price),
      originalPrice: Number(form.originalPrice || 0),
      stock: Number(form.stock),
      badge: form.badge.trim(),
      fits: form.fits.trim(),
      image: form.image,
      sku: form.sku.trim(),
      oemNumber: form.oemNumber.trim(),
      discount: Number(form.discount || 0),
      featured: !!form.featured,
      popular: !!form.popular,
      active: form.active !== false,
    }

    try {
      if (editing) {
        const updated = await adminAPI.updatePart(editing.slug, payload)
        setParts((prev) => prev.map((p) => (p.slug === editing.slug ? updated : p)))
        showToast('Product updated')
      } else {
        const slug = form.slug ? slugify(form.slug) : slugify(form.name)
        const created = await adminAPI.createPart({ ...payload, slug })
        setParts((prev) => [created, ...prev])
        showToast('Product created')
      }
      close()
    } catch (e) {
      showToast(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      await adminAPI.deletePart(toDelete.slug)
      setParts((prev) => prev.filter((p) => p.slug !== toDelete.slug))
      showToast('Product deleted')
      setToDelete(null)
    } catch (e) {
      showToast(e.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  const open = creating || !!editing

  return (
    <>
      <SectionHeader title="Products" subtitle="Manage the parts catalogue — live visibility, pricing, stock, and vehicle fitment.">
        <BtnPrimary onClick={openCreate}><Plus size={16} /> ADD PRODUCT</BtnPrimary>
      </SectionHeader>

      {/* ================= 1-CLICK FLASH SALE & PROMOTIONS CONTROL CENTER ================= */}
      <div className="mb-6 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white rounded-2xl p-5 shadow-lg border border-amber-500/30">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg text-white shadow-sm animate-pulse">
                <Flame size={18} />
              </span>
              <h2 className="font-black text-white text-base tracking-wide">
                Storewide Promotional Campaign &amp; Flash Sale Manager
              </h2>
            </div>
            <p className="text-slate-300 text-xs mt-1">
              Apply 1-click strikethrough list pricing (<span className="line-through text-slate-400">~Rs 25,000~</span> <strong className="text-amber-400">Rs 21,250</strong>) across your store just like Daraz &amp; top e-commerce platforms.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeCampaign?.enabled ? (
              <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 size={14} /> FLASH SALE LIVE ({activeCampaign.discountPercent}% OFF)
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-white/10 text-slate-300 font-bold text-xs rounded-xl border border-white/10 flex items-center gap-1.5">
                <Tag size={13} /> STANDARD RETAIL PRICING
              </span>
            )}
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mt-4">
          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1.5">
              Select Discount %
            </label>
            <div className="flex items-center gap-1.5">
              {[10, 12, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setPromoPercent(pct)}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all border ${
                    Number(promoPercent) === pct
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                      : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Scope Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1.5">
              Promotion Scope
            </label>
            <select
              value={promoScope}
              onChange={(e) => setPromoScope(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-slate-800 text-white text-xs font-bold border border-white/20 focus:outline-none focus:border-amber-400"
            >
              <option value="all">Entire Store (All Products)</option>
              <option value="popular">Top Selling / Popular Parts Only</option>
              <option value="category">Specific Category</option>
            </select>
          </div>

          {/* Category Dropdown if scope is category */}
          {promoScope === 'category' ? (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                Target Category
              </label>
              <select
                value={promoCategory}
                onChange={(e) => setPromoCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-slate-800 text-white text-xs font-bold border border-white/20 focus:outline-none focus:border-amber-400"
              >
                <option value="">— Select Category —</option>
                {cats.map((c) => (
                  <option key={c.id || c.slug} value={c.id || c.slug}>{c.label}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                Custom Banner Announcement
              </label>
              <input
                type="text"
                value={promoBanner}
                onChange={(e) => setPromoBanner(e.target.value)}
                placeholder="🔥 MEGA SALE LIVE! Get up to 15% OFF!"
                className="w-full h-9 px-3 rounded-xl bg-slate-800 text-white text-xs border border-white/20 focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleLaunchPromo}
              disabled={promoBusy}
              className="flex-1 h-9 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} /> LAUNCH SALE
            </button>
            <button
              type="button"
              onClick={handleClearPromo}
              disabled={promoBusy}
              className="h-9 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
              title="Remove all discounts and restore catalog to original prices"
            >
              <RefreshCw size={13} /> RESTORE ORIGINAL
            </button>
          </div>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products, SKU, category, vehicle fitment…"
          className="w-full h-10 pl-9 pr-3 border border-line rounded-md text-sm focus:outline-none focus:border-brand bg-white"
        />
      </div>

      <DataState loading={loading} error={error} empty={rows.length === 0} emptyLabel="No products found">
        <TableWrap>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>Price</Th>
              <Th>Stock</Th>
              <Th>Live Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((p) => {
              const isLive = p.active !== false
              return (
                <tr key={p.slug}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {p.image
                        ? <img src={p.image} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200" />
                        : <span className="w-10 h-10 rounded-xl bg-slate-100 shrink-0 border border-slate-200" />}
                      <div className="min-w-0">
                        <span className="block font-semibold text-ink truncate max-w-[220px]">{p.name}</span>
                        <span className="block text-muted text-[12px] truncate max-w-[220px]">{p.sku || p.slug}</span>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-muted">{p.categorySlug}</Td>
                  <Td className="font-semibold text-ink whitespace-nowrap">{formatPrice(p.price)}</Td>
                  <Td>
                    {p.stock > 10 ? <Pill tone="green">{p.stock}</Pill>
                      : p.stock > 0 ? <Pill tone="amber">{p.stock} low</Pill>
                      : <Pill tone="red">out</Pill>}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> LIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> HIDDEN
                        </span>
                      )}
                      {p.featured && <Pill tone="brand"><Star size={10} /> feat</Pill>}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewProduct(p)}
                        className="w-8 h-8 rounded-md border border-line flex items-center justify-center text-ink hover:border-brand hover:text-brand"
                        title="View Product Details"
                        aria-label="View"
                      >
                        <Eye size={15} />
                      </button>
                      <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-md border border-line flex items-center justify-center text-ink hover:border-brand hover:text-brand" aria-label="Edit"><Pencil size={15} /></button>
                      <button onClick={() => setToDelete(p)} className="w-8 h-8 rounded-md border border-line flex items-center justify-center text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 size={15} /></button>
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </TableWrap>

        <Pagination
          page={page}
          total={rows.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </DataState>

      {/* ================= VIEW PRODUCT DETAILS MODAL (Eye Icon) ================= */}
      {viewProduct && (
        <DashModal
          open={Boolean(viewProduct)}
          onClose={() => setViewProduct(null)}
          maxWidth="max-w-xl"
          title={`Product Details — ${viewProduct.name}`}
          footer={
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const target = viewProduct
                  setViewProduct(null)
                  openEdit(target)
                }}
                className="h-10 px-5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-600 transition-colors inline-flex items-center gap-1.5"
              >
                <Pencil size={13} /> EDIT PRODUCT
              </button>
              <button
                type="button"
                onClick={() => setViewProduct(null)}
                className="h-10 px-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors"
              >
                CLOSE
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Header with image, name, badge */}
            <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-xs flex items-center gap-4">
              {viewProduct.image ? (
                <img
                  src={viewProduct.image}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                />
              ) : (
                <span className="w-16 h-16 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 border border-brand/20">
                  <ShoppingBag size={24} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-ink text-sm truncate">{viewProduct.name}</h3>
                  {viewProduct.badge && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-brand/10 text-brand px-1.5 py-0.5 rounded">
                      {viewProduct.badge}
                    </span>
                  )}
                </div>
                <p className="text-muted text-[11px] mt-0.5">
                  Slug: <strong className="text-ink font-mono">{viewProduct.slug}</strong>
                </p>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  {viewProduct.active !== false ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-emerald-600" /> LIVE ON STORE
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-flex items-center gap-1">
                      <XCircle size={11} className="text-red-600" /> HIDDEN (NOT LIVE)
                    </span>
                  )}
                  {viewProduct.featured && <Pill tone="brand"><Star size={10} /> Featured</Pill>}
                  {viewProduct.popular && <Pill tone="ink">Popular</Pill>}
                </div>
              </div>
            </div>

            {/* Pricing & Stock Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-muted uppercase block">Retail Price</span>
                <span className="font-black text-ink text-sm mt-0.5 block">{formatPrice(viewProduct.price)}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-muted uppercase block">Available Stock</span>
                <span className="font-black text-ink text-sm mt-0.5 block">
                  {viewProduct.stock > 10 ? (
                    <span className="text-green-700">{viewProduct.stock} units</span>
                  ) : viewProduct.stock > 0 ? (
                    <span className="text-amber-700">{viewProduct.stock} units (low)</span>
                  ) : (
                    <span className="text-red-700">0 (Out of stock)</span>
                  )}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-muted uppercase block">SKU Code</span>
                <span className="font-semibold text-ink text-xs mt-0.5 block truncate">{viewProduct.sku || '—'}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-muted uppercase block">OEM Number</span>
                <span className="font-semibold text-ink text-xs mt-0.5 block truncate">{viewProduct.oemNumber || '—'}</span>
              </div>
            </div>

            {/* Vehicle Compatibility & Category */}
            <div className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-xs space-y-2">
              <p className="font-black text-ink uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Car size={13} className="text-brand" /> Vehicle Compatibility (Fits)
              </p>
              <p className="text-ink font-semibold text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                {viewProduct.fits || 'Universal / All Models'}
              </p>
              <p className="text-muted text-[11px]">
                Category: <strong className="text-ink uppercase font-bold">{viewProduct.categorySlug}</strong>
              </p>
            </div>
          </div>
        </DashModal>
      )}

      {/* ================= PRODUCT ADD / EDIT MODAL ================= */}
      <DashModal
        open={open}
        onClose={close}
        maxWidth="max-w-2xl"
        title={editing ? `Edit — ${editing.name}` : 'Add Product'}
        footer={<>
          <BtnGhost onClick={close}>CANCEL</BtnGhost>
          <BtnPrimary onClick={save} disabled={saving}>{saving ? 'SAVING…' : 'SAVE PRODUCT'}</BtnPrimary>
        </>}
      >
        <div className="grid grid-cols-2 gap-3.5">
          <div className="col-span-2">
            <Field label="Name *" value={form.name} onChange={set('name')} placeholder="Front Brake Pad Set (Ceramic)" />
          </div>

          {!editing && (
            <div className="col-span-2">
              <Field label="Slug (optional)" value={form.slug} onChange={set('slug')} placeholder="auto from name" />
            </div>
          )}

          <SelectField label="Category *" value={form.categorySlug} onChange={set('categorySlug')}>
            <option value="">— Select Category —</option>
            {cats.map((c) => <option key={c.id || c.slug} value={c.id || c.slug}>{c.label}</option>)}
          </SelectField>

          <Field label="Badge" value={form.badge} onChange={set('badge')} placeholder="OEM / GENUINE" />

          <Field
            label="Selling Price (PKR) *"
            type="text"
            inputMode="numeric"
            value={form.price}
            onChange={setDigits('price')}
            placeholder="18500"
          />

          <Field
            label="Original MSRP Price (PKR)"
            type="text"
            inputMode="numeric"
            value={form.originalPrice}
            onChange={setDigits('originalPrice')}
            placeholder="e.g. 21000 (Crossed-Out List Price)"
          />

          <Field
            label="Stock *"
            type="text"
            inputMode="numeric"
            value={form.stock}
            onChange={setDigits('stock')}
            placeholder="50"
          />

          <div className="col-span-2 sm:col-span-1">
            <Field
              label="Discount %"
              type="text"
              inputMode="numeric"
              value={form.discount}
              onChange={setDiscount}
              placeholder="0"
            />
          </div>

          <Field label="SKU" value={form.sku} onChange={set('sku')} placeholder="BP-CAM-01" />
          <Field label="OEM Number" value={form.oemNumber} onChange={set('oemNumber')} placeholder="04465-33471" />

          {/* ================= SINGLE CLEAN AUTOCOMPLETE VEHICLE INPUT ================= */}
          <div className="col-span-2 space-y-1.5 relative" ref={vehiclePickerRef}>
            <label className="block text-[11px] font-bold text-ink uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Car size={13} className="text-brand" /> Vehicle Compatibility (Fits)
              </span>
              <span className="text-[10px] font-normal text-muted lowercase">Type to search database ({vehicles.length} vehicles)</span>
            </label>

            <div className="relative">
              <Car size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={form.fits}
                onFocus={() => setShowVehiclePicker(true)}
                onChange={(e) => {
                  setForm((f) => ({ ...f, fits: e.target.value }))
                  setShowVehiclePicker(true)
                }}
                placeholder="Type to search e.g. Toyota Camry, Corolla..."
                className="w-full h-11 pl-10 pr-10 border border-line rounded-lg text-xs font-medium text-ink focus:outline-none focus:border-brand bg-white"
              />
              {form.fits ? (
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, fits: '' }))
                    setShowVehiclePicker(true)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100"
                  title="Clear"
                >
                  <X size={14} />
                </button>
              ) : (
                <ChevronDown
                  size={15}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
              )}
            </div>

            {/* Dropdown Auto-Filtered List */}
            {showVehiclePicker && filteredVehicles.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl shadow-xl border border-line overflow-hidden max-h-56 overflow-y-auto divide-y divide-line/60">
                {filteredVehicles.map((v) => {
                  const yearRange = v.from && v.to ? `${v.from} – ${v.to}` : v.from || v.to || ''
                  return (
                    <button
                      key={v._id || `${v.make}-${v.model}`}
                      type="button"
                      onClick={() => handleSelectVehicle(v)}
                      className="w-full p-2.5 px-3 text-left hover:bg-slate-50 flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {v.image ? (
                          <img src={v.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200" />
                        ) : (
                          <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200">
                            <Car size={14} />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-ink truncate">{v.make} {v.model}</p>
                          <p className="text-muted text-[11px]">Years: {yearRange || 'All Years'}</p>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-brand hover:underline shrink-0">
                        Select
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="col-span-2">
            <ImageUpload
              label="Product Image"
              value={form.image}
              onChange={(url) => setForm((f) => ({ ...f, image: url }))}
            />
          </div>

          <div className="col-span-2 pt-2 border-t border-line space-y-2">
            <p className="text-[11px] font-bold text-ink uppercase tracking-wider">Catalogue Flags</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Toggle label="Featured" checked={form.featured} onChange={setBool('featured')} />
              <Toggle label="Popular" checked={form.popular} onChange={setBool('popular')} />
              <Toggle label="Active (Visible / Live on Store)" checked={form.active} onChange={setBool('active')} />
            </div>
          </div>
        </div>
      </DashModal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} busy={busy}
        title="Delete Product" message={`Delete "${toDelete?.name}" (${toDelete?.slug})? This cannot be undone.`} />
    </>
  )
}
