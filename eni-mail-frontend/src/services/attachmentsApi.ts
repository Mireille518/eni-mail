import { api } from './apiClient'
import type { AttachmentDto } from '../types/api'

export async function uploadAttachment(file: File): Promise<AttachmentDto> {
  const fd = new FormData()
  fd.append('file', file)
  const r = await api.post<AttachmentDto>('/attachments', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return r.data
}

export async function deleteAttachment(id: string) {
  await api.delete(`/attachments/${id}`)
}

export function attachmentDownloadUrl(id: string) {
  return `/api/attachments/${id}`
}
