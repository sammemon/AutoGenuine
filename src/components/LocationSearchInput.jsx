import { useState, useEffect, useRef } from 'react'
import { MapPin, Search, Loader2, Navigation, Check, X } from 'lucide-react'

// Curated instant-match cities for lightning-fast autocomplete before network API responds
const COMMON_CITIES = [
  // Pakistan
  { name: 'Attock', region: 'Punjab', country: 'Pakistan' },
  { name: 'Islamabad', region: 'Federal Capital', country: 'Pakistan' },
  { name: 'Rawalpindi', region: 'Punjab', country: 'Pakistan' },
  { name: 'Lahore', region: 'Punjab', country: 'Pakistan' },
  { name: 'Karachi', region: 'Sindh', country: 'Pakistan' },
  { name: 'Faisalabad', region: 'Punjab', country: 'Pakistan' },
  { name: 'Multan', region: 'Punjab', country: 'Pakistan' },
  { name: 'Peshawar', region: 'Khyber Pakhtunkhwa', country: 'Pakistan' },
  { name: 'Quetta', region: 'Balochistan', country: 'Pakistan' },
  { name: 'Sialkot', region: 'Punjab', country: 'Pakistan' },
  { name: 'Gujranwala', region: 'Punjab', country: 'Pakistan' },
  { name: 'Hyderabad', region: 'Sindh', country: 'Pakistan' },
  { name: 'Abbottabad', region: 'Khyber Pakhtunkhwa', country: 'Pakistan' },
  { name: 'Bahawalpur', region: 'Punjab', country: 'Pakistan' },
  { name: 'Sargodha', region: 'Punjab', country: 'Pakistan' },
  { name: 'Gujrat', region: 'Punjab', country: 'Pakistan' },
  { name: 'Wah Cantt', region: 'Punjab', country: 'Pakistan' },
  { name: 'Taxila', region: 'Punjab', country: 'Pakistan' },
  { name: 'Hasan Abdal', region: 'Punjab', country: 'Pakistan' },
  { name: 'DHA Phase 1-8', region: 'Lahore / Karachi / Islamabad', country: 'Pakistan' },
  { name: 'Bahria Town', region: 'Rawalpindi / Lahore / Karachi', country: 'Pakistan' },
  { name: 'Gulberg', region: 'Lahore', country: 'Pakistan' },
  { name: 'F-6 / F-7 / F-8 / F-10 / F-11', region: 'Islamabad', country: 'Pakistan' },
  { name: 'G-9 / G-10 / G-11 / G-13 / G-15', region: 'Islamabad', country: 'Pakistan' },
  { name: 'I-8 / I-9 / I-10', region: 'Islamabad', country: 'Pakistan' },
  { name: 'Saddar', region: 'Rawalpindi / Karachi', country: 'Pakistan' },

  // Nigeria (OEM Hubs)
  { name: 'Lagos', region: 'Lagos State', country: 'Nigeria' },
  { name: 'Ikeja', region: 'Lagos State', country: 'Nigeria' },
  { name: 'Victoria Island', region: 'Lagos State', country: 'Nigeria' },
  { name: 'Lekki Phase 1', region: 'Lagos State', country: 'Nigeria' },
  { name: 'Abuja', region: 'Federal Capital Territory', country: 'Nigeria' },
  { name: 'Port Harcourt', region: 'Rivers State', country: 'Nigeria' },
  { name: 'Ibadan', region: 'Oyo State', country: 'Nigeria' },
  { name: 'Kano', region: 'Kano State', country: 'Nigeria' },

  // UAE / Middle East & International
  { name: 'Dubai', region: 'Dubai Emirate', country: 'United Arab Emirates' },
  { name: 'Abu Dhabi', region: 'Abu Dhabi Emirate', country: 'United Arab Emirates' },
  { name: 'Sharjah', region: 'Sharjah Emirate', country: 'United Arab Emirates' },
  { name: 'London', region: 'Greater London', country: 'United Kingdom' },
  { name: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
  { name: 'Jeddah', region: 'Makkah Province', country: 'Saudi Arabia' },
]

export default function LocationSearchInput({
  value = '',
  onChange,
  onSelectLocation,
  placeholder = 'Search city, town, sector or address…',
  className = '',
  required = false,
  label = 'City / Region',
}) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search logic with fast local matches + real OpenStreetMap Nominatim geocoding
  const handleSearch = (text) => {
    setQuery(text)
    if (onChange) onChange(text)

    if (!text || text.trim().length < 2) {
      setSuggestions([])
      setDropdownOpen(false)
      return
    }

    const q = text.toLowerCase().trim()

    // 1. Instant local results
    const localMatches = COMMON_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    ).map((c) => ({
      display_name: `${c.name}, ${c.region}, ${c.country}`,
      city: c.name,
      state: c.region,
      country: c.country,
      source: 'local',
    }))

    setSuggestions(localMatches)
    setDropdownOpen(true)

    // 2. Debounced real-world global lookup
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          text
        )}&addressdetails=1&limit=6`
        const res = await fetch(url, {
          headers: {
            'Accept-Language': 'en',
          },
        })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            const apiResults = data.map((item) => {
              const addr = item.address || {}
              const city =
                addr.city ||
                addr.town ||
                addr.village ||
                addr.suburb ||
                addr.county ||
                addr.state_district ||
                item.name
              const state = addr.state || addr.region || ''
              const country = addr.country || ''
              return {
                display_name: item.display_name,
                city: city || text,
                state,
                country,
                full_address: item.display_name,
                source: 'live',
              }
            })

            // Merge unique results
            setSuggestions((prev) => {
              const merged = [...prev]
              apiResults.forEach((apiItem) => {
                if (!merged.some((m) => m.display_name.toLowerCase() === apiItem.display_name.toLowerCase())) {
                  merged.push(apiItem)
                }
              })
              return merged.slice(0, 8)
            })
            setDropdownOpen(true)
          }
        }
      } catch (err) {
        console.warn('Live location lookup offline, using local cities:', err.message)
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  const handleSelect = (item) => {
    const cityName = item.city
      ? `${item.city}${item.state ? ', ' + item.state : ''}`
      : item.display_name.split(',')[0]

    setQuery(cityName)
    setDropdownOpen(false)

    if (onChange) onChange(cityName)
    if (onSelectLocation) {
      onSelectLocation({
        city: cityName,
        fullAddress: item.full_address || item.display_name,
        state: item.state,
        country: item.country,
      })
    }
  }

  // 1-Click GPS Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          )
          if (res.ok) {
            const data = await res.json()
            const addr = data.address || {}
            const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'My Location'
            const formatted = `${city}${addr.state ? ', ' + addr.state : ''}`

            setQuery(formatted)
            if (onChange) onChange(formatted)
            if (onSelectLocation) {
              onSelectLocation({
                city: formatted,
                fullAddress: data.display_name || formatted,
                state: addr.state || '',
                country: addr.country || '',
              })
            }
          }
        } catch (err) {
          console.warn('Reverse geocode failed:', err)
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err.message)
        setLocating(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-black text-muted tracking-widest uppercase">
            {label} {required && <span className="text-brand">*</span>}
          </label>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            className="text-[10px] font-bold text-brand hover:text-brand-600 flex items-center gap-1 transition-colors"
          >
            {locating ? <Loader2 size={11} className="animate-spin" /> : <Navigation size={11} />}
            <span>{locating ? 'Detecting…' : 'Use Current GPS'}</span>
          </button>
        </div>
      )}

      <div className="relative">
        <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          required={required}
          value={query}
          onFocus={() => {
            if (suggestions.length > 0) setDropdownOpen(true)
            else if (!query) handleSearch('')
          }}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-10 rounded-xl border border-line bg-cream/30 text-xs font-semibold text-ink focus:outline-none focus:border-brand shadow-2xs"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted">
          {loading && <Loader2 size={14} className="animate-spin text-brand" />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSuggestions([])
                if (onChange) onChange('')
              }}
              className="p-1 hover:text-ink rounded"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {dropdownOpen && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-line shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-line/60"
          style={{ animation: 'fadeIn 0.12s ease-out' }}
        >
          <div className="p-2 px-3 bg-cream/40 text-[10px] font-black text-muted tracking-wider uppercase flex items-center justify-between">
            <span>Recognized Locations</span>
            <span className="text-[9px] lowercase text-brand font-normal">select to auto-fill</span>
          </div>

          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full p-3 text-left hover:bg-orange-50/50 hover:text-brand transition-colors flex items-start gap-2.5 group"
            >
              <MapPin size={15} className="text-muted group-hover:text-brand shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-ink group-hover:text-brand leading-snug truncate">
                  {item.city || item.display_name.split(',')[0]}
                </p>
                <p className="text-[11px] text-muted truncate mt-0.5">
                  {item.display_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
