import { api } from './apiClient'
import type {
  FolderCountsDto,
  MessageDto,
  MessageFolder,
  MessageSummaryDto,
  PageResponse,
} from '../types/api'

export interface ListParams {
  folder: MessageFolder
  page?: number
  size?: number
  sort?: string
}

export interface ComposePayload {
  subject: string
  body: string
  toUserIds?: string[]
  ccUserIds?: string[]
  bccUserIds?: string[]
  toGroupIds?: string[]
  attachmentIds?: string[]
  parentMessageId?: string | null
  asDraft?: boolean
}

export async function listMessages(params: ListParams): Promise<PageResponse<MessageSummaryDto>> {
  const r = await api.get<PageResponse<MessageSummaryDto>>('/messages', {
    params: { folder: params.folder, page: params.page ?? 0, size: params.size ?? 20, sort: params.sort },
  })
  return r.data
}

export async function folderCounts(): Promise<FolderCountsDto> {
  const r = await api.get<FolderCountsDto>('/messages/folders/counts')
  return r.data
}

export async function getMessage(id: string): Promise<MessageDto> {
  const r = await api.get<MessageDto>(`/messages/${id}`)
  return r.data
}

export async function sendMessage(payload: ComposePayload): Promise<MessageDto> {
  const r = await api.post<MessageDto>('/messages', payload)
  return r.data
}

export async function updateDraft(id: string, payload: ComposePayload): Promise<MessageDto> {
  const r = await api.put<MessageDto>(`/messages/drafts/${id}`, payload)
  return r.data
}

export async function replyMessage(id: string, body: string, replyAll = false): Promise<MessageDto> {
  const r = await api.post<MessageDto>(`/messages/${id}/reply`, { body, replyAll })
  return r.data
}

export async function forwardMessage(id: string, toUserIds: string[], toGroupIds: string[], body = ''): Promise<MessageDto> {
  const r = await api.post<MessageDto>(`/messages/${id}/forward`, { toUserIds, toGroupIds, body })
  return r.data
}

export async function markRead(id: string, read: boolean) {
  await api.patch(`/messages/${id}/read`, null, { params: { read } })
}

export async function moveToTrash(id: string) {
  await api.delete(`/messages/${id}`)
}

export async function restoreMessage(id: string) {
  await api.post(`/messages/${id}/restore`)
}

export async function deletePermanent(id: string) {
  await api.delete(`/messages/${id}/permanent`)
}

export async function searchMessages(q: string, page = 0, size = 20): Promise<PageResponse<MessageSummaryDto>> {
  const r = await api.get<PageResponse<MessageSummaryDto>>('/search', { params: { q, page, size } })
  return r.data
}
