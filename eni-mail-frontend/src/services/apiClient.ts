import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError, LoginResponse } from '../types/api'

/**
 * Instance axios partagee. L'access token est conserve en memoire (pas de
 * localStorage) pour minimiser l'exposition XSS. Le refresh token vit dans
 * un cookie HttpOnly pose par le backend.
 */
let accessToken: string | null = null
let onUnauthorized: (() => void) | null = null
let refreshPromise: Promise<LoginResponse> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function setOnUnauthorized(cb: (() => void) | null) {
  onUnauthorized = cb
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // envoi du cookie refresh
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
    const isAuthEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh')
    if (error.response?.status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true
      try {
        refreshPromise ??= refreshAccess()
        const r = await refreshPromise
        refreshPromise = null
        accessToken = r.accessToken
        original.headers.set('Authorization', `Bearer ${r.accessToken}`)
        return api(original)
      } catch {
        refreshPromise = null
        accessToken = null
        onUnauthorized?.()
      }
    }
    return Promise.reject(error)
  },
)

export async function refreshAccess(): Promise<LoginResponse> {
  const resp = await axios.post<LoginResponse>('/api/auth/refresh', {}, { withCredentials: true })
  return resp.data
}

export function apiErrorMessage(err: unknown, fallback = 'Erreur inattendue'): string {
  if (axios.isAxiosError<ApiError>(err)) {
    return err.response?.data?.message ?? err.message ?? fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}
