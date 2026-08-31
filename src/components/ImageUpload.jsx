import { useState, useRef, useEffect } from 'react'
import { UploadCloud, Image as ImageIcon, X, RefreshCw, AlertCircle, Loader2, Check } from 'lucide-react'
import { upload as uploadAPI } from '../services/api'
import { validateImageFile, formatBytes } from '../utils/validation'
import { resolveImageUrl } from '../utils/imageUrl'

export default function ImageUpload({
  value = '',
  onChange,
  label = 'Upload Image',
  helperText = 'JPG, PNG, WEBP • Max 5 MB',
  shape = 'rounded', // 'rounded' | 'circle' (for avatars)
  className = '',
}) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [fileMeta, setFileMeta] = useState(null)
  const inputRef = useRef(null)

  // Derive display filename for existing images
  const displayFileName = fileMeta?.name || (
    value
      ? value.includes('googleusercontent.com')
        ? 'Google Profile Photo'
        : value.includes('dicebear.com')
        ? 'Default Generated Avatar'
        : value.split('/').pop()
      : ''
  )
  const displayFileSize = fileMeta?.size ? formatBytes(fileMeta.size) : null

  // Reset fileMeta when value is cleared externally
  useEffect(() => {
    if (!value) {
      setFileMeta(null)
    }
  }, [value])

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return
    const file = files[0]

    // Client-side validation
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setError('')
    setUploading(true)

    try {
      const res = await uploadAPI.image(file)
      setFileMeta({
        name: file.name,
        size: file.size,
      })
      if (onChange) {
        onChange(res.url)
      }
    } catch (err) {
      setError(err.message || 'Image upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleInputChange = (e) => {
    if (e.target?.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const triggerSelect = () => {
    if (uploading) return
    inputRef.current?.click()
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    if (uploading) return
    setError('')
    setFileMeta(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    if (onChange) {
      onChange('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      triggerSelect()
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <span className="block text-[11px] font-bold tracking-widest text-muted mb-1.5 uppercase">
          {label}
        </span>
      )}

      {/* Hidden Native File Input */}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Error Message */}
      {error && (
        <div className="mb-2.5 px-3 py-2 rounded-md bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs font-semibold">
          <AlertCircle size={15} className="shrink-0 text-red-600" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-800 p-0.5 rounded"
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* State 1: Uploading Spinner State */}
      {uploading && (
        <div className="border-2 border-dashed border-brand bg-brand/5 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[140px] animate-pulse">
          <Loader2 size={30} className="text-brand animate-spin mb-2" />
          <p className="text-xs font-bold text-ink uppercase tracking-wider">Uploading image…</p>
          <p className="text-[11px] text-muted mt-1">Please wait while the file is processed</p>
        </div>
      )}

      {/* State 2: Existing or Uploaded Image Preview */}
      {!uploading && value && (
        <div className="bg-white border border-line rounded-2xl p-4 flex items-center gap-4 shadow-xs hover:border-line-dark transition-all">
          <div
            className={`w-16 h-16 min-w-[64px] min-h-[64px] max-w-[64px] max-h-[64px] shrink-0 bg-cream overflow-hidden border-2 border-white ring-2 ring-line shadow-xs flex items-center justify-center aspect-square ${
              shape === 'circle' ? 'rounded-full' : 'rounded-xl'
            }`}
          >
            <img
              src={resolveImageUrl(value)}
              referrerPolicy="no-referrer"
              alt="Preview"
              className={`w-full h-full object-cover aspect-square ${shape === 'circle' ? 'rounded-full' : 'rounded-xl'}`}
              onError={(e) => {
                // If broken, show icon fallback
                e.target.style.display = 'none'
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex'
                }
              }}
            />
            <div className="hidden w-full h-full items-center justify-center text-muted">
              <ImageIcon size={22} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink truncate mb-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Check size={11} className="text-emerald-600 shrink-0" />
                {value.includes('googleusercontent.com')
                  ? 'Google Profile Photo'
                  : 'Profile Photo Active'}
              </span>
            </div>
            {displayFileSize && (
              <p className="text-[11px] text-muted mb-2 font-medium">{displayFileSize}</p>
            )}

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={triggerSelect}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-[11px] font-bold text-ink hover:border-brand hover:text-brand bg-cream/40 hover:bg-cream transition-colors shadow-2xs"
              >
                <RefreshCw size={11} /> Change Photo
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-[11px] font-bold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-2xs"
              >
                <X size={11} /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State 3: Empty Dropzone / Selector */}
      {!uploading && !value && (
        <div
          role="button"
          tabIndex={0}
          onClick={triggerSelect}
          onKeyDown={handleKeyDown}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          aria-label={label}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-brand/30 ${
            dragActive
              ? 'border-brand bg-brand/10 scale-[0.99]'
              : 'border-line hover:border-brand/70 hover:bg-cream/40 bg-white'
          }`}
        >
          <div className="w-10 h-10 mx-auto rounded-full bg-brand/10 text-brand flex items-center justify-center mb-2">
            <UploadCloud size={20} />
          </div>
          <p className="text-xs font-bold text-ink uppercase tracking-wider">
            {label}
          </p>
          <p className="text-[12px] text-muted mt-0.5 font-medium">
            Click to browse or drag & drop
          </p>
          <p className="text-[10px] text-muted/80 mt-1 font-semibold uppercase tracking-widest">
            {helperText}
          </p>
        </div>
      )}
    </div>
  )
}
