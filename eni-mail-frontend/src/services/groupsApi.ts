import { api } from './apiClient'
import type { GroupDto, PageResponse } from '../types/api'

export async function listGroups(q?: string, page = 0, size = 50): Promise<PageResponse<GroupDto>> {
  const r = await api.get<PageResponse<GroupDto>>('/groups', { params: { q, page, size } })
  return r.data
}

export async function getGroup(id: string): Promise<GroupDto> {
  const r = await api.get<GroupDto>(`/groups/${id}`)
  return r.data
}

export interface CreateGroupPayload {
  name: string
  description?: string
  memberIds?: string[]
}

export async function createGroup(payload: CreateGroupPayload): Promise<GroupDto> {
  const r = await api.post<GroupDto>('/groups', payload)
  return r.data
}

export async function updateGroup(id: string, payload: { name?: string; description?: string }): Promise<GroupDto> {
  const r = await api.patch<GroupDto>(`/groups/${id}`, payload)
  return r.data
}

export async function deleteGroup(id: string) {
  await api.delete(`/groups/${id}`)
}

export async function addMembers(id: string, memberIds: string[]): Promise<GroupDto> {
  const r = await api.post<GroupDto>(`/groups/${id}/members`, memberIds)
  return r.data
}

export async function removeMember(id: string, memberId: string): Promise<GroupDto> {
  const r = await api.delete<GroupDto>(`/groups/${id}/members/${memberId}`)
  return r.data
}
