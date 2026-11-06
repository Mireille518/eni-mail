import { format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isToday(d)) return format(d, 'HH:mm', { locale: fr })
  if (isYesterday(d)) return 'Hier ' + format(d, 'HH:mm', { locale: fr })
  return format(d, 'd MMM yyyy', { locale: fr })
}

export function formatFull(iso: string | null | undefined): string {
  if (!iso) return ''
  return format(new Date(iso), "EEEE d MMMM yyyy 'a' HH:mm", { locale: fr })
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return ''
  return 'il y a ' + formatDistanceToNowStrict(new Date(iso), { locale: fr })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' o'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko'
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
}

export function initials(name: string | null | undefined): string {
  if (!name) return '??'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '??'
}
