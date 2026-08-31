import { useEffect, useState } from 'react'
import { Save, MessageCircle, ExternalLink, ShieldCheck } from 'lucide-react'
import { admin as adminAPI } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { useStoreSettings } from '../../context/StoreSettingsContext'
import { sanitizeDigits } from '../../utils/validation'
import { SectionHeader, DataState, Field, BtnPrimary } from './ui'

export default function SettingsSection() {
  const { showToast } = useToast()
  const { refreshSettings } = useStoreSettings()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminAPI.getSettings()
      .then((data) => {
        setForm({
          ...data,
          whatsappNumber: data.whatsappNumber || '+923213498203',
        })
      })
      .catch((e) => setError(e.message || 'Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await adminAPI.updateSettings(form)
      await refreshSettings()
      showToast('Store settings & WhatsApp number updated across website!')
    } catch (err) {
      showToast(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const cleanWaDigits = (form?.whatsappNumber || '').replace(/\D/g, '')

  return (
    <>
      <SectionHeader
        title="Store Settings"
        subtitle="Store-wide configuration & direct WhatsApp integration — only the Store Owner can change these."
      />

      <DataState loading={loading} error={error}>
        {form && (
          <form onSubmit={save} className="max-w-2xl bg-white rounded-xl border border-line p-6 space-y-4 shadow-xs">
            {/* Store Name & Tagline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Store Name" value={form.storeName || ''} onChange={(e) => set('storeName', e.target.value)} />
              <Field label="Tagline" value={form.tagline || ''} onChange={(e) => set('tagline', e.target.value)} />
            </div>

            {/* DEDICATED WHATSAPP SUPPORT NUMBER INTEGRATION */}
            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold tracking-widest text-emerald-900 uppercase flex items-center gap-1.5">
                  <MessageCircle size={15} className="text-emerald-700 shrink-0" />
                  WhatsApp Direct Support &amp; Orders Number
                </label>
                {cleanWaDigits && (
                  <a
                    href={`https://wa.me/${cleanWaDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-emerald-200"
                  >
                    Test Number <ExternalLink size={11} />
                  </a>
                )}
              </div>
              <input
                type="text"
                value={form.whatsappNumber || ''}
                onChange={(e) => set('whatsappNumber', e.target.value)}
                placeholder="+923213498203 or +92 321 3498203"
                className="w-full border border-emerald-300 rounded-lg px-3.5 h-11 text-xs font-bold text-ink bg-white focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
              <p className="text-[11px] text-emerald-800/80 font-medium">
                Changing this number automatically updates the WhatsApp order desk, header, footer, contact page, and live order tracking everywhere on the website.
              </p>
            </div>

            {/* Email and Support Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Support Email" type="email" value={form.supportEmail || ''} onChange={(e) => set('supportEmail', e.target.value)} />
              <Field label="Support Phone" value={form.supportPhone || ''} onChange={(e) => set('supportPhone', e.target.value)} />
            </div>

            {/* Store Address */}
            <label className="block">
              <span className="block text-[11px] font-bold tracking-widest text-muted mb-1.5 uppercase">Store Address</span>
              <textarea
                rows={2}
                value={form.address || ''}
                onChange={(e) => set('address', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:border-brand"
              />
            </label>

            {/* Currency, Shipping & Tax */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Currency" value={form.currency || 'PKR'} onChange={(e) => set('currency', e.target.value)} />
              <Field
                label="Shipping Fee"
                type="text"
                inputMode="numeric"
                value={form.shippingFee ?? 0}
                onChange={(e) => set('shippingFee', Number(sanitizeDigits(e.target.value)))}
              />
              <Field
                label="Free Over"
                type="text"
                inputMode="numeric"
                value={form.freeShippingOver ?? 0}
                onChange={(e) => set('freeShippingOver', Number(sanitizeDigits(e.target.value)))}
              />
              <Field
                label="Tax %"
                type="text"
                inputMode="numeric"
                value={form.taxRate ?? 0}
                onChange={(e) => {
                  const num = Number(sanitizeDigits(e.target.value))
                  if (num <= 100) set('taxRate', num)
                }}
              />
            </div>

            {/* Announcement Banner */}
            <label className="block">
              <span className="block text-[11px] font-bold tracking-widest text-muted mb-1.5 uppercase">Announcement Banner</span>
              <textarea
                rows={2}
                placeholder="e.g. Free shipping on orders over Rs 10,000"
                value={form.announcement || ''}
                onChange={(e) => set('announcement', e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:border-brand"
              />
            </label>

            <div className="flex justify-end pt-2">
              <BtnPrimary type="submit" disabled={saving}>
                <Save size={15} /> {saving ? 'SAVING…' : 'SAVE SETTINGS'}
              </BtnPrimary>
            </div>
          </form>
        )}
      </DataState>
    </>
  )
}
