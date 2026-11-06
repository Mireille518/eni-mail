import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, CheckCircle, Loader2, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Spinner } from '../../components/ui/Spinner'
import { apiErrorMessage } from '../../services/apiClient'
import {
  createUser, disableUser, searchUsers, updateUser,
  type CreateUserPayload,
} from '../../services/usersApi'
import type { Role, UserDto } from '../../types/api'

export function AdminUsersPage() {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [creating, setCreating] = useState(false)
  const [confirmDisable, setConfirmDisable] = useState<UserDto | null>(null)
  const qc = useQueryClient()

  const q = useQuery({
    queryKey: ['admin-users', query, role],
    queryFn: () => searchUsers(query || undefined, (role || undefined) as Role | undefined, 0, 50),
  })

  const reactivate = useMutation({
    mutationFn: (id: string) => updateUser(id, { status: 'ACTIVE' }),
    onSuccess: () => { toast.success('Compte reactive'); qc.invalidateQueries({ queryKey: ['admin-users'] }) },
    onError: (e) => toast.error(apiErrorMessage(e)),
  })

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Gestion des utilisateurs</h1>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Nouveau compte
        </button>
      </div>

      <div className="card mb-4 p-3">
        <div className="flex flex-wrap gap-2">
          <input className="input flex-1 min-w-[200px]" placeholder="Rechercher (nom, email)..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="input w-auto" value={role} onChange={(e) => setRole(e.target.value as Role | '')}>
            <option value="">Tous les roles</option>
            <option value="ROLE_ETUDIANT">Etudiants</option>
            <option value="ROLE_ENSEIGNANT">Enseignants</option>
            <option value="ROLE_ADMIN">Administrateurs</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {q.isLoading ? (
          <div className="flex items-center justify-center p-8 text-[color:var(--color-ink-muted)]"><Spinner /> <span className="ml-2 text-sm">Chargement...</span></div>
        ) : !q.data || q.data.content.length === 0 ? (
          <div className="p-8 text-center text-sm text-[color:var(--color-ink-muted)]">Aucun utilisateur</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--color-surface-muted)] text-left text-xs uppercase tracking-wide text-[color:var(--color-ink-muted)]">
              <tr>
                <th className="px-4 py-2">Nom</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Filiere</th>
                <th className="px-4 py-2">Promotion</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {q.data.content.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.role.replace('ROLE_', '')}</td>
                  <td className="px-4 py-2">{u.filiere}</td>
                  <td className="px-4 py-2">{u.promotion}</td>
                  <td className="px-4 py-2">
                    {u.status === 'ACTIVE' ? (
                      <span className="badge bg-emerald-100 text-emerald-700">Actif</span>
                    ) : (
                      <span className="badge bg-red-100 text-red-700">Desactive</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      {u.status === 'ACTIVE' ? (
                        <button className="btn-ghost text-xs" onClick={() => setConfirmDisable(u)}>
                          <Ban className="h-3.5 w-3.5" /> Desactiver
                        </button>
                      ) : (
                        <button className="btn-ghost text-xs" onClick={() => reactivate.mutate(u.id)}>
                          <CheckCircle className="h-3.5 w-3.5" /> Reactiver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            qc.invalidateQueries({ queryKey: ['admin-users'] })
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDisable}
        title={`Desactiver ${confirmDisable?.firstName ?? ''} ${confirmDisable?.lastName ?? ''} ?`}
        description="L'utilisateur ne pourra plus se connecter mais ses messages resteront visibles."
        danger
        onCancel={() => setConfirmDisable(null)}
        onConfirm={async () => {
          if (!confirmDisable) return
          try {
            await disableUser(confirmDisable.id)
            toast.success('Compte desactive')
            qc.invalidateQueries({ queryKey: ['admin-users'] })
          } catch (e) {
            toast.error(apiErrorMessage(e))
          } finally {
            setConfirmDisable(null)
          }
        }}
      />
    </div>
  )
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateUserPayload>({
    email: '', password: '', firstName: '', lastName: '', role: 'ROLE_ETUDIANT',
    filiere: '', promotion: '',
  })

  const mut = useMutation({
    mutationFn: () => createUser(form),
    onSuccess: () => { toast.success('Compte cree'); onCreated() },
    onError: (e) => toast.error(apiErrorMessage(e)),
  })

  const bind = (k: keyof CreateUserPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((cur) => ({ ...cur, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-base font-semibold">Nouveau compte utilisateur</h2>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <form className="space-y-3 p-5" onSubmit={(e) => { e.preventDefault(); mut.mutate() }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium">Prenom</label>
              <input className="input" value={form.firstName} onChange={bind('firstName')} required />
            </div>
            <div>
              <label className="text-xs font-medium">Nom</label>
              <input className="input" value={form.lastName} onChange={bind('lastName')} required />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium">Email</label>
              <input type="email" className="input" value={form.email} onChange={bind('email')} required />
            </div>
            <div>
              <label className="text-xs font-medium">Mot de passe initial</label>
              <input type="password" className="input" value={form.password} onChange={bind('password')} minLength={8} required />
            </div>
            <div>
              <label className="text-xs font-medium">Role</label>
              <select className="input" value={form.role} onChange={bind('role')}>
                <option value="ROLE_ETUDIANT">Etudiant</option>
                <option value="ROLE_ENSEIGNANT">Enseignant</option>
                <option value="ROLE_ADMIN">Administrateur</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Filiere</label>
              <input className="input" value={form.filiere ?? ''} onChange={bind('filiere')} />
            </div>
            <div>
              <label className="text-xs font-medium">Promotion</label>
              <input className="input" value={form.promotion ?? ''} onChange={bind('promotion')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn-primary" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Creer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
