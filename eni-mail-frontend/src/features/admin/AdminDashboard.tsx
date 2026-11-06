import { useQuery } from '@tanstack/react-query'
import { Mail, Shield, UserCog, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fetchAdminStats } from '../../services/adminApi'
import { Spinner } from '../../components/ui/Spinner'

export function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: fetchAdminStats })

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <h1 className="mb-6 text-lg font-semibold">Tableau de bord administrateur</h1>

      {isLoading ? (
        <div className="flex items-center gap-2 text-[color:var(--color-ink-muted)]"><Spinner /> Chargement...</div>
      ) : !data ? (
        <div>Donnees indisponibles.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Utilisateurs" value={data.totalUsers} icon={Users} accent="bg-sky-100 text-sky-700" />
          <Stat label="Etudiants" value={data.totalStudents} icon={UserCog} accent="bg-emerald-100 text-emerald-700" />
          <Stat label="Enseignants" value={data.totalTeachers} icon={UserCog} accent="bg-amber-100 text-amber-700" />
          <Stat label="Administrateurs" value={data.totalAdmins} icon={Shield} accent="bg-indigo-100 text-indigo-700" />
          <Stat label="Messages envoyes" value={data.totalMessages} icon={Mail} accent="bg-rose-100 text-rose-700" />
          <Stat label="Groupes" value={data.totalGroups} icon={Users} accent="bg-cyan-100 text-cyan-700" />
          <Stat label="Comptes actifs" value={data.activeUsers} icon={UserCog} accent="bg-lime-100 text-lime-700" />
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: number; icon: LucideIcon; accent: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-ink-muted)]">{label}</span>
        <span className={`rounded-md p-2 ${accent}`}><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-2 text-2xl font-semibold">{value.toLocaleString('fr-FR')}</div>
    </div>
  )
}
