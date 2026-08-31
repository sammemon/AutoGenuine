// Frontend mirror of server/middleware/permissions.js.
//
// This decides what the dashboard SHOWS (which sidebar items, which buttons).
// It is NOT security — the API enforces every action independently. If this file
// and the server ever disagree, the server wins: a hidden-but-attempted action
// still 403s, and a shown-but-forbidden action fails at the API. Keep the role
// map here in sync with the backend copy.
//
// Hierarchy (single-store platform): user < admin < owner. owner is a strict
// superset of admin.

export const PERMISSION = {
  VIEW_DASHBOARD: 'dashboard:view',
  VIEW_STATS: 'stats:view',

  VIEW_USERS: 'users:view',
  SET_USER_STATUS: 'users:set-status',
  SET_USER_ROLE: 'users:set-role',
  DELETE_USER: 'users:delete',

  VIEW_ORDERS: 'orders:view',
  UPDATE_ORDER: 'orders:update',

  MANAGE_PRODUCTS: 'products:manage',
  MANAGE_CATEGORIES: 'categories:manage',
  MANAGE_VEHICLES: 'vehicles:manage',

  VIEW_MESSAGES: 'messages:view',
  DELETE_MESSAGE: 'messages:delete',

  // Owner-only, high-trust capabilities.
  VIEW_ANALYTICS: 'analytics:view',   // revenue, sales trends, top sellers
  MANAGE_SETTINGS: 'settings:manage', // store-wide configuration
  VIEW_AUDIT: 'audit:view',           // read the staff action log
}

const P = PERMISSION

const ADMIN_PERMISSIONS = [
  P.VIEW_DASHBOARD, P.VIEW_STATS,
  P.VIEW_USERS, P.SET_USER_STATUS,     // admin can SEE users + suspend/activate customers
  P.VIEW_ORDERS, P.UPDATE_ORDER,
  P.MANAGE_PRODUCTS, P.MANAGE_CATEGORIES, P.MANAGE_VEHICLES,
  P.VIEW_MESSAGES, P.DELETE_MESSAGE,
]

const OWNER_PERMISSIONS = [
  ...ADMIN_PERMISSIONS,
  P.SET_USER_ROLE, P.DELETE_USER,      // owner adds: change roles + delete users (+ suspend admins)
  P.VIEW_ANALYTICS, P.MANAGE_SETTINGS, P.VIEW_AUDIT, // plus financials, config, audit
]

export const ROLE_PERMISSIONS = {
  user: [],
  admin: ADMIN_PERMISSIONS,
  owner: OWNER_PERMISSIONS,
}

// Staff = anyone with dashboard access (admin or owner).
export function isStaff(user) {
  return !!user && (user.role === 'admin' || user.role === 'owner')
}

export function can(user, permission) {
  if (!user) return false
  const granted = ROLE_PERMISSIONS[user.role] || []
  return granted.includes(permission)
}

// Where a role lands right after login.
export function landingPage(user) {
  return isStaff(user) ? 'dashboard' : 'home'
}

// Human label for a role, for badges.
export function roleLabel(role) {
  if (role === 'owner') return 'Store Owner'
  if (role === 'admin') return 'Admin'
  return 'Customer'
}
