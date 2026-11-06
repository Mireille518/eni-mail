import { useQuery } from '@tanstack/react-query'
import {
  Edit3, Inbox as InboxIcon, Send, FileText, Trash2, Users, Shield, LogOut, Menu, Search, X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar } from '../components/ui/Avatar'
import { useAuth } from '../contexts/AuthContext'
import { folderCounts } from '../services/messagesApi'
import { cn } from '../lib/cn'

export function AppLayout() {
  const { user, logout, hasRole } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const countsQuery = useQuery({
    queryKey: ['folder-counts'],
    queryFn: folderCounts,
    enabled: !!user,
    refetchInterval: 30_000,
  })

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const q = (new FormData(form).get('q') as string)?.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  const nav = [
    { to: '/inbox', label: 'Boite de reception', icon: InboxIcon, badge: countsQuery.data?.inboxUnread },
    { to: '/sent', label: 'Messages envoyes', icon: Send },
    { to: '/drafts', label: 'Brouillons', icon: FileText, badge: countsQuery.data?.drafts },
    { to: '/trash', label: 'Corbeille', icon: Trash2 },
    { to: '/groups', label: 'Groupes', icon: Users },
  ]

  return (
    <div className="flex min-h-screen bg-[color:var(--color-surface)]">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r bg-white transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/inbox" className="flex items-center gap-2 font-semibold text-[color:var(--color-brand-700)]">
            <div className="rounded bg-[color:var(--color-brand-600)] p-1 text-white">
              <InboxIcon className="h-5 w-5" />
            </div>
            ENI Mail
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-3">
          <Link
            to="/compose"
            onClick={() => setSidebarOpen(false)}
            className="btn-primary w-full"
          >
            <Edit3 className="h-4 w-4" /> Nouveau message
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-[color:var(--color-brand-100)] text-[color:var(--color-brand-800)]'
                    : 'text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-muted)]',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="badge bg-[color:var(--color-brand-600)] text-white">{item.badge}</span>
              )}
            </NavLink>
          ))}
          {hasRole('ROLE_ADMIN') && (
            <>
              <div className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-muted)]">
                Administration
              </div>
              <NavLink
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-[color:var(--color-brand-100)] text-[color:var(--color-brand-800)]'
                      : 'text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-muted)]',
                  )
                }
              >
                <Shield className="h-4 w-4" />
                <span>Tableau de bord</span>
              </NavLink>
              <NavLink
                to="/admin/users"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-[color:var(--color-brand-100)] text-[color:var(--color-brand-800)]'
                      : 'text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-muted)]',
                  )
                }
              >
                <Users className="h-4 w-4" />
                <span>Utilisateurs</span>
              </NavLink>
            </>
          )}
        </nav>
        <div className="border-t p-3">
          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-[color:var(--color-surface-muted)]"
          >
            <Avatar name={user ? `${user.firstName} ${user.lastName}` : ''} src={user?.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {user ? `${user.firstName} ${user.lastName}` : ''}
              </div>
              <div className="truncate text-xs text-[color:var(--color-ink-muted)]">{user?.email}</div>
            </div>
          </Link>
          <button
            type="button"
            className="btn-ghost mt-1 w-full justify-start text-sm text-[color:var(--color-ink-muted)]"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Se deconnecter
          </button>
        </div>
      </aside>

      {/* Scrim mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <form onSubmit={onSearch} className="flex max-w-xl flex-1 items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink-muted)]" />
              <input
                name="q"
                defaultValue={new URLSearchParams(location.search).get('q') ?? ''}
                placeholder="Rechercher dans les messages..."
                className="input pl-9"
              />
            </div>
          </form>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
