import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Role, UserDto } from '../types/api'
import * as authApi from '../services/authApi'
import { setOnUnauthorized } from '../services/apiClient'

interface AuthContextShape {
  user: UserDto | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<UserDto>
  logout: () => Promise<void>
  hasRole: (...roles: Role[]) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null)
  const [loading, setLoading] = useState(true)

  const bootstrap = useCallback(async () => {
    const r = await authApi.trySilentRefresh()
    if (r) {
      setUser(r.user)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    setOnUnauthorized(() => setUser(null))
    return () => setOnUnauthorized(null)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const r = await authApi.login(email, password)
    setUser(r.user)
    return r.user
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const hasRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user],
  )

  const refreshUser = useCallback(async () => {
    const me = await authApi.fetchMe()
    setUser(me)
  }, [])

  const value = useMemo<AuthContextShape>(
    () => ({ user, isAuthenticated: user !== null, loading, login, logout, hasRole, refreshUser }),
    [user, loading, login, logout, hasRole, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
