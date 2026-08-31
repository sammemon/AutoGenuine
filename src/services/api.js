let rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
if (rawApiUrl && !/^https?:\/\//i.test(rawApiUrl)) {
  rawApiUrl = `https://${rawApiUrl}`
}
const cleanApiUrl = rawApiUrl.replace(/\/+$/, '')
const API_BASE = cleanApiUrl.endsWith('/api') ? cleanApiUrl : `${cleanApiUrl}/api`
export const SOCKET_BASE = API_BASE.replace(/\/api\/?$/, '')

async function request(path, options = {}) {
  const token = localStorage.getItem('autogenuine_token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// Auth
export const auth = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  googleLogin: (body) => request('/auth/google', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyResetCode: (body) => request('/auth/verify-reset-code', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (body) => request('/auth/password', { method: 'PUT', body: JSON.stringify(body) }),
}

// Upload (multipart/form-data)
export const upload = {
  image: async (file) => {
    const token = localStorage.getItem('autogenuine_token')
    const formData = new FormData()
    formData.append('image', file)

    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Image upload failed')
    return data
  },
}

// Catalog
export const catalog = {
  getParts: (category) => request(`/catalog/parts${category ? `?category=${category}` : ''}`),
  getPart: (slug) => request(`/catalog/parts/${slug}`),
  getCategories: () => request('/catalog/categories'),
  getVehicles: () => request('/catalog/vehicles'),
  getSettings: () => request('/catalog/settings'),
}

// Cart
export const cart = {
  get: () => request('/cart'),
  add: (body) => request('/cart', { method: 'POST', body: JSON.stringify(body) }),
  update: (partSlug, body) => request(`/cart/${partSlug}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (partSlug) => request(`/cart/${partSlug}`, { method: 'DELETE' }),
  clear: () => request('/cart', { method: 'DELETE' }),
}

// Orders
export const orders = {
  list: () => request('/orders'),
  create: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  get: (id) => request(`/orders/${id}`),
  track: (ref) => request(`/orders/track/${encodeURIComponent(ref)}`),
  cancel: (id, reason) => request(`/orders/${id}/cancel`, { method: 'PUT', body: JSON.stringify({ reason }) }),
}

// Contact
export const contact = {
  submit: (body) => request('/contact', { method: 'POST', body: JSON.stringify(body) }),
}

// Chat & AI Support
export const chat = {
  listConversations: (params = {}) => {
    const qs = new URLSearchParams()
    if (typeof params.isSupport !== 'undefined') qs.set('isSupport', String(params.isSupport))
    if (params.status) qs.set('status', params.status)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/chat/conversations${suffix}`)
  },
  searchConversations: (q) => request(`/chat/conversations/search?q=${encodeURIComponent(q)}`),
  getOrCreateConversation: (body) => request('/chat/conversations', { method: 'POST', body: JSON.stringify(body) }),
  startSupportChat: (body) => request('/chat/support/start', { method: 'POST', body: JSON.stringify(body) }),
  sendSupportAIMessage: (body) => request('/chat/support/message', { method: 'POST', body: JSON.stringify(body) }),
  escalateConversation: (id, body) => request(`/chat/support/${id}/escalate`, { method: 'POST', body: JSON.stringify(body) }),
  assignConversation: (id) => request(`/chat/support/${id}/assign`, { method: 'POST' }),
  resolveConversation: (id, body) => request(`/chat/support/${id}/resolve`, { method: 'POST', body: JSON.stringify(body) }),
  closeConversation: (id, body = {}) => request(`/chat/support/${id}/close`, { method: 'POST', body: JSON.stringify(body) }),
  reopenConversation: (id, body) => request(`/chat/support/${id}/reopen`, { method: 'POST', body: JSON.stringify(body) }),
  setRetention: (id, body = {}) => request(`/chat/conversations/${id}/retention`, { method: 'PATCH', body: JSON.stringify(body) }),
  rateConversation: (id, body) => request(`/chat/support/${id}/rate`, { method: 'POST', body: JSON.stringify(body) }),
  getEscalations: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.status) qs.set('status', params.status)
    if (params.priority) qs.set('priority', params.priority)
    if (params.role) qs.set('role', params.role)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/chat/support/escalations${suffix}`)
  },
  getSupportAnalytics: () => request('/chat/support/analytics'),
  getMessages: (conversationId, { before, limit = 30 } = {}) => {
    const qs = new URLSearchParams()
    if (before) qs.set('before', before)
    if (limit) qs.set('limit', String(limit))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/chat/conversations/${conversationId}/messages${suffix}`)
  },
  sendMessage: (body) => request('/chat/messages', { method: 'POST', body: JSON.stringify(body) }),
  markRead: (conversationId) => request(`/chat/conversations/${conversationId}/read`, { method: 'PATCH' }),
  clearConversation: (conversationId) => request(`/chat/conversations/${conversationId}/clear`, { method: 'PATCH' }),
  deleteMessage: (id, mode = 'for_everyone') => request(`/chat/messages/${id}?mode=${mode}`, { method: 'DELETE' }),
  getOnlineUsers: () => request('/chat/online-users'),
  getStaffUsers: () => request('/chat/staff-users'),
  getCustomerUsers: () => request('/chat/customer-users'),
  getOwnerAllConversations: () => request('/chat/owner/all-conversations'),
}

// Admin / owner (token carries the role; server enforces permissions)
export const admin = {
  stats: () => request('/admin/stats'),

  listUsers: () => request('/admin/users'),
  getUserCredential: (id) => request(`/admin/users/${id}/credential`),
  setUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  resetUserPassword: (id, newPassword) => request(`/admin/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ newPassword }) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),

  listOrders: () => request('/admin/orders'),
  updateOrderStatus: (id, status, reason) => request(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) }),

  createPart: (body) => request('/admin/parts', { method: 'POST', body: JSON.stringify(body) }),
  updatePart: (slug, body) => request(`/admin/parts/${slug}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePart: (slug) => request(`/admin/parts/${slug}`, { method: 'DELETE' }),
  listParts: () => request('/admin/parts'),
  applyPromoCampaign: (body) => request('/admin/promotions/apply-campaign', { method: 'POST', body: JSON.stringify(body) }),
  clearPromoCampaign: () => request('/admin/promotions/clear-campaign', { method: 'POST' }),

  createCategory: (body) => request('/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (slug, body) => request(`/admin/categories/${slug}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (slug) => request(`/admin/categories/${slug}`, { method: 'DELETE' }),
  listCategories: () => request('/admin/categories'),

  listVehicles: () => request('/admin/vehicles'),
  createVehicle: (body) => request('/admin/vehicles', { method: 'POST', body: JSON.stringify(body) }),
  updateVehicle: (id, body) => request(`/admin/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteVehicle: (id) => request(`/admin/vehicles/${id}`, { method: 'DELETE' }),

  listMessages: () => request('/admin/messages'),
  deleteMessage: (id) => request(`/admin/messages/${id}`, { method: 'DELETE' }),

  // Notifications & Waiting Carts
  listNotifications: () => request('/admin/notifications'),
  markNotificationRead: (id) => request(`/admin/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/admin/notifications/read-all', { method: 'POST' }),
  listWaitingCarts: () => request('/admin/waiting-carts'),
  sendAbandonedCartReminder: (cartId) => request(`/admin/waiting-carts/${cartId}/send-reminder`, { method: 'POST' }),

  // Owner-only
  analytics: () => request('/admin/analytics'),
  getSettings: () => request('/admin/settings'),
  updateSettings: (payload) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  listAudit: () => request('/admin/audit'),
}

// Payments / Stripe Gateway
export const payments = {
  getConfig: () => request('/payments/config'),
  createCheckoutSession: (body) => request('/payments/create-checkout-session', { method: 'POST', body: JSON.stringify(body) }),
  getSession: (sessionId) => request(`/payments/session/${sessionId}`),
  createIntent: (body) => request('/payments/create-intent', { method: 'POST', body: JSON.stringify(body) }),
  verify: (paymentIntentId) => request(`/payments/verify/${paymentIntentId}`),
}

// AI Store Manager & Business Automation
export const aiStoreManager = {
  chat: (body) => request('/admin/ai-manager/chat', { method: 'POST', body: JSON.stringify(body) }),
  executeAction: (actionId) => request('/admin/ai-manager/execute-action', { method: 'POST', body: JSON.stringify({ actionId }) }),
  rejectAction: (actionId, reason) => request('/admin/ai-manager/reject-action', { method: 'POST', body: JSON.stringify({ actionId, reason }) }),
  getInsights: () => request('/admin/ai-manager/insights'),
  getHistory: () => request('/admin/ai-manager/history'),
  getConversation: () => request('/admin/ai-manager/conversation'),
  setRetention: (id, body) => request(`/admin/ai-manager/conversations/${id}/retention`, { method: 'PATCH', body: JSON.stringify(body) }),
  getAutoPilot: () => request('/admin/ai-manager/autopilot'),
  updateAutoPilot: (body) => request('/admin/ai-manager/autopilot', { method: 'PUT', body: JSON.stringify(body) }),
  runAutoPilotNow: () => request('/admin/ai-manager/autopilot/run-now', { method: 'POST' }),
}

