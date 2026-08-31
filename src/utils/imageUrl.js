import { SOCKET_BASE } from '../services/api'

/**
 * Resolves relative uploaded image paths (e.g. /uploads/123-avatar.jpg) to full backend URLs.
 * Leaves absolute URLs (e.g. Google profile photos, Unsplash, DiceBear, data URIs) untouched.
 *
 * @param {String} url - Raw image URL or relative path
 * @returns {String} Resolved working image URL
 */
export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''

  // If already absolute URL, data URI, or blob URL
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed
  }

  // Prepend backend base URL to relative uploads paths
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${SOCKET_BASE}${cleanPath}`
}
