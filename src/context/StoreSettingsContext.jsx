import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { catalog as catalogAPI } from '../services/api'

const StoreSettingsContext = createContext(null)

const DEFAULT_SETTINGS = {
  storeName: 'AutoGenuine',
  tagline: 'OEM GENUINE PARTS',
  supportEmail: 'support@autogenuine.com',
  supportPhone: '+92 321 3498203',
  whatsappNumber: '+923213498203',
  address: '42 Main Boulevard, Gulberg III, Lahore, Pakistan',
  currency: 'PKR',
  shippingFee: 0,
  freeShippingOver: 0,
  taxRate: 0,
  announcement: 'GENUINE OEM TOYOTA PARTS • NATIONWIDE EXPRESS DISPATCH',
}

// Clean phone digits for wa.me URL
export function cleanWhatsAppDigits(val) {
  if (!val) return '923213498203'
  const digits = String(val).replace(/\D/g, '')
  return digits || '923213498203'
}

// Format phone for UI display
export function formatWhatsAppDisplay(val) {
  const digits = cleanWhatsAppDigits(val)
  if (digits.startsWith('92') && digits.length === 12) {
    return `+92 ${digits.slice(2, 5)} ${digits.slice(5)}`
  }
  return val.startsWith('+') ? val : `+${val}`
}

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const refreshSettings = useCallback(async () => {
    try {
      const data = await catalogAPI.getSettings()
      if (data && typeof data === 'object') {
        setSettings((prev) => ({ ...prev, ...data }))
      }
    } catch (err) {
      console.warn('Could not load live store settings, using defaults:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  const whatsappNumber = useMemo(() => cleanWhatsAppDigits(settings.whatsappNumber), [settings.whatsappNumber])
  const whatsappDisplay = useMemo(() => formatWhatsAppDisplay(settings.whatsappNumber || '+923213498203'), [settings.whatsappNumber])

  const value = useMemo(() => ({
    settings,
    loading,
    whatsappNumber,
    whatsappDisplay,
    supportPhone: settings.supportPhone || whatsappDisplay,
    supportEmail: settings.supportEmail || DEFAULT_SETTINGS.supportEmail,
    storeName: settings.storeName || DEFAULT_SETTINGS.storeName,
    announcement: settings.announcement || DEFAULT_SETTINGS.announcement,
    refreshSettings,
  }), [settings, loading, whatsappNumber, whatsappDisplay, refreshSettings])

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  )
}

export function useStoreSettings() {
  const ctx = useContext(StoreSettingsContext)
  if (!ctx) {
    return {
      settings: DEFAULT_SETTINGS,
      whatsappNumber: '923213498203',
      whatsappDisplay: '+92 321 3498203',
      supportPhone: '+92 321 3498203',
      supportEmail: 'support@autogenuine.com',
      storeName: 'AutoGenuine',
      announcement: 'GENUINE OEM TOYOTA PARTS • NATIONWIDE EXPRESS DISPATCH',
      refreshSettings: () => Promise.resolve(),
    }
  }
  return ctx
}
