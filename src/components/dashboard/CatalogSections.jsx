// Categories & Vehicles management: table + create/edit modal.
// Full real-time integration with database and live/not-live parts explorer modal.
import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Eye, CheckCircle2, XCircle, ShoppingBag, Car, Tag, Check, X, Filter } from 'lucide-react'
import { admin as adminAPI } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { useLocale } from '../../context/LocaleContext'
import ImageUpload from '../ImageUpload'
import { sanitizeDigits, validateYear } from '../../utils/validation'
import {
  SectionHeader, DataState, TableWrap, Th, Td, Pill,
  DashModal, ConfirmDialog, Field, Toggle, BtnPrimary, BtnGhost, Pagination,
} from './ui'

/* -------------------------------- Categories -------------------------------- */

const CAT_BLANK = { slug: '', label: '', icon: 'brakes', description: '', image: '' }
const ICON_OPTIONS = ['brakes', 'engine', 'suspension', 'filters', 'electrical', 'body']

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function CategoriesSection({ params, clearParams }) {
  const { showToast } = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  // Pagination State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [form, setForm] = useState(CAT_BLANK)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    adminAPI.listCategories()
      .then(setRows)
      .catch((e) => setError(e.message || 'Failed to load categories'))
      .finally(() => setLoading(false))
  }, [])

  function openCreate() { setForm(CAT_BLANK); setCreating(true); setEditing(null) }

  useEffect(() => {
    if (params?.autoCreate && !loading) {
      openCreate()
      if (clearParams) clearParams()
    }
  }, [params?.autoCreate, loading])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function openEdit(c) {
    setForm({
      slug: c.slug, label: c.label, icon: c.icon || 'brakes',
      description: c.description || '', image: c.image || '',
    })
    setEditing(c)
    setCreating(false)
  }
  function close() { setCreating(false); setEditing(null); setForm(CAT_BLANK) }

  async function save() {
    if (!form.label.trim()) { showToast('Category label is required'); return }
    setSaving(true)
    try {
      const payload = {
        label: form.label.trim(),
        icon: form.icon,
        description: form.description.trim(),
        image: form.image,
      }
      if (editing) {
        const updated = await adminAPI.updateCategory(editing.slug, payload)
        setRows((prev) => prev.map((c) => (c.slug === editing.slug ? updated : c)))
        showToast('Category updated')
      } else {
        const slug = form.slug ? slugify(form.slug) : slugify(form.label)
        const created = await adminAPI.createCategory({ ...payload, slug })
        setRows((prev) => [...prev, created])
        showToast('Category created')
      }
      close()
    } catch (e) { showToast(e.message || 'Save failed') } finally { setSaving(false) }
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      await adminAPI.deleteCategory(toDelete.slug)
      setRows((prev) => prev.filter((c) => c.slug !== toDelete.slug))
      showToast('Category deleted'); setToDelete(null)
    } catch (e) { showToast(e.message || 'Delete failed') } finally { setBusy(false) }
  }

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((c) =>
      c.label.toLowerCase().includes(needle) ||
      c.slug.toLowerCase().includes(needle) ||
      (c.description || '').toLowerCase().includes(needle)
    )
  }, [rows, q])

  useEffect(() => {
    setPage(1)
  }, [q])

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  return (
    <>
      <SectionHeader title="Categories" subtitle="Manage storefront part categories.">
        <BtnPrimary onClick={openCreate}><Plus size={16} /> ADD CATEGORY</BtnPrimary>
      </SectionHeader>

      <div className="relative mb-4 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search categories…"
          className="w-full h-10 pl-9 pr-3 border border-line rounded-md text-sm focus:outline-none focus:border-brand"
        />
      </div>

      <DataState loading={loading} error={error} empty={filteredRows.length === 0} emptyLabel="No categories found">
        <TableWrap>
          <thead><tr><Th>Category</Th><Th>Slug</Th><Th>Icon</Th><Th>Description</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {paginatedRows.map((c) => (
              <tr key={c.slug}>
                <Td>
                  <div className="flex items-center gap-3">
                    {c.image
                      ? <img src={c.image} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200" />
                      : <span className="w-10 h-10 rounded-xl bg-slate-100 shrink-0 border border-slate-200" />}
                    <span className="font-semibold text-ink">{c.label}</span>
                  </div>
                </Td>
                <Td className="text-muted">{c.slug}</Td>
                <Td className="text-muted">{c.icon}</Td>
                <Td className="text-muted truncate max-w-xs">{c.description || '—'}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-md border border-line flex items-center justify-center text-ink hover:border-brand hover:text-brand" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => setToDelete(c)} className="w-8 h-8 rounded-md border border-line flex items-center justify-center text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>

        <Pagination
          page={page}
          total={filteredRows.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </DataState>

      <DashModal open={creating || !!editing} onClose={close} title={editing ? `Edit — ${editing.label}` : 'Add category'}
        footer={<><BtnGhost onClick={close}>CANCEL</BtnGhost><BtnPrimary onClick={save} disabled={saving}>{saving ? 'SAVING…' : 'SAVE'}</BtnPrimary></>}>
        <div className="space-y-3.5">
          <Field label="Label *" value={form.label} onChange={set('label')} placeholder="Braking Systems" />
          {!editing && <Field label="Slug (optional)" value={form.slug} onChange={set('slug')} placeholder="auto from label" />}
          <div>
            <span className="block text-[11px] font-bold tracking-widest text-muted mb-1.5 uppercase">Icon</span>
            <select value={form.icon} onChange={set('icon')} className="w-full border border-line rounded-md h-10 px-3 text-sm focus:outline-none focus:border-brand bg-white font-medium">
              {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <span className="block text-[11px] font-bold tracking-widest text-muted mb-1.5 uppercase">Description</span>
            <textarea rows={3} value={form.description} onChange={set('description')} className="w-full border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-brand" />
          </div>
          <ImageUpload
            label="Category Image"
            value={form.image}
            onChange={(url) => setForm((f) => ({ ...f, image: url }))}
          />
        </div>
      </DashModal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} busy={busy}
        title="Delete category" message={`Delete "${toDelete?.label}"? Products keep their category slug.`} />
    </>
  )
}

/* -------------------------------- Vehicles -------------------------------- */

const VEH_BLANK = { make: '', model: '', from: '', to: '', parts: '', image: '', inStock: true }

export function VehiclesSection({ params, clearParams }) {
  const { showToast } = useToast()
  const { formatPrice } = useLocale()
  const [rows, setRows] = useState([])
  const [allParts, setAllParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  // Pagination State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [form, setForm] = useState(VEH_BLANK)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  // View Vehicle & Live Parts Modal State (Eye icon)
  const [viewVehicle, setViewVehicle] = useState(null)
  const [partFilter, setPartFilter] = useState('all') // 'all' | 'live' | 'not_live' | 'out_of_stock'
  const [partSearch, setPartSearch] = useState('')

  function loadData() {
    setLoading(true)
    Promise.all([
      adminAPI.listVehicles(),
      adminAPI.listParts(),
    ])
      .then(([v, p]) => {
        setRows(v || [])
        setAllParts(p || [])
      })
      .catch((e) => setError(e.message || 'Failed to load vehicles'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  function openCreate() { setForm(VEH_BLANK); setCreating(true); setEditing(null) }

  useEffect(() => {
    if (params?.autoCreate && !loading) {
      openCreate()
      if (clearParams) clearParams()
    }
  }, [params?.autoCreate, loading])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setYearDigits = (k) => (e) => {
    const raw = sanitizeDigits(e.target.value)
    if (raw.length <= 4) {
      setForm((f) => ({ ...f, [k]: raw }))
    }
  }
  function openEdit(v) {
    setForm({
      make: v.make, model: v.model, from: v.from || '', to: v.to || '',
      parts: v.parts || '', image: v.image || '', inStock: v.inStock !== false,
    })
    setEditing(v)
    setCreating(false)
  }
  function close() { setCreating(false); setEditing(null); setForm(VEH_BLANK) }

  async function save() {
    if (!form.make.trim() || !form.model.trim()) {
      showToast('Make and model are required')
      return
    }

    if (form.from && !validateYear(form.from)) {
      showToast('From year must be a 4-digit year (1900-2099)')
      return
    }
    if (form.to && !validateYear(form.to)) {
      showToast('To year must be a 4-digit year (1900-2099)')
      return
    }
    if (form.from && form.to && Number(form.from) > Number(form.to)) {
      showToast('From year cannot be greater than To year')
      return
    }

    setSaving(true)
    try {
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        from: form.from.trim(),
        to: form.to.trim(),
        parts: form.parts.trim(),
        image: form.image,
        inStock: form.inStock,
      }
      if (editing) {
        const updated = await adminAPI.updateVehicle(editing._id, payload)
        setRows((prev) => prev.map((v) => (v._id === editing._id ? updated : v)))
        showToast('Vehicle updated')
      } else {
        const created = await adminAPI.createVehicle(payload)
        setRows((prev) => [...prev, created])
        showToast('Vehicle created')
      }
      close()
    } catch (e) { showToast(e.message || 'Save failed') } finally { setSaving(false) }
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      await adminAPI.deleteVehicle(toDelete._id)
      setRows((prev) => prev.filter((v) => v._id !== toDelete._id))
      showToast('Vehicle deleted'); setToDelete(null)
    } catch (e) { showToast(e.message || 'Delete failed') } finally { setBusy(false) }
  }

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((v) =>
      v.make.toLowerCase().includes(needle) ||
      v.model.toLowerCase().includes(needle) ||
      (v.parts || '').toLowerCase().includes(needle) ||
      `${v.from} ${v.to}`.includes(needle)
    )
  }, [rows, q])

  useEffect(() => {
    setPage(1)
  }, [q])

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  // Get matching parts for the viewed vehicle
  const vehicleCompatibleParts = useMemo(() => {
    if (!viewVehicle) return []
    const model = (viewVehicle.model || '').toLowerCase()
    return allParts.filter((p) => {
      const fits = (p.fits || '').toLowerCase()
      const name = (p.name || '').toLowerCase()
      return fits.includes(model) || name.includes(model)
    })
  }, [viewVehicle, allParts])

  // Filter compatible parts by Live status and search query
  const filteredVehicleParts = useMemo(() => {
    const qLower = partSearch.trim().toLowerCase()
    return vehicleCompatibleParts.filter((p) => {
      // Live / Not Live Filter
      const isLive = p.active !== false
      const isOutOfStock = Number(p.stock) <= 0

      if (partFilter === 'live' && !isLive) return false
      if (partFilter === 'not_live' && isLive) return false
      if (partFilter === 'out_of_stock' && !isOutOfStock) return false

      if (!qLower) return true
      return (
        p.name.toLowerCase().includes(qLower) ||
        (p.sku || '').toLowerCase().includes(qLower) ||
        (p.oemNumber || '').toLowerCase().includes(qLower) ||
        (p.categorySlug || '').toLowerCase().includes(qLower) ||
        (p.fits || '').toLowerCase().includes(qLower)
      )
    })
  }, [vehicleCompatibleParts, partFilter, partSearch])

  // Parts stats for the viewed vehicle
  const vehiclePartsStats = useMemo(() => {
    const total = vehicleCompatibleParts.length
    const live = vehicleCompatibleParts.filter((p) => p.active !== false).length
    const notLive = vehicleCompatibleParts.filter((p) => p.active === false).length
    const outOfStock = vehicleCompatibleParts.filter((p) => Number(p.stock) <= 0).length
    return { total, live, notLive, outOfStock }
  }, [vehicleCompatibleParts])

  return (
    <>
      <SectionHeader title="Vehicles" subtitle="Supported makes and models for the vehicle finder. Click the eye icon to view compatible parts & live status.">
        <BtnPrimary onClick={openCreate}><Plus size={16} /> ADD VEHICLE</BtnPrimary>
      </SectionHeader>

      <div className="relative mb-4 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search vehicles…"
          className="w-full h-10 pl-9 pr-3 border border-line rounded-md text-sm focus:outline-none focus:border-brand"
        />
      </div>

      <DataState loading={loading} error={error} empty={filteredRows.length === 0} emptyLabel="No vehicles found">
        <TableWrap>
          <thead><tr><Th>Vehicle</Th><Th>Years</Th><Th>Parts</Th><Th>Stock</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {paginatedRows.map((v) => (
              <tr key={v._id}>
                <Td>
                  <div className="flex items-center gap-3">
                    {v.image
                      ? <img src={v.image} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200" />
                      : <span className="w-10 h-10 rounded-xl bg-slate-100 shrink-0 border border-slate-200" />}
                    <span className="font-semibold text-ink">{v.make} {v.model}</span>
                  </div>
                </Td>
                <Td className="text-muted">{v.from || '—'} – {v.to || '—'}</Td>
                <Td className="text-muted">
                  <button
                    type="button"
                    onClick={() => { setViewVehicle(v); setPartFilter('all'); setPartSearch('') }}
                    className="inline-flex items-center gap-1.5 font-bold text-ink text-xs bg-gray-100 hover:bg-brand/10 hover:text-brand px-2.5 py-1 rounded-md border border-gray-200 transition-colors shadow-2xs"
                    title="Click to view all compatible parts"
                  >
                    {v.dynamicCount !== undefined
                      ? `${v.dynamicCount} Live Parts`
                      : '0 Live Parts'}
                  </button>
                </Td>
                <Td>{v.inStock !== false ? <Pill tone="green">in stock</Pill> : <Pill tone="red">out</Pill>}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setViewVehicle(v); setPartFilter('all'); setPartSearch('') }}
                      className="w-8 h-8 rounded-md border border-line flex items-center justify-center text-ink hover:border-brand hover:text-brand"
                      title="View Compatible Parts & Live Status"
                      aria-label="View Parts"
                    >
                      <Eye size={15} />
                    </button>
                    <button onClick={() => openEdit(v)} className="w-8 h-8 rounded-md border border-line flex items-center justify-center text-ink hover:border-brand hover:text-brand" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => setToDelete(v)} className="w-8 h-8 rounded-md border border-line flex items-center justify-center text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>

        <Pagination
          page={page}
          total={filteredRows.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </DataState>

      {/* ================= ADD / EDIT VEHICLE MODAL ================= */}
      <DashModal open={creating || !!editing} onClose={close} title={editing ? `Edit — ${editing.make} ${editing.model}` : 'Add vehicle'}
        footer={<><BtnGhost onClick={close}>CANCEL</BtnGhost><BtnPrimary onClick={save} disabled={saving}>{saving ? 'SAVING…' : 'SAVE'}</BtnPrimary></>}>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Make" value={form.make} onChange={set('make')} placeholder="Toyota" />
          <Field label="Model" value={form.model} onChange={set('model')} placeholder="Camry" />
          <Field
            label="From year"
            type="text"
            inputMode="numeric"
            value={form.from}
            onChange={setYearDigits('from')}
            placeholder="2007"
          />
          <Field
            label="To year"
            type="text"
            inputMode="numeric"
            value={form.to}
            onChange={setYearDigits('to')}
            placeholder="2024"
          />
          <div className="col-span-2">
            <Field
              label="Custom Parts Label (Optional)"
              value={form.parts}
              onChange={set('parts')}
              placeholder="Leave empty for auto real-time count from database"
            />
            <p className="text-[11px] text-muted mt-1">
              If left blank, the system automatically counts all parts in the database compatible with this vehicle.
            </p>
          </div>
          <div className="col-span-2">
            <ImageUpload
              label="Vehicle Image"
              value={form.image}
              onChange={(url) => setForm((f) => ({ ...f, image: url }))}
            />
          </div>
          <div className="col-span-2"><Toggle label="In stock" checked={form.inStock} onChange={(val) => setForm((f) => ({ ...f, inStock: val }))} /></div>
        </div>
      </DashModal>

      {/* ================= VIEW COMPATIBLE PARTS & LIVE STATUS MODAL ================= */}
      {viewVehicle && (
        <DashModal
          open={Boolean(viewVehicle)}
          onClose={() => setViewVehicle(null)}
          maxWidth="max-w-3xl"
          title={`Compatible Parts — ${viewVehicle.make} ${viewVehicle.model}`}
          footer={
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-muted font-medium">
                Showing {filteredVehicleParts.length} of {vehiclePartsStats.total} compatible parts in database
              </span>
              <button
                type="button"
                onClick={() => setViewVehicle(null)}
                className="h-10 px-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors shadow-2xs"
              >
                CLOSE
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Top Vehicle Overview Card */}
            <div className="p-4 bg-white rounded-xl border border-gray-200/90 shadow-xs flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                {viewVehicle.image ? (
                  <img
                    src={viewVehicle.image}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0 shadow-2xs"
                  />
                ) : (
                  <span className="w-14 h-14 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 border border-brand/20">
                    <Car size={24} />
                  </span>
                )}
                <div>
                  <h3 className="font-black text-ink text-base">
                    {viewVehicle.make} {viewVehicle.model}
                  </h3>
                  <p className="text-muted text-xs mt-0.5">
                    Model Years: <strong className="text-ink font-semibold">{viewVehicle.from || '—'} – {viewVehicle.to || '—'}</strong>
                  </p>
                </div>
              </div>

              {/* Status Breakdown Pills */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  {vehiclePartsStats.live} Live on Store
                </span>
                {vehiclePartsStats.notLive > 0 && (
                  <span className="px-3 py-1.5 rounded-lg bg-red-50 text-red-800 border border-red-200 inline-flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    {vehiclePartsStats.notLive} Hidden / Draft
                  </span>
                )}
                {vehiclePartsStats.outOfStock > 0 && (
                  <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5 shadow-2xs">
                    ⚠️ {vehiclePartsStats.outOfStock} Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200/80">
                <button
                  type="button"
                  onClick={() => setPartFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    partFilter === 'all' ? 'bg-white text-ink shadow-2xs' : 'text-muted hover:text-ink'
                  }`}
                >
                  All ({vehiclePartsStats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setPartFilter('live')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    partFilter === 'live' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-muted hover:text-ink'
                  }`}
                >
                  🟢 Live ({vehiclePartsStats.live})
                </button>
                <button
                  type="button"
                  onClick={() => setPartFilter('not_live')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    partFilter === 'not_live' ? 'bg-white text-red-800 shadow-2xs' : 'text-muted hover:text-ink'
                  }`}
                >
                  🔴 Hidden ({vehiclePartsStats.notLive})
                </button>
                <button
                  type="button"
                  onClick={() => setPartFilter('out_of_stock')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    partFilter === 'out_of_stock' ? 'bg-white text-amber-800 shadow-2xs' : 'text-muted hover:text-ink'
                  }`}
                >
                  Out of Stock ({vehiclePartsStats.outOfStock})
                </button>
              </div>

              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={partSearch}
                  onChange={(e) => setPartSearch(e.target.value)}
                  placeholder="Filter parts, SKU, OEM..."
                  className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-lg text-xs text-ink focus:outline-none focus:border-brand bg-white shadow-2xs"
                />
              </div>
            </div>

            {/* Compatible Parts List Cards */}
            {filteredVehicleParts.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
                <ShoppingBag size={28} className="mx-auto text-gray-400 mb-2" />
                <p className="font-bold text-ink text-sm">No matching parts found</p>
                <p className="text-muted text-xs mt-1">
                  No parts match the selected filter. You can add or enable parts in the Products section.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVehicleParts.map((p) => {
                  const isLive = p.active !== false

                  return (
                    <div
                      key={p.slug}
                      className="p-4 bg-white rounded-xl border border-gray-200/90 shadow-2xs flex items-center justify-between gap-4 hover:border-brand/40 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt=""
                            className="w-16 h-16 min-w-[64px] max-w-[64px] rounded-xl object-cover bg-gray-50 shrink-0 border border-gray-200 shadow-2xs"
                          />
                        ) : (
                          <span className="w-16 h-16 min-w-[64px] max-w-[64px] rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0 border border-gray-200">
                            <ShoppingBag size={22} />
                          </span>
                        )}

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-ink text-sm leading-snug">
                              {p.name}
                            </h4>
                            {p.badge && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-brand/10 text-brand px-2 py-0.5 rounded">
                                {p.badge}
                              </span>
                            )}
                          </div>

                          <div className="text-muted text-xs flex items-center gap-2.5 flex-wrap">
                            <span>SKU: <strong className="text-ink font-mono">{p.sku || p.slug}</strong></span>
                            {p.oemNumber && <span>OEM: <strong className="text-ink font-mono">{p.oemNumber}</strong></span>}
                            <span>Category: <strong className="text-ink uppercase font-bold">{p.categorySlug}</strong></span>
                          </div>

                          <p className="text-brand text-xs font-semibold">
                            {p.fits}
                          </p>
                        </div>
                      </div>

                      {/* Right side: Price, Stock, Live Badge */}
                      <div className="text-right shrink-0 min-w-[130px] space-y-1.5 self-center">
                        <div className="font-black text-ink text-base">
                          {formatPrice(p.price)}
                        </div>

                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Stock pill */}
                          {p.stock > 10 ? (
                            <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                              {p.stock} in stock
                            </span>
                          ) : p.stock > 0 ? (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {p.stock} low
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              Out of stock
                            </span>
                          )}

                          {/* Live Visibility Status Badge */}
                          {isLive ? (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              LIVE
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              HIDDEN
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DashModal>
      )}

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} busy={busy}
        title="Delete vehicle" message={`Delete ${toDelete?.make} ${toDelete?.model}?`} />
    </>
  )
}
