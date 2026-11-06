import { api } from './apiClient'
import type { AdminStatsDto } from '../types/api'

export async function fetchAdminStats(): Promise<AdminStatsDto> {
  const r = await api.get<AdminStatsDto>('/admin/stats')
  return r.data
}
