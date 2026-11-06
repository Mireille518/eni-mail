import { useQuery } from '@tanstack/react-query'
import { Search, Paperclip } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Avatar } from '../../components/ui/Avatar'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { formatDate } from '../../lib/format'
import { searchMessages } from '../../services/messagesApi'

export function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''

  const { data, isFetching } = useQuery({
    queryKey: ['search', q],
    queryFn: () => searchMessages(q),
    enabled: q.length > 0,
  })

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <h1 className="mb-1 text-lg font-semibold">Recherche : "{q}"</h1>
      <p className="mb-4 text-xs text-[color:var(--color-ink-muted)]">
        {data ? `${data.totalElements} resultat(s)` : ''}
      </p>

      {!q ? (
        <EmptyState icon={Search} title="Lancer une recherche" description="Saisissez votre requete dans la barre du haut." />
      ) : isFetching && !data ? (
        <div className="flex items-center justify-center p-10 text-[color:var(--color-ink-muted)]">
          <Spinner /> <span className="ml-2 text-sm">Recherche...</span>
        </div>
      ) : !data || data.content.length === 0 ? (
        <EmptyState icon={Search} title="Aucun resultat" description="Essayez d'autres mots-cles." />
      ) : (
        <div className="card">
          <ul className="divide-y">
            {data.content.map((m) => (
              <li key={m.id}>
                <Link to={`/messages/${m.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-[color:var(--color-surface-muted)]">
                  <Avatar name={m.senderDisplayName ?? '?'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-medium">
                        {m.senderDisplayName ?? m.senderEmail}
                      </div>
                      <div className="whitespace-nowrap text-xs text-[color:var(--color-ink-muted)]">
                        {formatDate(m.sentAt ?? m.createdAt)}
                      </div>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="truncate text-sm">{m.subject || '(sans objet)'}</span>
                      {m.attachmentCount > 0 && <Paperclip className="h-3.5 w-3.5 text-[color:var(--color-ink-muted)]" />}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-[color:var(--color-ink-muted)]">{m.preview}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
