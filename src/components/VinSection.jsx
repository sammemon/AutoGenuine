import { useState } from 'react'
import { ScanLine, CheckCircle2, Lock, AlertCircle } from 'lucide-react'

const checks = [
  'Instant OEM/aftermarket match',
  'Auto-fills Make / Model / Year',
  'Highlights compatible parts only',
  'Free — no account required',
]

export default function VinSection() {
  const [vin, setVin] = useState('')
  const [result, setResult] = useState(null) // null | 'valid' | 'invalid'

  function handleCheck() {
    if (vin.trim().length !== 17) {
      setResult('invalid')
      return
    }
    setResult('valid')
  }

  return (
    <section id="vin" className="relative bg-ink overflow-hidden">
      {/* Orange diagonal fill on the right half */}
      <div
        className="absolute inset-y-0 right-0 w-full md:w-[46%] bg-brand"
        style={{ clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0% 100%)' }}
      />

      <div className="container-content relative px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="flex items-center gap-2 text-brand text-[11px] font-bold tracking-widest mb-3">
            <ScanLine size={13} /> VIN FITMENT CHECK
          </p>
          <h2 className="text-white font-black text-3xl md:text-[2.15rem] leading-tight tracking-tight uppercase">
            Never buy the <span className="text-brand">wrong part</span> again.
          </h2>
          <p className="mt-4 max-w-md text-white/60 text-[15px] leading-relaxed">
            Enter your 17-character VIN and we'll check compatibility against the official NHTSA database before you add to cart. No guessing. No returns for wrong fitment.
          </p>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {checks.map((c) => (
              <p key={c} className="flex items-center gap-2 text-white/80 text-[13px] font-medium">
                <CheckCircle2 size={15} className="text-brand shrink-0" /> {c}
              </p>
            ))}
          </div>
        </div>

        <div className="relative bg-white rounded-md shadow-2xl p-7 max-w-[420px] md:ml-auto w-full">
          <p className="text-brand text-[11px] font-bold tracking-widest mb-2">CHECK COMPATIBILITY</p>
          <h3 className="text-ink font-black text-xl">Enter your VIN</h3>

          <div className="mt-5 flex">
            <input
              type="text"
              value={vin}
              onChange={(e) => {
                setVin(e.target.value.toUpperCase().slice(0, 17))
                setResult(null)
              }}
              placeholder="e.g. 4T1BF1FK0HU123456"
              maxLength={17}
              className="flex-1 border border-line rounded-l-md h-12 px-4 text-sm placeholder:text-muted/60 focus:outline-none focus:border-brand"
            />
            <button
              onClick={handleCheck}
              className="px-5 bg-ink text-white text-xs font-bold tracking-widest rounded-r-md hover:bg-ink-soft transition-colors shrink-0"
            >
              CHECK
            </button>
          </div>

          {result === 'valid' && (
            <div className="mt-4 flex items-start gap-2 bg-brand/10 text-brand text-[12px] font-semibold rounded-md px-3 py-2.5">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              VIN recognized. Matching parts have been filtered to your exact vehicle.
            </div>
          )}
          {result === 'invalid' && (
            <div className="mt-4 flex items-start gap-2 bg-red-50 text-red-600 text-[12px] font-semibold rounded-md px-3 py-2.5">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              VINs are exactly 17 characters. Double-check and try again.
            </div>
          )}

          <p className="flex items-center gap-1.5 text-muted text-[12px] mt-3">
            <Lock size={12} /> Your VIN is only used for fitment — never shared.
          </p>
        </div>
      </div>
    </section>
  )
}
