import { api } from './apiClient'
import type { PageResponse, Role, UserDto } from '../types/api'

export async function searchUsers(q?: string, role?: Role, page = 0, size = 20): Promise<PageResponse<UserDto>> {
  const r = await api.get<PageResponse<UserDto>>('/users', { params: { q, role, page, size } })
  return r.data
}

export interface CreateUserPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  role: Role
  filiere?: string
  promotion?: string
}

export async function createUser(payload: CreateUserPayload): Promise<UserDto> {
  const r = await api.post<UserDto>('/users', payload)
  return r.data
}

export interface UpdateUserPayload {
  firstName?: string
  lastName?: string
  filiere?: string
  promotion?: string
  avatarUrl?: string
  role?: Role
  status?: 'ACTIVE' | 'DISABLED'
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<UserDto> {
  const r = await api.patch<UserDto>(`/users/${id}`, payload)
  return r.data
}

export async function disableUser(id: string) {
  await api.delete(`/users/${id}`)
}

export async function updateMyProfile(payload: UpdateUserPayload): Promise<UserDto> {
  const r = await api.patch<UserDto>('/users/me', payload)
  return r.data
}

export async function changeMyPassword(currentPassword: string, newPassword: string) {
  await api.post('/users/me/password', { currentPassword, newPassword })
}
