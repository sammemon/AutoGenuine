import { X } from 'lucide-react'

export default function Modal({ open, onClose, children, maxWidth = 'max-w-md' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        style={{ animation: 'overlayIn 0.15s ease-out' }}
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[92vh] overflow-y-auto z-10 border border-line/60`}
        style={{ animation: 'popIn 0.18s ease-out' }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-gray-100 hover:text-ink transition-colors z-20"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  )
}
