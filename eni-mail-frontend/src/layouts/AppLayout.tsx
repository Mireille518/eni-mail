import { useQuery } from '@tanstack/react-query'
import {
  Edit3, Inbox as InboxIcon, Send, FileText, Trash2, Users, Shield, LogOut, Menu, Search, X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar } from '../components/ui/Avatar'
import { Logo } from '../components/ui/Logo'
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
    <div className="flex min-h-screen bg-[color:var(--color-surface-muted)]">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-[color:var(--color-border)] bg-white transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-[color:var(--color-border)] px-4">
          <Link to="/inbox" className="focus:outline-none" onClick={() => setSidebarOpen(false)}>
            <Logo size="md" />
          </Link>
          <button
            className="lg:hidden p-1 text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3">
          <Link
            to="/compose"
            onClick={() => setSidebarOpen(false)}
            className="btn-primary w-full"
          >
            <Edit3 className="h-4 w-4" />
            Nouveau message
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-[color:var(--color-brand-50)] text-[color:var(--color-brand-800)] shadow-[inset_2px_0_0_var(--color-brand-600)]'
                    : 'text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-muted)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0',
                      isActive
                        ? 'text-[color:var(--color-brand-600)]'
                        : 'text-[color:var(--color-ink-subtle)] group-hover:text-[color:var(--color-ink-muted)]',
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={cn(
                        'badge tabular-nums',
                        isActive
                          ? 'bg-[color:var(--color-brand-600)] text-white'
                          : 'bg-[color:var(--color-surface-strong)] text-[color:var(--color-ink-muted)]',
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {hasRole('ROLE_ADMIN') && (
            <>
              <div className="mt-5 mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-subtle)]">
                Administration
              </div>
              <NavLink
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-[color:var(--color-brand-50)] text-[color:var(--color-brand-800)] shadow-[inset_2px_0_0_var(--color-brand-600)]'
                      : 'text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-muted)]',
                  )
                }
              >
                <Shield className="h-[18px] w-[18px] shrink-0 text-[color:var(--color-ink-subtle)] group-hover:text-[color:var(--color-ink-muted)]" />
                <span>Tableau de bord</span>
              </NavLink>
              <NavLink
                to="/admin/users"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-[color:var(--color-brand-50)] text-[color:var(--color-brand-800)] shadow-[inset_2px_0_0_var(--color-brand-600)]'
                      : 'text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-muted)]',
                  )
                }
              >
                <Users className="h-[18px] w-[18px] shrink-0 text-[color:var(--color-ink-subtle)] group-hover:text-[color:var(--color-ink-muted)]" />
                <span>Utilisateurs</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-[color:var(--color-border)] p-3">
          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-[color:var(--color-surface-muted)]"
          >
            <Avatar name={user ? `${user.firstName} ${user.lastName}` : ''} src={user?.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-[color:var(--color-ink-strong)]">
                {user ? `${user.firstName} ${user.lastName}` : ''}
              </div>
              <div className="truncate text-xs text-[color:var(--color-ink-muted)]">{user?.email}</div>
            </div>
          </Link>
          <button
            type="button"
            className="btn-ghost mt-1 w-full justify-start text-xs"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Se deconnecter
          </button>
        </div>
      </aside>

      {/* Scrim mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[color:var(--color-border)] bg-white/85 px-4 backdrop-blur">
          <button
            className="lg:hidden rounded-md p-1.5 text-[color:var(--color-ink-muted)] hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-ink)]"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo mobile (visible uniquement quand la sidebar est cachee) */}
          <Link to="/inbox" className="lg:hidden">
            <Logo size="sm" withWordmark={false} />
          </Link>

          <form onSubmit={onSearch} className="flex max-w-xl flex-1 items-center" role="search">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink-subtle)]" />
              <input
                name="q"
                defaultValue={new URLSearchParams(location.search).get('q') ?? ''}
                placeholder="Rechercher un message, un contact..."
                className="input pl-9"
                aria-label="Rechercher dans ENI Mail"
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
