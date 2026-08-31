import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const NavContext = createContext(null)

function parseLocation() {
  const hashRaw = window.location.hash.replace(/^#\/?/, '')
  const pathnameRaw = window.location.pathname.replace(/^\/?/, '')

  // If there's a hash, use it; otherwise check if pathname has a route (like /admin, /admindashboard, /orders, /support)
  let raw = hashRaw
  if (!raw && pathnameRaw) {
    raw = pathnameRaw
  }

  if (!raw) return { page: 'home', subpage: '', params: {} }

  const [fullPath, queryString] = raw.split('?')
  const params = {}
  if (queryString) {
    const searchParams = new URLSearchParams(queryString)
    for (const [k, v] of searchParams.entries()) {
      params[k] = v
    }
  }

  // Handle aliases like 'admin' or 'admindashboard' -> 'dashboard'
  let cleanPath = fullPath.replace(/^\/+/, '')
  if (cleanPath === 'admin' || cleanPath === 'admindashboard') {
    cleanPath = 'dashboard'
  } else if (cleanPath.startsWith('admin/') || cleanPath.startsWith('admindashboard/')) {
    cleanPath = cleanPath.replace(/^admin(dashboard)?\//, 'dashboard/')
  }

  const segments = (cleanPath || 'home').split('/').filter(Boolean)
  const page = segments[0] || 'home'
  const subpage = segments.slice(1).join('/') || ''

  // Normalize pathname to root '/' if a pathname was entered directly
  if (window.location.pathname !== '/' && window.history?.replaceState) {
    const qs = queryString ? `?${queryString}` : ''
    const hash = page === 'home' ? '' : `#/${cleanPath}${qs}`
    window.history.replaceState(null, '', `/${hash}`)
  }

  return { page, subpage, params }
}

export function NavProvider({ children }) {
  const [navState, setNavState] = useState(() => parseLocation())

  useEffect(() => {
    function handleLocationChange() {
      setNavState(parseLocation())
    }
    window.addEventListener('hashchange', handleLocationChange)
    window.addEventListener('popstate', handleLocationChange)
    return () => {
      window.removeEventListener('hashchange', handleLocationChange)
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  const navigate = useCallback((next, nextParams = {}, options = {}) => {
    let target = next === 'admin' || next === 'admindashboard' ? 'dashboard' : next
    let hash = target === 'home' ? '' : `#/${target}`
    const keys = Object.keys(nextParams)
    if (keys.length > 0) {
      const qs = new URLSearchParams(nextParams).toString()
      hash += `?${qs}`
    }

    if (window.location.hash !== hash || window.location.pathname !== '/') {
      if (window.location.pathname !== '/' && window.history?.replaceState) {
        window.history.replaceState(null, '', `/${hash}`)
      } else {
        window.location.hash = hash
      }
    }
    const parsed = parseLocation()
    setNavState(parsed)
    if (!options.preserveScroll) {
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
    }
  }, [])

  return (
    <NavContext.Provider
      value={{
        page: navState.page,
        subpage: navState.subpage,
        params: navState.params,
        navigate,
      }}
    >
      {children}
    </NavContext.Provider>
  )
}

export function useNav() {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used within NavProvider')
  return ctx
}
