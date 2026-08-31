import { MessageCircle } from 'lucide-react'
import { useStoreSettings } from '../context/StoreSettingsContext'

export default function WhatsappCTA() {
  const { whatsappNumber, storeName } = useStoreSettings()

  return (
    <section className="bg-ink">
      <div className="container-content px-6 py-8 flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-4">
          <span className="w-11 h-11 rounded-md bg-brand flex items-center justify-center text-white shrink-0">
            <MessageCircle size={20} />
          </span>
          <div>
            <p className="text-brand text-[11px] font-bold tracking-widest">NEED A HAND?</p>
            <p className="text-white font-bold text-[15px] mt-0.5">
              Not sure which part fits? Chat with our team on WhatsApp.
            </p>
            <p className="text-white/50 text-[12px] mt-0.5">
              Instant 24/7 part fitment assistance &amp; direct order support.
            </p>
          </div>
        </div>
        <a
          href={`https://wa.me/${whatsappNumber}?text=Hi%20${encodeURIComponent(storeName)}%2C%20I%20need%20help%20finding%20a%20part.`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 transition-colors text-white text-xs font-bold tracking-widest px-6 h-12 rounded-md shrink-0 shadow-sm"
        >
          <MessageCircle size={15} /> CHAT ON WHATSAPP
        </a>
      </div>
    </section>
  )
}
