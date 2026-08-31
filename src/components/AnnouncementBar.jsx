import { Truck, RotateCcw, Phone, ShieldCheck, Star } from 'lucide-react'
import { useStoreSettings } from '../context/StoreSettingsContext'

const messages = [
  { icon: Truck, text: 'Same-Day Express Delivery · Nationwide Dispatch' },
  { icon: RotateCcw, text: '30-Day Fitment Guarantee & Easy Returns' },
  { icon: ShieldCheck, text: '100% Genuine OEM-Certified Parts' },
  { icon: Star, text: 'Trusted by Automotive Enthusiasts & Garages' },
]

function Track() {
  return (
    <div className="flex items-center gap-10 pr-10 shrink-0">
      {messages.map((m, i) => (
        <span key={i} className="flex items-center gap-1.5 text-white/90 whitespace-nowrap">
          <m.icon size={13} className="text-brand shrink-0" />
          {m.text}
        </span>
      ))}
    </div>
  )
}

export default function AnnouncementBar() {
  const { whatsappNumber, whatsappDisplay, settings } = useStoreSettings()
  const isPromoActive = settings?.activePromoCampaign?.enabled

  return (
    <div className={`${isPromoActive ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 animate-gradient-x' : 'bg-ink'} text-white text-[12px] shadow-sm`}>
      <div className="container-content flex items-center px-4 md:px-6 h-8 gap-4">
        <div className="flex-1 min-w-0 overflow-hidden">
          {isPromoActive ? (
            <div className="flex items-center gap-2 text-white font-black uppercase text-[11px] tracking-wider truncate">
              <span className="bg-white text-orange-700 px-2 py-0.5 rounded-full font-black text-[10px] shadow-xs shrink-0 animate-pulse">🔥 FLASH SALE LIVE</span>
              <span className="truncate">{settings.activePromoCampaign?.bannerText || settings.announcement}</span>
            </div>
          ) : (
            <div className="flex w-max animate-marquee">
              <Track />
              <Track />
            </div>
          )}
        </div>
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-white/90 hover:text-brand transition-colors shrink-0 font-bold"
        >
          <Phone size={13} />
          WhatsApp: {whatsappDisplay}
        </a>
      </div>
    </div>
  )
}
