import React, { useState, useEffect } from 'react'
import {
  ShoppingBag,
  Check,
  Plus,
  Minus,
  Package,
  ExternalLink,
  ShieldCheck,
  Volume2,
  VolumeX,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'

/**
 * Text-to-Speech Audio Readout Button
 */
export function VoiceAudioButton({ text = '' }) {
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true)
    }
  }, [])

  if (!supported || !text) return null

  function cleanTextForSpeech(raw) {
    return raw
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#?ORD-[A-Z0-9]+/g, 'Order reference')
      .replace(/\|/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[\*\-\•]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function handleToggleVoice() {
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()
    const clean = cleanTextForSpeech(text)
    const utterance = new SpeechSynthesisUtterance(clean)

    utterance.rate = 0.95
    utterance.pitch = 1.0

    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith('ur') ||
        v.lang.startsWith('hi') ||
        v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.lang.startsWith('en')
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  return (
    <button
      type="button"
      onClick={handleToggleVoice}
      title={speaking ? 'Stop listening' : 'Listen to AI voice readout'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
        speaking
          ? 'bg-orange-500 text-white shadow-xs animate-pulse ring-2 ring-orange-400/50'
          : 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200'
      }`}
    >
      {speaking ? (
        <>
          <VolumeX size={13} className="text-white shrink-0" />
          <span>Stop Listening</span>
        </>
      ) : (
        <>
          <Volume2 size={13} className="text-amber-600 shrink-0" />
          <span>Listen Voice</span>
        </>
      )}
    </button>
  )
}

/**
 * 1-Click Interactive Add to Cart Card
 */
export function ProductAddToCartCard({ product, initialQty = 1 }) {
  const { addBulkItems, open } = useCart()
  const { showToast } = useToast()
  const [qty, setQty] = useState(initialQty || 1)
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!product) return null

  const unitPrice = product.price || 0
  const maxStock = product.stock || 100
  const total = unitPrice * qty

  async function handleAddToCart() {
    try {
      setLoading(true)
      await addBulkItems([
        {
          id: product.slug || product.id,
          partSlug: product.slug || product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          qty,
        },
      ])
      setAdded(true)
      showToast(`Added ${qty}x ${product.name} to your cart!`)
      open()
    } catch (err) {
      showToast('Failed to add item to cart')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/90 to-orange-50/70 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-brand shrink-0 shadow-2xs">
            <Package size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-slate-900 text-xs sm:text-sm">{product.name}</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider border border-emerald-200">
                In Stock ({maxStock})
              </span>
            </div>
            {product.fits && (
              <p className="text-[11px] text-slate-600 mt-0.5">Fits: {product.fits}</p>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs sm:text-sm font-black text-slate-900">
            Rs {unitPrice.toLocaleString()}
          </div>
          <span className="text-[10px] text-muted">per unit</span>
        </div>
      </div>

      <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-2xs">
          <button
            type="button"
            disabled={qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 disabled:opacity-30 transition-colors"
          >
            <Minus size={12} />
          </button>
          <span className="w-8 text-center font-black text-xs text-slate-900">{qty}</span>
          <button
            type="button"
            disabled={qty >= maxStock}
            onClick={() => setQty((q) => Math.min(maxStock, q + 1))}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 disabled:opacity-30 transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">
            Total: <strong className="text-brand font-black">Rs {total.toLocaleString()}</strong>
          </span>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={loading}
            className={`h-9 px-4 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shadow-sm ${
              added
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white active:scale-95'
            }`}
          >
            {added ? (
              <>
                <Check size={14} /> Added! View Cart
              </>
            ) : (
              <>
                <ShoppingBag size={14} /> Add {qty} to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Enhanced Rich Markdown Table Renderer
 */
function MarkdownTable({ headerRow, dataRows, onOrderClick }) {
  const parseRow = (row) =>
    row
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim())

  const headers = parseRow(headerRow)

  return (
    <div className="my-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
            {headers.map((h, idx) => (
              <th
                key={idx}
                className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-200 border-b border-slate-700 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-800">
          {dataRows.map((rowStr, rIdx) => {
            const cells = parseRow(rowStr)
            return (
              <tr
                key={rIdx}
                className={`transition-colors hover:bg-amber-50/40 ${
                  rIdx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                }`}
              >
                {cells.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2.5 align-top leading-relaxed text-xs">
                    <TableCellContent content={cell} onOrderClick={onOrderClick} />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Renders individual table cell content, handling `<br>`, bold, order refs, and badges
 */
function TableCellContent({ content = '', onOrderClick }) {
  if (!content) return null

  // Split cell content by HTML linebreaks <br>, <br/>, or <br />
  const lines = content.split(/<br\s*\/?>/i)

  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) return null

        // Check if line represents an order reference
        const isOrderRef = trimmed.match(/^`?#?([A-F0-9]{4,8}|ORD-[A-Z0-9]+)`?$/i)
        if (isOrderRef) {
          const cleanRef = isOrderRef[1]
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onOrderClick && onOrderClick(cleanRef)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 hover:bg-amber-200 text-[11px] font-mono font-black border border-amber-300 transition-colors shadow-2xs"
            >
              #{cleanRef}
            </button>
          )
        }

        // Check for payment / status pills
        if (trimmed.toLowerCase().includes('payment: pending') || trimmed.toLowerCase().includes('pending')) {
          return (
            <div key={idx} className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200">
                <Clock size={10} className="text-amber-600" />
                <span>{renderInlineText(trimmed, onOrderClick)}</span>
              </span>
            </div>
          )
        }

        return <div key={idx}>{renderInlineText(trimmed, onOrderClick)}</div>
      })}
    </div>
  )
}

/**
 * Universal inline renderer for bold, code, order references, and currency
 */
function renderInlineText(str, onOrderClick) {
  if (!str) return null

  const parts = []
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|#?ORD-[A-Z0-9]{4,12}|Rs\.?\s*[\d,]+|PKR\s*[\d,]+(\.\d+)?(M|K)?)/g

  let lastIdx = 0
  let match

  while ((match = regex.exec(str)) !== null) {
    const matchText = match[0]
    const matchStart = match.index

    if (matchStart > lastIdx) {
      parts.push(str.slice(lastIdx, matchStart))
    }

    if (matchText.startsWith('**') && matchText.endsWith('**')) {
      parts.push(
        <strong key={`b-${matchStart}`} className="font-extrabold text-slate-900">
          {matchText.slice(2, -2)}
        </strong>
      )
    } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
      const codeVal = matchText.slice(1, -1)
      const isHexOrder = codeVal.match(/^[A-F0-9]{5,8}$/i)

      if (isHexOrder) {
        parts.push(
          <button
            key={`c-${matchStart}`}
            type="button"
            onClick={() => onOrderClick && onOrderClick(codeVal)}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-mono font-black border border-amber-300 transition-colors shadow-2xs"
          >
            #{codeVal}
          </button>
        )
      } else {
        parts.push(
          <code
            key={`c-${matchStart}`}
            className="px-1.5 py-0.5 rounded-md bg-slate-100 text-amber-900 text-[11px] font-mono font-bold border border-slate-200"
          >
            {codeVal}
          </code>
        )
      }
    } else if (matchText.toUpperCase().includes('ORD-')) {
      const cleanRef = matchText.replace(/^#/, '').toUpperCase()
      parts.push(
        <button
          key={`ord-${matchStart}`}
          type="button"
          onClick={() => onOrderClick && onOrderClick(cleanRef)}
          className="inline-flex items-center px-2 py-0.5 mx-1 rounded-md bg-amber-100 text-amber-900 hover:bg-amber-200 text-[11px] font-mono font-black tracking-wider border border-amber-300 transition-colors shadow-2xs"
        >
          #{cleanRef}
        </button>
      )
    } else if (/^(Rs\.?|PKR)/i.test(matchText)) {
      parts.push(
        <span key={`curr-${matchStart}`} className="font-black text-orange-600 tracking-tight">
          {matchText}
        </span>
      )
    } else {
      parts.push(matchText)
    }

    lastIdx = regex.lastIndex
  }

  if (lastIdx < str.length) {
    parts.push(str.slice(lastIdx))
  }

  return parts.length ? parts : str
}

/**
 * Main Formatted Message Component with Full Markdown, Tables, and Headers Support
 */
export default function FormattedMessage({
  text = '',
  onOrderClick,
  onPartClick,
  isAI = false,
  productData = null,
  showVoice = true,
}) {
  if (!text) return null

  const lines = text.split('\n')
  const elements = []
  let currentList = []
  let tableBuffer = []

  function flushList() {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-slate-700 leading-relaxed text-xs sm:text-sm">
              <span className="w-2 h-2 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 mt-1.5 shrink-0 shadow-2xs" />
              <div className="flex-1 font-medium">{renderInlineText(item, onOrderClick)}</div>
            </li>
          ))}
        </ul>
      )
      currentList = []
    }
  }

  function flushTable() {
    if (tableBuffer.length >= 2) {
      const headerRow = tableBuffer[0]
      // Skip the separator row (tableBuffer[1])
      const dataRows = tableBuffer.slice(2)
      elements.push(
        <MarkdownTable
          key={`table-${elements.length}`}
          headerRow={headerRow}
          dataRows={dataRows}
          onOrderClick={onOrderClick}
        />
      )
      tableBuffer = []
    } else if (tableBuffer.length === 1) {
      elements.push(
        <p key={`p-${elements.length}`} className="my-1 leading-relaxed text-slate-800">
          {renderInlineText(tableBuffer[0], onOrderClick)}
        </p>
      )
      tableBuffer = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Table Row Detection: starts and ends with '|' or contains multiple '|'
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList()
      tableBuffer.push(line)
      continue
    } else if (tableBuffer.length > 0) {
      flushTable()
    }

    // Markdown Headers
    const h1Match = line.match(/^#\s+(.*)$/)
    const h2Match = line.match(/^##\s+(.*)$/)
    const h3Match = line.match(/^###\s+(.*)$/)
    const h4Match = line.match(/^####\s+(.*)$/)

    if (h1Match || h2Match || h3Match || h4Match) {
      flushList()
      const title = (h1Match || h2Match || h3Match || h4Match)[1]

      if (h1Match || h2Match) {
        elements.push(
          <div
            key={`h-${elements.length}`}
            className="mt-4 mb-2 pb-1.5 border-b border-slate-200 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-md bg-orange-500 shrink-0" />
            <h3 className="font-black text-sm sm:text-base text-slate-900 tracking-tight">
              {renderInlineText(title, onOrderClick)}
            </h3>
          </div>
        )
      } else {
        elements.push(
          <div
            key={`h-${elements.length}`}
            className="mt-3 mb-1.5 flex items-center gap-2 bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-200/80 w-fit"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <h4 className="font-extrabold text-xs sm:text-sm text-amber-950 tracking-tight">
              {renderInlineText(title, onOrderClick)}
            </h4>
          </div>
        )
      }
      continue
    }

    // Horizontal Divider
    if (/^(\-\-\-|\*\*\*|___)$/.test(line)) {
      flushList()
      elements.push(<hr key={`hr-${elements.length}`} className="my-3 border-slate-200" />)
      continue
    }

    // Bullet List Items
    const bulletMatch = line.match(/^[\*\-\•]\s+(.*)$/)
    if (bulletMatch) {
      currentList.push(bulletMatch[1])
      continue
    }

    // Numbered List Items
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/)
    if (numberedMatch) {
      flushList()
      elements.push(
        <div key={`num-${elements.length}`} className="flex items-start gap-2.5 my-2 pl-1 text-slate-800">
          <span className="w-5 h-5 rounded-lg bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center font-black text-[11px] shrink-0">
            {numberedMatch[1]}
          </span>
          <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
            {renderInlineText(numberedMatch[2], onOrderClick)}
          </div>
        </div>
      )
      continue
    }

    flushList()

    if (!line) {
      elements.push(<div key={`space-${elements.length}`} className="h-1.5" />)
    } else {
      elements.push(
        <p key={`p-${elements.length}`} className="my-1.5 leading-relaxed text-slate-800 text-xs sm:text-sm font-medium">
          {renderInlineText(line, onOrderClick)}
        </p>
      )
    }
  }

  flushList()
  if (tableBuffer.length > 0) flushTable()

  return (
    <div className="space-y-2 text-xs sm:text-sm font-sans">
      {elements}
      {productData && (
        <ProductAddToCartCard product={productData} initialQty={productData.qty || 1} />
      )}
      {isAI && showVoice && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
          <VoiceAudioButton text={text} />
        </div>
      )}
    </div>
  )
}
