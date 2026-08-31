import { useState, useEffect } from 'react'
import { ImageOff } from 'lucide-react'

export default function SafeImage({ src, alt, className = '', imgClassName = '' }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-cream to-cream-light text-brand/40 ${className}`}
        role="img"
        aria-label={alt}
      >
        <ImageOff size={28} strokeWidth={1.3} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} ${imgClassName}`}
    />
  )
}
