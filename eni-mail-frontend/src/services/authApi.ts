import { api, refreshAccess, setAccessToken } from './apiClient'
import type { LoginResponse, UserDto } from '../types/api'

export async function login(email: string, password: string): Promise<LoginResponse> {
  const r = await api.post<LoginResponse>('/auth/login', { email, password })
  setAccessToken(r.data.accessToken)
  return r.data
}

export async function logout() {
  await api.post('/auth/logout').catch(() => undefined)
  setAccessToken(null)
}

export async function trySilentRefresh(): Promise<LoginResponse | null> {
  try {
    const r = await refreshAccess()
    setAccessToken(r.accessToken)
    return r
  } catch {
    return null
  }
}

export async function fetchMe(): Promise<UserDto> {
  const r = await api.get<UserDto>('/users/me')
  return r.data
}
