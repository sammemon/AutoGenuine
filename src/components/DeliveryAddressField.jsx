import { useState, useEffect, useRef } from 'react'
import { MapPin, Building, Landmark, Compass, Check, X, Sparkles, Navigation } from 'lucide-react'

const POPULAR_LANDMARKS = [
  'Near Central Mosque / Masjid',
  'Opposite Shell / PSO Petrol Pump',
  'Behind Main Commercial Market',
  'Near General / Allied Hospital',
  'Opposite Bank / ATM',
  'Inside Auto Parts Market / Plaza',
  'Near Metro / Bus Station',
  'Near Gate # 1 / Main Entrance',
  'Opposite Government College',
  'Near Water Tank / Chowk',
]

const HOUSE_PREFIXES = ['House #', 'Shop #', 'Plot #', 'Flat #', 'Office #', 'Workshop #', 'Warehouse #']

export default function DeliveryAddressField({
  value = '',
  onChange,
  city = '',
  required = true,
  className = '',
}) {
  // Parse initial address if already composed
  const [houseNo, setHouseNo] = useState('')
  const [street, setStreet] = useState('')
  const [landmark, setLandmark] = useState('')
  const [showLandmarkDropdown, setShowLandmarkDropdown] = useState(false)
  const [showHouseDropdown, setShowHouseDropdown] = useState(false)
  const landmarkRef = useRef(null)
  const houseRef = useRef(null)

  // Initialize from existing composite string once
  useEffect(() => {
    if (value && !houseNo && !street && !landmark) {
      // Check if format contains landmark in parentheses "(Near ...)"
      const landmarkMatch = value.match(/\((Near[^)]+|Opposite[^)]+|Behind[^)]+|Inside[^)]+)\)/i)
      if (landmarkMatch) {
        setLandmark(landmarkMatch[1])
        const rest = value.replace(landmarkMatch[0], '').trim()
        const parts = rest.split(',').map((s) => s.trim()).filter(Boolean)
        if (parts.length > 1) {
          setHouseNo(parts[0])
          setStreet(parts.slice(1).join(', '))
        } else {
          setStreet(rest)
        }
      } else {
        const parts = value.split(',').map((s) => s.trim()).filter(Boolean)
        if (parts.length > 1) {
          setHouseNo(parts[0])
          setStreet(parts.slice(1).join(', '))
        } else {
          setStreet(value)
        }
      }
    }
  }, [value])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (landmarkRef.current && !landmarkRef.current.contains(e.target)) {
        setShowLandmarkDropdown(false)
      }
      if (houseRef.current && !houseRef.current.contains(e.target)) {
        setShowHouseDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sync back composite address
  const updateComposite = (newHouse, newStreet, newLandmark) => {
    const parts = []
    if (newHouse && newHouse.trim()) parts.push(newHouse.trim())
    if (newStreet && newStreet.trim()) parts.push(newStreet.trim())
    let composite = parts.join(', ')
    if (newLandmark && newLandmark.trim()) {
      composite = composite ? `${composite} (${newLandmark.trim()})` : newLandmark.trim()
    }
    if (onChange) onChange(composite)
  }

  const handleHouseChange = (val) => {
    setHouseNo(val)
    updateComposite(val, street, landmark)
  }

  const handleStreetChange = (val) => {
    setStreet(val)
    updateComposite(houseNo, val, landmark)
  }

  const handleLandmarkChange = (val) => {
    setLandmark(val)
    updateComposite(houseNo, street, val)
  }

  const filteredLandmarks = POPULAR_LANDMARKS.filter((l) =>
    l.toLowerCase().includes(landmark.toLowerCase().trim())
  )

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 1. House / Shop / Workshop & Street Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* House / Shop No with smart prefix dropdown */}
        <div className="sm:col-span-4 relative" ref={houseRef}>
          <label className="block text-[11px] font-bold tracking-widest text-muted uppercase mb-1.5 flex items-center justify-between">
            <span>House / Shop # {required && '*'}</span>
          </label>
          <div className="relative">
            <Building size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              required={required}
              value={houseNo}
              onFocus={() => setShowHouseDropdown(true)}
              onChange={(e) => handleHouseChange(e.target.value)}
              placeholder="e.g. House 12, Shop 4"
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-line bg-white text-xs font-semibold text-ink focus:outline-none focus:border-brand shadow-2xs"
            />
          </div>

          {/* Quick House/Shop Prefixes Dropdown */}
          {showHouseDropdown && !houseNo && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-line shadow-xl z-50 p-1.5 divide-y divide-line/60">
              <p className="text-[10px] font-black text-muted px-2 py-1 uppercase tracking-wider">Quick Select</p>
              {HOUSE_PREFIXES.map((prefix) => (
                <button
                  key={prefix}
                  type="button"
                  onClick={() => {
                    handleHouseChange(prefix + ' ')
                    setShowHouseDropdown(false)
                  }}
                  className="w-full p-2 text-left text-xs font-bold text-ink hover:bg-cream/60 hover:text-brand rounded-lg transition-colors"
                >
                  {prefix}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Street / Road / Sector */}
        <div className="sm:col-span-8">
          <label className="block text-[11px] font-bold tracking-widest text-muted uppercase mb-1.5">
            Street / Road / Sector / Area {required && '*'}
          </label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              required={required}
              value={street}
              onChange={(e) => handleStreetChange(e.target.value)}
              placeholder="e.g. Street 4, Sector F-7/2, Main Boulevard"
              className="w-full h-11 pl-9 pr-4 rounded-xl border border-line bg-white text-xs font-semibold text-ink focus:outline-none focus:border-brand shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* 2. Nearby Landmark (Searchable & 1-Click Suggestions) */}
      <div className="relative" ref={landmarkRef}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-bold tracking-widest text-muted uppercase flex items-center gap-1.5">
            <Landmark size={13} className="text-brand" /> Nearby Landmark / Famous Place (Optional)
          </label>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Helps Courier Find You Fast
          </span>
        </div>

        <div className="relative">
          <Landmark size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={landmark}
            onFocus={() => setShowLandmarkDropdown(true)}
            onChange={(e) => {
              handleLandmarkChange(e.target.value)
              setShowLandmarkDropdown(true)
            }}
            placeholder="Type or search nearby landmark (e.g. Near Bilal Masjid, Shell Pump, Commercial Market)…"
            className="w-full h-11 pl-9 pr-9 rounded-xl border border-line bg-white text-xs font-semibold text-ink focus:outline-none focus:border-brand shadow-2xs"
          />

          {landmark && (
            <button
              type="button"
              onClick={() => handleLandmarkChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Landmark Quick Autocomplete Dropdown */}
        {showLandmarkDropdown && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-line shadow-2xl z-50 p-2 max-h-48 overflow-y-auto divide-y divide-line/60">
            <p className="text-[10px] font-black text-muted px-2.5 py-1 uppercase tracking-wider">
              Popular Delivery Landmarks
            </p>
            {filteredLandmarks.length === 0 ? (
              <div className="p-2.5 text-xs text-muted">
                Custom landmark: <span className="font-bold text-ink">{landmark}</span>
              </div>
            ) : (
              filteredLandmarks.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    handleLandmarkChange(item)
                    setShowLandmarkDropdown(false)
                  }}
                  className="w-full p-2.5 text-left text-xs font-bold text-ink hover:bg-orange-50/60 hover:text-brand rounded-xl transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Landmark size={13} className="text-brand shrink-0" />
                    {item}
                  </span>
                  <span className="text-[10px] text-muted font-normal">Select</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* 1-Click Popular Landmark Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Quick:</span>
          {[
            { label: '🕌 Mosque', text: 'Near Main Mosque / Masjid' },
            { label: '⛽ Petrol Pump', text: 'Near Petrol Pump' },
            { label: '🏥 Hospital', text: 'Near Hospital / Clinic' },
            { label: '🏬 Auto Market', text: 'Inside Auto Parts Market' },
            { label: '🏦 Bank / ATM', text: 'Near Bank / ATM' },
            { label: '🚪 Main Gate', text: 'Near Main Gate / Chowk' },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleLandmarkChange(chip.text)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-line/80 bg-cream/50 hover:bg-orange-50 hover:border-brand hover:text-brand text-ink/80 transition-colors shadow-2xs"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Full Address Preview / Confirmation */}
      {(houseNo || street || landmark) && (
        <div className="p-2.5 px-3 bg-cream/40 rounded-xl border border-line/80 flex items-start gap-2 text-xs">
          <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black text-muted uppercase tracking-wider block">
              Complete Delivery Address Preview:
            </span>
            <p className="font-bold text-ink text-xs truncate">
              {[houseNo, street].filter(Boolean).join(', ')} {landmark ? `(${landmark})` : ''} {city ? `• ${city}` : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
