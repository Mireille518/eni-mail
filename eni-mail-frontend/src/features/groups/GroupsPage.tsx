import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, UserPlus, Users, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../contexts/AuthContext'
import { apiErrorMessage } from '../../services/apiClient'
import {
  addMembers, createGroup, deleteGroup, getGroup, listGroups, removeMember,
} from '../../services/groupsApi'
import { searchUsers } from '../../services/usersApi'
import type { GroupDto, UserDto } from '../../types/api'

export function GroupsPage() {
  const { hasRole } = useAuth()
  const canCreate = hasRole('ROLE_ADMIN', 'ROLE_ENSEIGNANT')
  const qc = useQueryClient()
  const [selected, setSelected] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<GroupDto | null>(null)

  const groupsQ = useQuery({ queryKey: ['groups'], queryFn: () => listGroups() })

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Groupes de diffusion</h1>
          <p className="text-xs text-[color:var(--color-ink-muted)]">Classes, sections et listes administratives</p>
        </div>
        {canCreate && (
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nouveau groupe
          </button>
        )}
      </div>

      {groupsQ.isLoading ? (
        <div className="flex items-center justify-center p-10 text-[color:var(--color-ink-muted)]">
          <Spinner /> <span className="ml-2 text-sm">Chargement...</span>
        </div>
      ) : !groupsQ.data || groupsQ.data.content.length === 0 ? (
        <EmptyState icon={Users} title="Aucun groupe" description={canCreate ? 'Creez votre premier groupe.' : 'Les enseignants et administrateurs peuvent creer des groupes.'} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groupsQ.data.content.map((g) => (
            <div key={g.id} className="card p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{g.name}</h3>
                  <p className="text-xs text-[color:var(--color-ink-muted)]">{g.memberCount} membre(s)</p>
                </div>
                {canCreate && (
                  <button className="text-[color:var(--color-ink-muted)] hover:text-red-600" onClick={() => setConfirmDelete(g)} aria-label="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {g.description && <p className="mb-3 text-xs text-[color:var(--color-ink-muted)]">{g.description}</p>}
              <button className="btn-secondary w-full" onClick={() => setSelected(g.id)}>
                Voir les membres
              </button>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CreateGroupModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            qc.invalidateQueries({ queryKey: ['groups'] })
          }}
        />
      )}

      {selected && (
        <GroupMembersModal groupId={selected} onClose={() => setSelected(null)} canManage={canCreate} />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title={`Supprimer le groupe "${confirmDelete?.name ?? ''}" ?`}
        description="Cette action est irreversible."
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return
          try {
            await deleteGroup(confirmDelete.id)
            toast.success('Groupe supprime')
            qc.invalidateQueries({ queryKey: ['groups'] })
          } catch (e) {
            toast.error(apiErrorMessage(e))
          } finally {
            setConfirmDelete(null)
          }
        }}
      />
    </div>
  )
}

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const mut = useMutation({
    mutationFn: () => createGroup({ name, description }),
    onSuccess: () => { toast.success('Groupe cree'); onCreated() },
    onError: (e) => toast.error(apiErrorMessage(e)),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-base font-semibold">Nouveau groupe</h2>
          <button onClick={onClose} aria-label="Fermer"><X className="h-4 w-4" /></button>
        </div>
        <form className="space-y-3 p-5" onSubmit={(e) => { e.preventDefault(); mut.mutate() }}>
          <div>
            <label className="text-xs font-medium">Nom</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium">Description</label>
            <textarea className="input min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn-primary" disabled={mut.isPending}>Creer</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function GroupMembersModal({ groupId, onClose, canManage }: { groupId: string; onClose: () => void; canManage: boolean }) {
  const qc = useQueryClient()
  const groupQ = useQuery({ queryKey: ['group', groupId], queryFn: () => getGroup(groupId) })
  const usersQ = useQuery({ queryKey: ['group-members-users', groupId, groupQ.data?.memberIds], queryFn: () => groupQ.data?.memberIds.length ? searchUsers(undefined, undefined, 0, 100).then((p) => p.content.filter((u) => groupQ.data!.memberIds.includes(u.id))) : Promise.resolve<UserDto[]>([]), enabled: !!groupQ.data })
  const [query, setQuery] = useState('')
  const searchQ = useQuery({ queryKey: ['users-pick', query], queryFn: () => searchUsers(query, undefined, 0, 10), enabled: query.length > 0 })

  const add = useMutation({
    mutationFn: (uid: string) => addMembers(groupId, [uid]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', groupId] })
      qc.invalidateQueries({ queryKey: ['groups'] })
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  })
  const remove = useMutation({
    mutationFn: (uid: string) => removeMember(groupId, uid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', groupId] })
      qc.invalidateQueries({ queryKey: ['groups'] })
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-base font-semibold">Membres du groupe {groupQ.data?.name ?? ''}</h2>
          <button onClick={onClose} aria-label="Fermer"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">
          {canManage && (
            <div className="relative mb-3">
              <input
                className="input"
                placeholder="Ajouter un membre..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {searchQ.data && searchQ.data.content.length > 0 && query && (
                <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-md border bg-white shadow-md">
                  {searchQ.data.content.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[color:var(--color-surface-muted)]"
                        onClick={() => { add.mutate(u.id); setQuery('') }}
                      >
                        <span>{u.firstName} {u.lastName} <span className="text-xs text-[color:var(--color-ink-muted)]">{u.email}</span></span>
                        <UserPlus className="h-4 w-4 text-[color:var(--color-brand-600)]" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <ul className="divide-y">
            {(usersQ.data ?? []).map((u) => (
              <li key={u.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-[color:var(--color-ink-muted)]">{u.email}</div>
                </div>
                {canManage && (
                  <button className="btn-ghost text-sm" onClick={() => remove.mutate(u.id)}>
                    <Trash2 className="h-4 w-4" /> Retirer
                  </button>
                )}
              </li>
            ))}
            {(usersQ.data ?? []).length === 0 && (
              <li className="py-6 text-center text-sm text-[color:var(--color-ink-muted)]">Aucun membre</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
