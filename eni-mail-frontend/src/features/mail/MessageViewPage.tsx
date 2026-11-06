import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Download, Forward, MailOpen, Paperclip, Reply, ReplyAll, RotateCcw, Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar } from '../../components/ui/Avatar'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../contexts/AuthContext'
import { apiErrorMessage } from '../../services/apiClient'
import {
  deletePermanent,
  getMessage,
  markRead,
  moveToTrash,
  restoreMessage,
} from '../../services/messagesApi'
import { attachmentDownloadUrl } from '../../services/attachmentsApi'
import { formatFileSize, formatFull } from '../../lib/format'

export function MessageViewPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirmPermanent, setConfirmPermanent] = useState(false)

  const { data: message, isLoading, error } = useQuery({
    queryKey: ['message', id],
    queryFn: () => getMessage(id),
    enabled: !!id,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['messages'] })
    qc.invalidateQueries({ queryKey: ['folder-counts'] })
  }

  const trashM = useMutation({
    mutationFn: () => moveToTrash(id),
    onSuccess: () => {
      toast.success('Message deplace a la corbeille')
      invalidate()
      navigate(-1)
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  })
  const restoreM = useMutation({
    mutationFn: () => restoreMessage(id),
    onSuccess: () => {
      toast.success('Message restaure')
      invalidate()
      qc.invalidateQueries({ queryKey: ['message', id] })
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  })
  const permDeleteM = useMutation({
    mutationFn: () => deletePermanent(id),
    onSuccess: () => {
      toast.success('Supprime definitivement')
      invalidate()
      navigate('/trash')
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  })
  const markUnreadM = useMutation({
    mutationFn: () => markRead(id, false),
    onSuccess: () => {
      toast.success('Marque comme non lu')
      invalidate()
      navigate(-1)
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-[color:var(--color-ink-muted)]">
        <Spinner /> <span className="ml-2 text-sm">Chargement...</span>
      </div>
    )
  }
  if (error || !message) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-sm text-red-700">Impossible de charger ce message.</div>
    )
  }

  const inTrash = message.currentFolder === 'TRASH'
  const isRecipient = message.recipients.some((r) => r.userId === user?.id)

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className="btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <div className="grow" />
        {!message.draft && !inTrash && (
          <>
            <button
              className="btn-secondary"
              onClick={() => navigate(`/compose?replyTo=${message.id}`)}
            >
              <Reply className="h-4 w-4" /> Repondre
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate(`/compose?replyTo=${message.id}&all=1`)}
            >
              <ReplyAll className="h-4 w-4" /> Repondre a tous
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate(`/compose?forward=${message.id}`)}
            >
              <Forward className="h-4 w-4" /> Transferer
            </button>
          </>
        )}
        {isRecipient && !inTrash && (
          <button className="btn-ghost" onClick={() => markUnreadM.mutate()}>
            <MailOpen className="h-4 w-4" /> Non lu
          </button>
        )}
        {inTrash ? (
          <>
            <button className="btn-secondary" onClick={() => restoreM.mutate()}>
              <RotateCcw className="h-4 w-4" /> Restaurer
            </button>
            <button className="btn-danger" onClick={() => setConfirmPermanent(true)}>
              <Trash2 className="h-4 w-4" /> Supprimer definitivement
            </button>
          </>
        ) : (
          <button className="btn-danger" onClick={() => trashM.mutate()}>
            <Trash2 className="h-4 w-4" /> Supprimer
          </button>
        )}
      </div>

      <article className="card p-6">
        <header className="mb-4">
          <h1 className="text-xl font-semibold">{message.subject || '(sans objet)'}</h1>
          {message.draft && (
            <span className="badge mt-2 bg-amber-100 text-amber-800">Brouillon</span>
          )}
        </header>
        <div className="flex items-start gap-3 border-b pb-4">
          <Avatar name={message.senderDisplayName ?? message.senderEmail ?? '?'} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">
              {message.senderDisplayName ?? '?'}
            </div>
            <div className="text-xs text-[color:var(--color-ink-muted)]">{message.senderEmail}</div>
            <div className="mt-1 text-xs text-[color:var(--color-ink-muted)]">
              A :{' '}
              {message.recipients
                .filter((r) => r.type !== 'BCC' || message.senderId === user?.id)
                .map((r) => r.displayName)
                .join(', ') || '(aucun)'}
            </div>
            <div className="text-xs text-[color:var(--color-ink-muted)]">
              {formatFull(message.sentAt ?? message.createdAt)}
            </div>
          </div>
        </div>
        <div className="prose-body max-w-prose py-5">{message.body}</div>

        {message.attachments.length > 0 && (
          <section className="border-t pt-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Paperclip className="h-4 w-4" />
              Pieces jointes ({message.attachments.length})
            </h2>
            <ul className="space-y-2">
              {message.attachments.map((a) => (
                <li key={a.id}>
                  <a
                    href={attachmentDownloadUrl(a.id)}
                    className="flex items-center justify-between rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm hover:bg-[color:var(--color-surface-muted)]"
                    download={a.filename}
                  >
                    <span className="truncate">{a.filename}</span>
                    <span className="flex items-center gap-2 text-xs text-[color:var(--color-ink-muted)]">
                      {formatFileSize(a.size)}
                      <Download className="h-4 w-4" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <ConfirmDialog
        open={confirmPermanent}
        title="Supprimer definitivement ?"
        description="Cette action est irreversible. Le message sera supprime de votre corbeille."
        confirmLabel="Supprimer"
        danger
        onCancel={() => setConfirmPermanent(false)}
        onConfirm={() => {
          setConfirmPermanent(false)
          permDeleteM.mutate()
        }}
      />
    </div>
  )
}
