import { useMutation } from '@tanstack/react-query'
import { Lock, Save } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Avatar } from '../../components/ui/Avatar'
import { useAuth } from '../../contexts/AuthContext'
import { apiErrorMessage } from '../../services/apiClient'
import { changeMyPassword, updateMyProfile } from '../../services/usersApi'

export function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [filiere, setFiliere] = useState(user?.filiere ?? '')
  const [promotion, setPromotion] = useState(user?.promotion ?? '')
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')

  const saveM = useMutation({
    mutationFn: () => updateMyProfile({ firstName, lastName, filiere, promotion }),
    onSuccess: () => {
      toast.success('Profil mis a jour')
      refreshUser()
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  })

  const pwdM = useMutation({
    mutationFn: () => changeMyPassword(currentPwd, newPwd),
    onSuccess: () => {
      toast.success('Mot de passe modifie')
      setCurrentPwd(''); setNewPwd('')
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  })

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-4 text-lg font-semibold">Mon profil</h1>

      <div className="card mb-4 flex items-center gap-4 p-4">
        <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="lg" />
        <div>
          <div className="text-base font-semibold">{user.firstName} {user.lastName}</div>
          <div className="text-sm text-[color:var(--color-ink-muted)]">{user.email}</div>
          <div className="text-xs text-[color:var(--color-ink-muted)]">
            Role : {user.role.replace('ROLE_', '')} - {user.filiere ?? ''} {user.promotion ?? ''}
          </div>
        </div>
      </div>

      <form className="card space-y-3 p-4" onSubmit={(e) => { e.preventDefault(); saveM.mutate() }}>
        <h2 className="text-sm font-semibold">Informations personnelles</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium">Prenom</label>
            <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Nom</label>
            <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Filiere</label>
            <input className="input" value={filiere} onChange={(e) => setFiliere(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Promotion</label>
            <input className="input" value={promotion} onChange={(e) => setPromotion(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <button className="btn-primary" disabled={saveM.isPending}>
            <Save className="h-4 w-4" /> Enregistrer
          </button>
        </div>
      </form>

      <form className="card mt-4 space-y-3 p-4" onSubmit={(e) => {
        e.preventDefault()
        if (newPwd.length < 8) { toast.error('Nouveau mot de passe trop court (8 caracteres min)'); return }
        pwdM.mutate()
      }}>
        <h2 className="text-sm font-semibold">Changer de mot de passe</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium">Mot de passe actuel</label>
            <input type="password" className="input" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Nouveau mot de passe</label>
            <input type="password" className="input" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <button className="btn-primary" disabled={pwdM.isPending}>
            <Lock className="h-4 w-4" /> Mettre a jour
          </button>
        </div>
      </form>
    </div>
  )
}
