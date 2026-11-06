import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { listGroups } from '../../services/groupsApi'
import { searchUsers } from '../../services/usersApi'
import type { GroupDto, UserDto } from '../../types/api'
import { cn } from '../../lib/cn'

interface Props {
  users: UserDto[]
  groups: GroupDto[]
  onAddUser: (u: UserDto) => void
  onRemoveUser: (id: string) => void
  onAddGroup: (g: GroupDto) => void
  onRemoveGroup: (id: string) => void
}

export function RecipientPicker({
  users, groups, onAddUser, onRemoveUser, onAddGroup, onRemoveGroup,
}: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const usersQ = useQuery({
    queryKey: ['users-search', query],
    queryFn: () => searchUsers(query || undefined, undefined, 0, 10),
    enabled: open && query.length > 0,
  })

  const groupsQ = useQuery({
    queryKey: ['groups-search'],
    queryFn: () => listGroups(undefined, 0, 50),
    enabled: open,
    staleTime: 60_000,
  })

  const filteredGroups = useMemo(() => {
    if (!groupsQ.data) return []
    if (!query) return groupsQ.data.content.slice(0, 8)
    return groupsQ.data.content.filter((g) =>
      g.name.toLowerCase().includes(query.toLowerCase()),
    ).slice(0, 8)
  }, [groupsQ.data, query])

  const userIds = new Set(users.map((u) => u.id))
  const groupIds = new Set(groups.map((g) => g.id))

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-white px-2 py-1.5">
        {users.map((u) => (
          <span key={u.id} className="badge bg-[color:var(--color-brand-100)] text-[color:var(--color-brand-800)]">
            {u.firstName} {u.lastName}
            <button
              type="button"
              className="ml-1 text-[color:var(--color-brand-700)] hover:text-red-600"
              onClick={() => onRemoveUser(u.id)}
              aria-label={`Retirer ${u.firstName}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {groups.map((g) => (
          <span key={g.id} className="badge bg-indigo-100 text-indigo-800">
            Groupe : {g.name}
            <button
              type="button"
              className="ml-1 hover:text-red-600"
              onClick={() => onRemoveGroup(g.id)}
              aria-label={`Retirer groupe ${g.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          className="flex-1 bg-transparent px-1 py-1 text-sm focus:outline-none"
          placeholder={users.length + groups.length === 0 ? 'Rechercher un destinataire...' : ''}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>

      {open && (query.length > 0 || (groupsQ.data && groupsQ.data.content.length > 0)) && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-72 overflow-auto rounded-md border bg-white shadow-lg">
          {filteredGroups.length > 0 && (
            <>
              <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-muted)]">
                Groupes
              </div>
              {filteredGroups.map((g) => (
                <button
                  type="button"
                  key={g.id}
                  disabled={groupIds.has(g.id)}
                  onMouseDown={() => {
                    onAddGroup(g)
                    setQuery('')
                  }}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[color:var(--color-surface-muted)]',
                    groupIds.has(g.id) && 'opacity-50',
                  )}
                >
                  <span className="font-medium">{g.name}</span>
                  <span className="text-xs text-[color:var(--color-ink-muted)]">{g.memberCount} membre(s)</span>
                </button>
              ))}
            </>
          )}
          {usersQ.data && usersQ.data.content.length > 0 && (
            <>
              <div className="border-t px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-muted)]">
                Utilisateurs
              </div>
              {usersQ.data.content.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  disabled={userIds.has(u.id)}
                  onMouseDown={() => {
                    onAddUser(u)
                    setQuery('')
                  }}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[color:var(--color-surface-muted)]',
                    userIds.has(u.id) && 'opacity-50',
                  )}
                >
                  <div>
                    <div className="font-medium">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-[color:var(--color-ink-muted)]">{u.email}</div>
                  </div>
                  <span className="badge bg-[color:var(--color-surface-muted)]">{u.role.replace('ROLE_', '')}</span>
                </button>
              ))}
            </>
          )}
          {query.length > 0 && usersQ.isFetched && usersQ.data?.content.length === 0 && filteredGroups.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-[color:var(--color-ink-muted)]">
              <Search className="h-4 w-4" /> Aucun resultat
            </div>
          )}
        </div>
      )}
    </div>
  )
}
