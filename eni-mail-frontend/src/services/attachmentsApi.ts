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

/**
 * Telecharge une piece jointe via l'instance Axios authentifiee et declenche
 * l'enregistrement cote navigateur. Utiliser ceci plutot qu'un <a href> brut :
 * - Axios porte le token JWT (intercepteur Request).
 * - La reponse arrive en Blob binaire, sans transformation JSON.
 * - Le nom de fichier est lu depuis Content-Disposition si le serveur le fournit,
 *   sinon un fallback est utilise.
 */
export async function downloadAttachment(id: string, fallbackFilename = 'document'): Promise<void> {
  const resp = await api.get<Blob>(`/attachments/${id}`, {
    responseType: 'blob',
  })

  const serverFilename = extractFilenameFromHeader(
    (resp.headers as Record<string, string | undefined>)['content-disposition'],
  )
  const filename = serverFilename ?? fallbackFilename

  const blobUrl = window.URL.createObjectURL(resp.data)
  try {
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    // Liberer l'URL apres que le navigateur a declenche le telechargement.
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000)
  }
}

/**
 * Lit un nom de fichier dans un header Content-Disposition.
 * Supporte "attachment; filename*=UTF-8''%E2%80%A6" (RFC 5987) et
 * "attachment; filename=\"xxx\"" (legacy).
 */
function extractFilenameFromHeader(header: string | null | undefined): string | null {
  if (!header) return null
  const star = /filename\*=(?:UTF-8|utf-8)''([^;]+)/i.exec(header)
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].trim())
    } catch {
      /* ignore decode error */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain?.[1]?.trim() ?? null
}
