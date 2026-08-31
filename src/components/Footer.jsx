import { ShieldCheck, Lock } from 'lucide-react'
import { useNav } from '../context/NavContext'
import { useStoreSettings } from '../context/StoreSettingsContext'

export default function Footer() {
  const { navigate, page } = useNav()
  const { whatsappNumber, whatsappDisplay, storeName, tagline } = useStoreSettings()

  const columns = [
    {
      title: 'CUSTOMER CARE',
      links: [
        { label: 'Track My Order', page: 'track' },
        { label: '30-Day Return Policy', anchor: 'returns' },
        { label: 'FAQs', anchor: 'returns' },
        { label: `WhatsApp Desk (${whatsappDisplay})`, external: `https://wa.me/${whatsappNumber}` },
      ],
    },
    {
      title: 'SHOP',
      links: [
        { label: 'Shop by Vehicle', page: 'vehicles' },
        { label: 'All Categories', page: 'category', params: { id: 'brakes' } },
        { label: 'Toyota Camry Parts', page: 'category', params: { id: 'brakes', vehicleLabel: 'Toyota Camry' } },
        { label: 'Toyota Corolla Parts', page: 'category', params: { id: 'filters', vehicleLabel: 'Toyota Corolla' } },
        { label: 'Toyota Hilux Parts', page: 'category', params: { id: 'suspension', vehicleLabel: 'Toyota Hilux' } },
      ],
    },
    {
      title: 'ABOUT',
      links: [
        { label: 'About Us', page: 'about' },
        { label: 'Contact Us', page: 'contact' },
        { label: 'Direct WhatsApp Chat', external: `https://wa.me/${whatsappNumber}` },
      ],
    },
  ]

  return (
    <footer className="bg-white">
      <div className="container-content px-6 py-14 grid md:grid-cols-[2fr,1fr,1fr,1fr] gap-10 md:gap-8">
        <div>
          <span className="flex items-center gap-2.5">
            <button onClick={() => navigate('home')} className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-md bg-brand flex items-center justify-center text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  <circle cx="7.5" cy="17" r="1.4" fill="currentColor"/>
                  <circle cx="16.5" cy="17" r="1.4" fill="currentColor"/>
                </svg>
              </span>
              <span className="leading-tight">
                <span className="block font-black text-base tracking-tight text-ink uppercase">{storeName}</span>
                <span className="block text-[9px] font-semibold tracking-widest text-muted -mt-0.5 uppercase">{tagline}</span>
              </span>
            </button>
          </span>
          <p className="mt-4 text-muted text-[13px] leading-relaxed max-w-xs">
            Genuine OEM auto parts marketplace. Direct fitment warranty, verified compatibility, nationwide express delivery.
          </p>
          <div className="flex items-center gap-3 mt-5">
            <span className="flex items-center gap-1.5 bg-cream text-ink text-[11px] font-bold px-3 py-1.5 rounded">
              <ShieldCheck size={13} className="text-brand" /> GENUINE &amp; OEM
            </span>
            <span className="flex items-center gap-1.5 bg-cream text-ink text-[11px] font-bold px-3 py-1.5 rounded">
              <Lock size={13} className="text-brand" /> SECURE CHECKOUT
            </span>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-brand text-[11px] font-bold tracking-widest mb-4">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a
                      href={l.external}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink/80 text-[13px] font-medium hover:text-brand transition-colors"
                    >
                      {l.label}
                    </a>
                  ) : l.page ? (
                    <button
                      onClick={() => navigate(l.page, l.params)}
                      className="text-ink/80 text-[13px] font-medium hover:text-brand transition-colors text-left"
                    >
                      {l.label}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (page !== 'home') navigate('home')
                        setTimeout(() => document.getElementById(l.anchor)?.scrollIntoView({ behavior: 'smooth' }), 60)
                      }}
                      className="text-ink/80 text-[13px] font-medium hover:text-brand transition-colors text-left"
                    >
                      {l.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-content px-6 h-14 flex items-center justify-between flex-wrap gap-3">
          <p className="text-muted text-[12px]">© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <p className="text-muted text-[12px] font-medium">
            Credit &amp; Debit Card · Bank Transfer · Cash on Delivery · WhatsApp Concierge
          </p>
        </div>
      </div>
    </footer>
  )
}
