// Reusable input validation and sanitization utilities

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Filter a string to only allow numeric digits (0-9).
 * Used on input change handlers to prevent typing letters, negative signs, or decimals.
 */
export function sanitizeDigits(str) {
  if (str === undefined || str === null) return ''
  return String(str).replace(/\D/g, '')
}

/**
 * Validates stock input: must be a non-negative integer.
 */
export function validateStock(val) {
  if (val === '' || val === undefined || val === null) {
    return { valid: true, value: 0 }
  }
  const str = String(val).trim()
  if (!/^\d+$/.test(str)) {
    return { valid: false, error: 'Stock must be a non-negative whole number (e.g. 0, 10, 50)' }
  }
  const num = Number(str)
  if (!Number.isSafeInteger(num) || num < 0) {
    return { valid: false, error: 'Stock must be a non-negative whole number' }
  }
  return { valid: true, value: num }
}

/**
 * Validates discount input: must be an integer between 0 and 100.
 */
export function validateDiscount(val) {
  if (val === '' || val === undefined || val === null) {
    return { valid: true, value: 0 }
  }
  const str = String(val).trim()
  if (!/^\d+$/.test(str)) {
    return { valid: false, error: 'Discount must be a whole number between 0 and 100' }
  }
  const num = Number(str)
  if (!Number.isInteger(num) || num < 0 || num > 100) {
    return { valid: false, error: 'Discount must be between 0 and 100' }
  }
  return { valid: true, value: num }
}

/**
 * Validates vehicle year input: 4-digit year between 1900 and 2100.
 */
export function validateYear(val, label = 'Year') {
  if (val === '' || val === undefined || val === null) {
    return { valid: true, value: undefined }
  }
  const str = String(val).trim()
  if (!/^\d{4}$/.test(str)) {
    return { valid: false, error: `${label} must be a 4-digit year (e.g. 2024)` }
  }
  const num = Number(str)
  if (num < 1900 || num > 2100) {
    return { valid: false, error: `${label} must be between 1900 and 2100` }
  }
  return { valid: true, value: num }
}

/**
 * Validates image file before upload.
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'Please select an image file.' }
  }

  const name = file.name || ''
  const ext = name.includes('.') ? `.${name.split('.').pop().toLowerCase()}` : ''
  const type = (file.type || '').toLowerCase()

  const isTypeValid = ALLOWED_IMAGE_TYPES.has(type)
  const isExtValid = ALLOWED_IMAGE_EXTS.has(ext)

  if (!isTypeValid && !isExtValid) {
    return { valid: false, error: 'Please upload a JPG, PNG, or WEBP image.' }
  }

  if (file.size > MAX_IMAGE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    return { valid: false, error: `Image size (${sizeMb} MB) exceeds maximum allowed size of 5 MB.` }
  }

  return { valid: true }
}

/**
 * Format bytes to readable string (e.g. 1.4 MB).
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
