import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Inbox as InboxIcon, Paperclip, RefreshCw, Trash2, FileText, Send } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Avatar } from '../../components/ui/Avatar'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { formatDate } from '../../lib/format'
import { listMessages } from '../../services/messagesApi'
import type { MessageFolder } from '../../types/api'
import { cn } from '../../lib/cn'

interface FolderMeta {
  path: string
  label: string
  description: string
  icon: LucideIcon
  value: MessageFolder
  emptyLabel: string
}

const FOLDERS: Record<string, FolderMeta> = {
  '/inbox': { path: '/inbox', label: 'Boite de reception', description: 'Vos messages recus', icon: InboxIcon, value: 'INBOX', emptyLabel: 'Boite vide' },
  '/sent': { path: '/sent', label: 'Envoyes', description: 'Vos messages envoyes', icon: Send, value: 'SENT', emptyLabel: 'Aucun message envoye' },
  '/drafts': { path: '/drafts', label: 'Brouillons', description: 'Vos brouillons', icon: FileText, value: 'DRAFT', emptyLabel: 'Aucun brouillon' },
  '/trash': { path: '/trash', label: 'Corbeille', description: 'Messages a la corbeille', icon: Trash2, value: 'TRASH', emptyLabel: 'Corbeille vide' },
}

export function MailListPage() {
  const location = useLocation()
  const meta = FOLDERS[location.pathname] ?? FOLDERS['/inbox']
  const [page, setPage] = useState(0)
  const qc = useQueryClient()

  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ['messages', meta.value, page],
    queryFn: () => listMessages({ folder: meta.value, page, size: 25 }),
  })

  const refresh = () => {
    refetch()
    qc.invalidateQueries({ queryKey: ['folder-counts'] })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-[color:var(--color-brand-100)] p-2 text-[color:var(--color-brand-700)]">
            <meta.icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{meta.label}</h1>
            <p className="text-xs text-[color:var(--color-ink-muted)]">{meta.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost" onClick={refresh} disabled={isFetching}>
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Erreur de chargement
        </div>
      )}

      <div className="card overflow-hidden">
        {!data && isFetching ? (
          <div className="flex items-center justify-center p-10 text-[color:var(--color-ink-muted)]">
            <Spinner /> <span className="ml-2 text-sm">Chargement...</span>
          </div>
        ) : !data || data.content.length === 0 ? (
          <EmptyState icon={meta.icon} title={meta.emptyLabel} description="Aucun message a afficher." />
        ) : (
          <ul className="divide-y">
            {data.content.map((m) => {
              const readable = meta.value === 'DRAFT' ? true : m.read
              const target = meta.value === 'DRAFT' ? `/compose?draft=${m.id}` : `/messages/${m.id}`
              return (
                <li key={m.id}>
                  <Link
                    to={target}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition hover:bg-[color:var(--color-surface-muted)]',
                      !readable && 'bg-[color:var(--color-brand-50)]/60',
                    )}
                  >
                    <Avatar name={m.senderDisplayName ?? m.senderEmail ?? '?'} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className={cn('truncate text-sm', !readable ? 'font-semibold' : 'font-medium')}>
                          {meta.value === 'INBOX' || meta.value === 'TRASH'
                            ? m.senderDisplayName ?? m.senderEmail ?? ''
                            : m.recipientLabels.join(', ') || '(aucun destinataire)'}
                        </div>
                        <div className="whitespace-nowrap text-xs text-[color:var(--color-ink-muted)]">
                          {formatDate(m.sentAt ?? m.createdAt)}
                        </div>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className={cn('truncate text-sm', !readable && 'font-semibold')}>
                          {m.subject || '(sans objet)'}
                        </span>
                        {m.attachmentCount > 0 && (
                          <Paperclip className="h-3.5 w-3.5 shrink-0 text-[color:var(--color-ink-muted)]" />
                        )}
                        {m.draft && (
                          <span className="badge bg-amber-100 text-amber-800">Brouillon</span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-[color:var(--color-ink-muted)]">
                        {m.preview}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t bg-white px-3 py-2 text-xs text-[color:var(--color-ink-muted)]">
            <span>
              Page {data.page + 1} / {data.totalPages} - {data.totalElements} messages
            </span>
            <div className="flex gap-2">
              <button
                className="btn-ghost"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data.first}
              >
                Precedent
              </button>
              <button
                className="btn-ghost"
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
