import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Paperclip, Save, Send, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { RecipientPicker } from './RecipientPicker'
import { apiErrorMessage } from '../../services/apiClient'
import {
  deleteAttachment, uploadAttachment,
} from '../../services/attachmentsApi'
import {
  getMessage, sendMessage, updateDraft, type ComposePayload,
} from '../../services/messagesApi'
import { formatFileSize } from '../../lib/format'
import type { AttachmentDto, GroupDto, UserDto } from '../../types/api'

export function ComposePage() {
  const [params] = useSearchParams()
  const draftId = params.get('draft')
  const replyTo = params.get('replyTo')
  const replyAll = params.get('all') === '1'
  const forwardId = params.get('forward')
  const sourceId = draftId ?? replyTo ?? forwardId
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [toUsers, setToUsers] = useState<UserDto[]>([])
  const [toGroups, setToGroups] = useState<GroupDto[]>([])
  const [attachments, setAttachments] = useState<AttachmentDto[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [initializedKey, setInitializedKey] = useState<string | null>(null)

  const sourceQ = useQuery({
    queryKey: ['source-message', sourceId],
    queryFn: () => getMessage(sourceId!),
    enabled: !!sourceId,
  })

  useEffect(() => {
    const key = `${draftId ?? ''}|${replyTo ?? ''}|${forwardId ?? ''}|${replyAll ? '1' : '0'}`
    if (!sourceQ.data || initializedKey === key) return

    const m = sourceQ.data
    if (draftId) {
      setSubject(m.subject)
      setBody(m.body)
      setToUsers(m.recipients.filter((r) => r.type === 'TO').map((r) => ({
        id: r.userId,
        email: r.email ?? '',
        firstName: r.displayName,
        lastName: '',
        role: 'ROLE_ETUDIANT',
        status: 'ACTIVE',
        createdAt: '',
      } as UserDto)))
      setAttachments(m.attachments)
    } else if (replyTo) {
      setSubject(m.subject.startsWith('Re:') ? m.subject : `Re: ${m.subject}`)
      setBody(`\n\n-- Message original --\nDe : ${m.senderDisplayName}\n${m.body}`)
      const senderUser: UserDto = {
        id: m.senderId,
        email: m.senderEmail ?? '',
        firstName: m.senderDisplayName ?? '',
        lastName: '',
        role: 'ROLE_ETUDIANT',
        status: 'ACTIVE',
        createdAt: '',
      }
      const extras = replyAll
        ? m.recipients.filter((r) => r.type !== 'BCC').map((r) => ({
          id: r.userId, email: r.email ?? '', firstName: r.displayName, lastName: '',
          role: 'ROLE_ETUDIANT' as const, status: 'ACTIVE' as const, createdAt: '',
        }))
        : []
      const seen = new Set<string>()
      const merged = [senderUser, ...extras].filter((u) => {
        if (seen.has(u.id)) return false
        seen.add(u.id)
        return true
      })
      setToUsers(merged)
    } else if (forwardId) {
      setSubject(m.subject.startsWith('Tr:') ? m.subject : `Tr: ${m.subject}`)
      setBody(`\n\n-- Message transfere --\nDe : ${m.senderDisplayName}\nObjet : ${m.subject}\n\n${m.body}`)
    }
    setInitializedKey(key)
  }, [sourceQ.data, draftId, replyTo, forwardId, replyAll, initializedKey])

  const build = (asDraft: boolean): ComposePayload => ({
    subject: subject.trim(),
    body,
    toUserIds: toUsers.map((u) => u.id),
    toGroupIds: toGroups.map((g) => g.id),
    attachmentIds: attachments.map((a) => a.id),
    parentMessageId: replyTo ?? forwardId ?? null,
    asDraft,
  })

  const sendM = useMutation({
    mutationFn: (payload: ComposePayload) =>
      draftId ? updateDraft(draftId, { ...payload, asDraft: false }) : sendMessage(payload),
    onSuccess: () => {
      toast.success('Message envoye')
      qc.invalidateQueries({ queryKey: ['messages'] })
      qc.invalidateQueries({ queryKey: ['folder-counts'] })
      navigate('/sent')
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  })

  const saveM = useMutation({
    mutationFn: (payload: ComposePayload) =>
      draftId ? updateDraft(draftId, payload) : sendMessage(payload),
    onSuccess: (m) => {
      toast.success('Brouillon enregistre')
      qc.invalidateQueries({ queryKey: ['messages'] })
      qc.invalidateQueries({ queryKey: ['folder-counts'] })
      if (!draftId) {
        navigate(`/compose?draft=${m.id}`, { replace: true })
      }
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  })

  const onPickFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const f of Array.from(files)) {
        const a = await uploadAttachment(f)
        setAttachments((cur) => [...cur, a])
      }
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Upload impossible'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeAttachment = async (id: string) => {
    try {
      await deleteAttachment(id)
      setAttachments((cur) => cur.filter((a) => a.id !== id))
    } catch (e) {
      toast.error(apiErrorMessage(e))
    }
  }

  const send = () => {
    if (!subject.trim()) {
      toast.error('Objet requis')
      return
    }
    if (toUsers.length + toGroups.length === 0) {
      toast.error('Ajoutez au moins un destinataire')
      return
    }
    sendM.mutate(build(false))
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="card p-4 sm:p-6">
        <h1 className="mb-4 text-lg font-semibold">Nouveau message</h1>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[color:var(--color-ink-muted)]">A</label>
            <RecipientPicker
              users={toUsers}
              groups={toGroups}
              onAddUser={(u) => setToUsers((cur) => [...cur, u])}
              onRemoveUser={(id) => setToUsers((cur) => cur.filter((u) => u.id !== id))}
              onAddGroup={(g) => setToGroups((cur) => [...cur, g])}
              onRemoveGroup={(id) => setToGroups((cur) => cur.filter((g) => g.id !== id))}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[color:var(--color-ink-muted)]">Objet</label>
            <input
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={300}
            />
          </div>

          <div>
            <textarea
              className="input min-h-[280px] resize-y"
              placeholder="Redigez votre message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {attachments.length > 0 && (
            <ul className="space-y-2">
              {attachments.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
                  <span className="truncate">{a.filename} <span className="text-xs text-[color:var(--color-ink-muted)]">({formatFileSize(a.size)})</span></span>
                  <button className="text-[color:var(--color-ink-muted)] hover:text-red-600" onClick={() => removeAttachment(a.id)} aria-label="Retirer">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => onPickFile(e.target.files)}
              />
              <button className="btn-ghost" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                Pieces jointes
              </button>
              <button className="btn-ghost" onClick={() => saveM.mutate(build(true))} disabled={saveM.isPending}>
                <Save className="h-4 w-4" /> Enregistrer brouillon
              </button>
              {draftId && (
                <button
                  className="btn-danger"
                  onClick={() => navigate('/drafts')}
                  title="Abandonner le brouillon et revenir"
                >
                  <Trash2 className="h-4 w-4" /> Abandonner
                </button>
              )}
            </div>
            <button className="btn-primary" onClick={send} disabled={sendM.isPending}>
              {sendM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
