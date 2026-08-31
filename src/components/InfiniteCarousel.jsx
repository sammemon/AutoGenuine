import { useRef, useState, useLayoutEffect, useCallback, memo } from 'react'

/**
 * Seamless, GPU-accelerated infinite auto-scroll carousel (right -> left).
 *
 * - Pure CSS transform animation (translate3d) — no per-frame React re-renders.
 * - Pauses at the exact current position on hover / keyboard focus, resumes
 *   from that same position (CSS animation-play-state never resets).
 * - Auto-clones the item list enough times to fill any viewport width, then
 *   measures the true pixel period so the loop restart is invisible.
 *
 * Props:
 *   items       - array of data objects
 *   renderItem  - (item, index) => ReactNode  (the ORIGINAL card, unchanged)
 *   speed       - scroll speed in pixels/second (higher = faster)
 *   gap         - horizontal gap between cards, in px
 *   itemClassName - wrapper class applied to each card slot (e.g. fixed width)
 *   ariaLabel   - accessible label for the carousel region
 */
function InfiniteCarousel({
  items,
  renderItem,
  speed = 40,
  gap = 24,
  itemClassName = '',
  className = '',
  ariaLabel,
}) {
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const [copies, setCopies] = useState(2)
  const [style, setStyle] = useState({})

  const n = items.length

  const measure = useCallback(() => {
    const track = trackRef.current
    const viewport = viewportRef.current
    if (!track || !viewport || n === 0) return

    const slots = track.children
    if (slots.length <= n) return

    // Period = distance between the first slot and the first slot of the 2nd
    // copy. This captures item widths + gaps exactly, so translating by this
    // amount lands identical content in the identical place — a seamless loop.
    const period = slots[n].offsetLeft - slots[0].offsetLeft
    if (period <= 0) return

    // Enough copies so the track always overflows viewport by >= one period
    // (guarantees no blank gap at any point of the animation).
    const needed = Math.ceil(viewport.clientWidth / period) + 2
    if (needed !== copies) {
      setCopies(Math.max(2, needed))
      return // re-measure after the extra copies render
    }

    const duration = period / speed // constant px/sec regardless of content
    setStyle({
      '--carousel-shift': `${period}px`,
      '--carousel-duration': `${duration}s`,
    })
  }, [n, copies, speed])

  useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(() => measure())
    if (viewportRef.current) ro.observe(viewportRef.current)
    if (trackRef.current) ro.observe(trackRef.current)
    return () => ro.disconnect()
  }, [measure])

  if (n === 0) return null

  // Render `copies` sequential copies of the list as a single flat flex row.
  const slots = []
  for (let c = 0; c < copies; c++) {
    for (let i = 0; i < n; i++) {
      const isClone = c > 0
      slots.push(
        <div
          key={`${c}-${i}`}
          className={`shrink-0 ${itemClassName}`}
          aria-hidden={isClone || undefined}
        >
          {renderItem(items[i], i)}
        </div>,
      )
    }
  }

  return (
    <div
      ref={viewportRef}
      className={`carousel-viewport ${className}`}
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
    >
      <div
        ref={trackRef}
        className="carousel-track"
        style={{ gap: `${gap}px`, ...style }}
      >
        {slots}
      </div>
    </div>
  )
}

export default memo(InfiniteCarousel)
