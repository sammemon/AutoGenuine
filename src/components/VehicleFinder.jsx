import { useEffect, useMemo, useState } from 'react'
import { Truck, ChevronDown, Wrench, Calendar, ArrowRight } from 'lucide-react'
import { vehicleData as staticVehicleData, getModels as staticGetModels, getYears as staticGetYears } from '../data/vehicleData'
import { catalog } from '../services/api'
import { useToast } from '../context/ToastContext'
import { useNav } from '../context/NavContext'

export default function VehicleFinder() {
  const { showToast } = useToast()
  const { navigate } = useNav()
  const [dbVehicles, setDbVehicles] = useState([])
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [vin, setVin] = useState('')

  // Fetch real-time vehicles from MongoDB
  useEffect(() => {
    catalog.getVehicles()
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setDbVehicles(data)
        }
      })
      .catch(() => { /* keep static fallback */ })
  }, [])

  // Available Makes from DB or static
  const availableMakes = useMemo(() => {
    if (dbVehicles.length > 0) {
      return dbVehicles.map((m) => m.make)
    }
    return Object.keys(staticVehicleData)
  }, [dbVehicles])

  // Available Models for selected Make
  const availableModels = useMemo(() => {
    if (!make) return []
    if (dbVehicles.length > 0) {
      const foundMake = dbVehicles.find((m) => m.make.toLowerCase() === make.toLowerCase())
      if (foundMake && Array.isArray(foundMake.models)) {
        return foundMake.models.map((m) => m.model)
      }
    }
    return staticGetModels(make)
  }, [make, dbVehicles])

  // Available Years for selected Make & Model
  const availableYears = useMemo(() => {
    if (!make || !model) return []
    if (dbVehicles.length > 0) {
      const foundMake = dbVehicles.find((m) => m.make.toLowerCase() === make.toLowerCase())
      if (foundMake && Array.isArray(foundMake.models)) {
        const foundModel = foundMake.models.find((m) => m.model.toLowerCase() === model.toLowerCase())
        if (foundModel) {
          const from = Number(foundModel.from) || 2000
          const to = Number(foundModel.to) || new Date().getFullYear()
          const list = []
          for (let y = to; y >= from; y--) {
            list.push(String(y))
          }
          if (list.length) return list
        }
      }
    }
    return staticGetYears(make, model)
  }, [make, model, dbVehicles])

  function handleMakeChange(e) {
    setMake(e.target.value)
    setModel('')
    setYear('')
  }

  function handleModelChange(e) {
    setModel(e.target.value)
    setYear('')
  }

  function handleShowParts() {
    if (!make || !model) {
      showToast('Please select a vehicle make and model.')
      return
    }
    const vehicleLabel = `${year ? `${year} ` : ''}${make} ${model}`.trim()
    showToast(`Showing parts for ${vehicleLabel}`)
    navigate('category', { id: 'all', search: `${make} ${model}`, vehicleLabel })
  }

  function handleVinCheck() {
    if (vin.trim().length !== 17) {
      showToast('Enter a valid 17-character VIN.')
      return
    }
    showToast('VIN verified — filtering compatible genuine parts.')
    navigate('category', { id: 'all', search: vin.trim() })
  }

  return (
    <div className="w-full max-w-[400px] bg-white rounded-md shadow-2xl overflow-hidden">
      <div className="bg-brand px-6 py-3.5 flex items-center gap-2 text-white">
        <Truck size={16} />
        <div className="leading-tight">
          <p className="text-[10px] font-bold tracking-widest">GUIDED FITMENT</p>
          <p className="text-sm font-bold">Find parts for your vehicle</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-[11px] font-bold tracking-widest text-muted mb-1.5">MAKE</label>
          <div className="relative">
            <select
              value={make}
              onChange={handleMakeChange}
              className="w-full appearance-none border border-line rounded-md h-11 pl-4 pr-9 text-sm font-medium text-ink focus:outline-none focus:border-brand cursor-pointer bg-white"
            >
              <option value="">Select make</option>
              {availableMakes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold tracking-widest text-muted mb-1.5">MODEL</label>
          <div className="relative">
            <Wrench size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <select
              value={model}
              onChange={handleModelChange}
              disabled={!make}
              className="w-full appearance-none border border-line rounded-md h-11 pl-9 pr-9 text-sm text-ink focus:outline-none focus:border-brand disabled:bg-line/30 disabled:cursor-not-allowed cursor-pointer bg-white"
            >
              <option value="">{make ? 'Select model' : 'Select make first'}</option>
              {availableModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold tracking-widest text-muted mb-1.5">YEAR</label>
          <div className="relative">
            <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={!model}
              className="w-full appearance-none border border-line rounded-md h-11 pl-9 pr-9 text-sm text-ink focus:outline-none focus:border-brand disabled:bg-line/30 disabled:cursor-not-allowed cursor-pointer bg-white"
            >
              <option value="">{model ? 'Select year (optional)' : 'Select model first'}</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
        </div>

        <button
          onClick={handleShowParts}
          className="w-full h-11 bg-ink text-white text-xs font-bold tracking-widest rounded-md hover:bg-ink-soft transition-colors"
        >
          SHOW COMPATIBLE PARTS
        </button>

        <div className="flex items-center gap-3 text-[11px] font-semibold text-muted">
          <span className="flex-1 h-px bg-line" />
          OR
          <span className="flex-1 h-px bg-line" />
        </div>

        <div>
          <label className="block text-[11px] font-bold tracking-widest text-muted mb-1.5">ENTER VIN (17 CHARACTERS)</label>
          <div className="flex">
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase().slice(0, 17))}
              placeholder="1HGBH41JXMN109186"
              maxLength={17}
              className="flex-1 border border-line rounded-l-md h-11 px-4 text-sm tracking-wide placeholder:text-muted/60 focus:outline-none focus:border-brand"
            />
            <button
              onClick={handleVinCheck}
              className="w-11 h-11 bg-brand text-white rounded-r-md flex items-center justify-center hover:bg-brand-600 transition-colors shrink-0"
            >
              <ArrowRight size={16} />
            </button>
          </div>
          <p className="text-[11px] text-muted mt-2">Powered by NHTSA — we auto-detect your car's specs.</p>
        </div>
      </div>
    </div>
  )
}
