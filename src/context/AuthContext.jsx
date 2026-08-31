import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { auth as authAPI } from '../services/api'
import { resolveImageUrl } from '../utils/imageUrl'

const AuthContext = createContext(null)
const TOKEN_KEY = 'autogenuine_token'

function formatUser(u) {
  if (!u) return null
  return {
    ...u,
    avatar: resolveImageUrl(u.avatar),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, restore session from token
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      authAPI.me()
        .then((data) => setUser(formatUser(data.user)))
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async ({ name, email, password, phone }) => {
    const data = await authAPI.register({ name, email, password, phone })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(formatUser(data.user))
    return data.user
  }, [])

  // `identifier` is an email or a phone number — the server resolves which.
  const login = useCallback(async (identifier, password) => {
    const data = await authAPI.login({ identifier, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(formatUser(data.user))
    return data.user
  }, [])

  // Google Authentication
  const loginWithGoogle = useCallback(async (payload) => {
    const data = await authAPI.googleLogin(payload)
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(formatUser(data.user))
    return data.user
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const data = await authAPI.updateProfile(payload)
    setUser(formatUser(data.user))
    return data.user
  }, [])

  // Re-pull the current user from the API (e.g. after a role/status change).
  const refresh = useCallback(async () => {
    try {
      const data = await authAPI.me()
      setUser(formatUser(data.user))
      return data.user
    } catch {
      return null
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthed: !!user, loading, register, login, loginWithGoogle, updateProfile, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'A'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
