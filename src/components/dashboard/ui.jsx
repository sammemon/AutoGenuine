// Shared building blocks for the AutoGenuine management dashboard.
// Clean, AI-grade, modern enterprise UI with crisp white/light slate surfaces,
// high-contrast typography, and smooth micro-animations.
import { useEffect } from 'react'
import { AlertCircle, Inbox, Loader2, X } from 'lucide-react'

// Stat card for the overview grid.
export function StatCard({ icon: Icon, label, value, hint, accent = 'brand' }) {
  const ring = {
    brand: 'bg-orange-50 text-orange-600 border border-orange-200/60',
    ink: 'bg-slate-100 text-slate-800 border border-slate-200',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    red: 'bg-red-50 text-red-700 border border-red-200/60',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200/60',
  }[accent] || 'bg-orange-50 text-orange-600 border border-orange-200/60'

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 flex items-start gap-4 shadow-xs hover:shadow-md transition-shadow">
      <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${ring}`}>
        <Icon size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase truncate">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-0.5 leading-tight tracking-tight">{value}</p>
        {hint && <p className="text-xs text-slate-500 mt-1 truncate">{hint}</p>}
      </div>
    </div>
  )
}

// Section title + optional action button area.
export function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
      <div>
        <h2 className="text-slate-900 font-black text-2xl md:text-[26px] tracking-tight">{title}</h2>
        {subtitle && <p className="text-slate-500 text-xs md:text-sm mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2.5 flex-wrap">{children}</div>}
    </div>
  )
}

// Loading / error / empty wrapper. Renders children only when there's data.
export function DataState({ loading, error, empty, emptyLabel = 'Nothing here yet', children }) {
  if (loading) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <Loader2 size={28} className="mx-auto text-brand animate-spin" />
        <p className="mt-3 text-slate-500 text-xs font-semibold">Loading data from database…</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-red-200/80 shadow-xs">
        <AlertCircle size={28} className="mx-auto text-red-600" />
        <p className="mt-3 text-slate-900 font-bold text-sm">{error}</p>
      </div>
    )
  }
  if (empty) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <Inbox size={32} className="mx-auto text-slate-400" />
        <p className="mt-3 text-slate-600 font-semibold text-sm">{emptyLabel}</p>
      </div>
    )
  }
  return children
}

// Status pill used across orders / users / products.
export function Pill({ tone = 'ink', children }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    blue: 'bg-blue-50 text-blue-800 border border-blue-200',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200',
    red: 'bg-red-50 text-red-800 border border-red-200',
    ink: 'bg-slate-100 text-slate-800 border border-slate-200',
    brand: 'bg-orange-50 text-orange-800 border border-orange-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs ${tones[tone] || tones.ink}`}>
      {children}
    </span>
  )
}

// Scroll container so wide tables never break the page layout.
export function TableWrap({ children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">{children}</table>
      </div>
    </div>
  )
}

export function Th({ children, className = '' }) {
  return (
    <th className={`text-left font-bold text-[11px] tracking-wider text-slate-500 uppercase px-4 py-3.5 bg-slate-50/90 border-b border-slate-200 ${className}`}>
      {children}
    </th>
  )
}

export function Td({ children, className = '' }) {
  return (
    <td className={`px-4 py-3.5 border-b border-slate-100 align-middle text-slate-700 ${className}`}>
      {children}
    </td>
  )
}

// Labelled input for the modal forms.
export function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold tracking-wider text-slate-600 mb-1.5 uppercase">{label}</span>
      <input
        {...props}
        className="w-full border border-slate-200 rounded-xl h-10 px-3.5 text-xs text-slate-900 bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-2xs transition-all"
      />
    </label>
  )
}

export function SelectField({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold tracking-wider text-slate-600 mb-1.5 uppercase">{label}</span>
      <select
        {...props}
        className="w-full border border-slate-200 rounded-xl h-10 px-3.5 text-xs text-slate-900 bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-2xs transition-all font-medium"
      >
        {children}
      </select>
    </label>
  )
}

export function Toggle({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full border border-slate-200 rounded-xl h-10 px-3.5 text-xs bg-white hover:bg-slate-50/80 transition-colors shadow-2xs"
    >
      <span className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">{label}</span>
      <span className={`w-9 h-5 rounded-full relative transition-colors ${checked ? 'bg-brand' : 'bg-slate-200'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${checked ? 'left-4' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

// Self-contained modal for dashboard forms with solid backdrop & scroll lock
export function DashModal({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Dark frosted overlay */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        style={{ animation: 'overlayIn 0.15s ease-out' }}
        onClick={onClose}
      />
      {/* Modal Dialog Card */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col z-10 border border-slate-200/90 overflow-hidden`}
        style={{ animation: 'popIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100 bg-white shrink-0">
          <h3 className="font-black text-slate-900 text-base md:text-lg tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Confirm dialog for destructive actions.
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true, busy }) {
  return (
    <DashModal
      open={open}
      onClose={onClose}
      maxWidth="max-w-md"
      title={title}
      footer={
        <>
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`h-10 px-5 rounded-xl text-white text-xs font-black tracking-wider transition-colors shadow-md disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-brand hover:bg-brand-600 shadow-orange-500/20'
            }`}
          >
            {busy ? 'PROCESSING…' : confirmLabel.toUpperCase()}
          </button>
        </>
      }
    >
      <p className="text-xs text-slate-600 leading-relaxed font-medium">{message}</p>
    </DashModal>
  )
}

export function BtnPrimary({ children, ...props }) {
  return (
    <button
      {...props}
      className="h-10 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black tracking-wider inline-flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50"
    >
      {children}
    </button>
  )
}

export function BtnGhost({ children, ...props }) {
  return (
    <button
      {...props}
      className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs disabled:opacity-50"
    >
      {children}
    </button>
  )
}

export function Pagination({ page = 1, total = 0, pageSize = 10, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(total, page * pageSize)

  const pages = []
  const maxButtons = 5
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2))
  let endPage = Math.min(totalPages, startPage + maxButtons - 1)
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1)
  }
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-4 py-4 px-3 border-t border-slate-200 mt-3 text-xs bg-white">
      <div className="flex items-center gap-3 text-slate-500">
        <span>
          Showing <strong className="text-slate-900 font-bold">{start}</strong> to{' '}
          <strong className="text-slate-900 font-bold">{end}</strong> of{' '}
          <strong className="text-slate-900 font-bold">{total}</strong> entries
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 px-2 border border-slate-200 rounded-md bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 px-3 rounded-lg border border-slate-200 font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors shadow-2xs"
        >
          Previous
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="h-8 w-8 rounded-lg border border-slate-200 font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 text-slate-400">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-8 w-8 rounded-lg font-bold transition-all shadow-2xs ${
              p === page
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-orange-500/20'
                : 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="h-8 w-8 rounded-lg border border-slate-200 font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 px-3 rounded-lg border border-slate-200 font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors shadow-2xs"
        >
          Next
        </button>
      </div>
    </div>
  )
}
