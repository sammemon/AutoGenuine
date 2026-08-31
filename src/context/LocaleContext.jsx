import { createContext, useContext, useState, useMemo, useEffect } from 'react'

const LocaleContext = createContext(null)

const STORAGE_KEY = 'autogenuine_locale'

// Product prices are stored in PKR (the base currency). `rate` converts 1 PKR
// into each currency; `decimals` controls how the converted amount is shown.
// Rates are approximate/demo values — swap in a live FX feed for production.
const CURRENCIES = {
  PKR: { symbol: 'Rs', locale: 'en-PK', name: 'Pakistani Rupee', rate: 1, decimals: 0 },
  NGN: { symbol: '₦', locale: 'en-NG', name: 'Nigerian Naira', rate: 5.7, decimals: 0 },
  USD: { symbol: '$', locale: 'en-US', name: 'US Dollar', rate: 0.0036, decimals: 2 },
  GBP: { symbol: '£', locale: 'en-GB', name: 'British Pound', rate: 0.0028, decimals: 2 },
  EUR: { symbol: '€', locale: 'de-DE', name: 'Euro', rate: 0.0033, decimals: 2 },
}

const COUNTRIES = {
  PK: { name: 'Pakistan', currency: 'PKR', phoneCode: '+92', phoneLength: 10 },
  NG: { name: 'Nigeria', currency: 'NGN', phoneCode: '+234', phoneLength: 10 },
  US: { name: 'United States', currency: 'USD', phoneCode: '+1', phoneLength: 10 },
  GB: { name: 'United Kingdom', currency: 'GBP', phoneCode: '+44', phoneLength: 10 },
  DE: { name: 'Germany', currency: 'EUR', phoneCode: '+49', phoneLength: 10 },
}

export function LocaleProvider({ children }) {
  const [country, setCountry] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.country || 'PK'
      }
    } catch {}
    return 'PK' // Default to Pakistan
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ country }))
    } catch {}
  }, [country])

  const countryData = COUNTRIES[country]
  const currency = countryData.currency
  const currencyData = CURRENCIES[currency]

  // Convert a base-PKR amount into the active currency.
  function convert(value) {
    return (Number(value) || 0) * currencyData.rate
  }

  function formatPrice(value) {
    const converted = convert(value)
    const formatted = converted.toLocaleString(currencyData.locale, {
      minimumFractionDigits: currencyData.decimals,
      maximumFractionDigits: currencyData.decimals,
    })
    return `${currencyData.symbol}${formatted}`
  }

  function formatPhone(phone) {
    // Remove non-digits
    const digits = phone.replace(/\D/g, '')
    if (!digits) return ''

    // If starts with country code, keep it; otherwise prepend
    if (digits.startsWith(countryData.phoneCode.replace('+', ''))) {
      return `+${digits}`
    }
    return `${countryData.phoneCode}${digits}`
  }

  function validatePhone(phone) {
    const raw = String(phone).trim()
    if (!raw) return null // empty handled by the caller (field is required in the form)
    // Reject anything that isn't phone-shaped — this is what stops an email (or
    // any text with letters / an @) from being accepted in the phone field.
    // Allowed: an optional leading +, digits, spaces, dashes and parentheses.
    if (!/^\+?[\d\s\-()]+$/.test(raw)) {
      return 'Enter a valid phone number — digits only'
    }
    const digits = raw.replace(/\D/g, '')
    if (digits.length < countryData.phoneLength) {
      return `Phone must be at least ${countryData.phoneLength} digits`
    }
    if (digits.length > 15) {
      return 'Phone number is too long'
    }
    return null
  }

  const value = useMemo(() => ({
    country,
    setCountry,
    countryData,
    currency,
    currencyData,
    formatPrice,
    convert,
    formatPhone,
    validatePhone,
    countries: COUNTRIES,
    currencies: CURRENCIES,
  }), [country, countryData, currency, currencyData])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
